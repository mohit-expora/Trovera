import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthProvider, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as https from 'https';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService, TTL } from '../cache/cache.service';
import { ROLE_PERMISSIONS } from '../roles/permissions.config';
import {
  AuthenticationError,
  ConflictError,
  EmailNotVerifiedError,
  InactiveUserError,
  InvalidTokenError,
  NotFoundError,
} from '../common/exceptions/app.exception';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private cache: CacheService,
  ) {}

  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, 12);
  }

  private verifyPassword(plain: string, hashed: string): boolean {
    return bcrypt.compareSync(plain, hashed);
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  private generateRefreshToken(): { raw: string; hash: string } {
    const raw = crypto.randomBytes(64).toString('base64url');
    return { raw, hash: this.hashToken(raw) };
  }

  private parseExpiresInToSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const val = parseInt(match[1]);
    const unit = match[2];
    return unit === 's' ? val : unit === 'm' ? val * 60 : unit === 'h' ? val * 3600 : val * 86400;
  }

  private buildTokenResponse(user: { id: string; email: string; full_name: string; avatar_url: string | null; auth_provider: AuthProvider; role: UserRole; is_active: boolean; is_email_verified: boolean; phone: string | null; address: string | null; membership_id: string | null; created_at: Date }) {
    const permissions = Array.from(ROLE_PERMISSIONS[user.role] || []);
    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn', '15m');
    const jti = uuidv4();

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role, permissions, jti, type: 'access' },
      { expiresIn: accessExpiresIn },
    );

    return {
      tokenResponse: {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: this.parseExpiresInToSeconds(accessExpiresIn),
        user: { ...user, permissions },
      },
      jti,
    };
  }

  private async createSession(userId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const { tokenResponse } = this.buildTokenResponse(user);
    const { raw: rawRefresh, hash: tokenHash } = this.generateRefreshToken();
    const refreshExpireDays = this.config.get<number>('jwt.refreshExpiresDays', 7);
    const expiresAt = new Date(Date.now() + refreshExpireDays * 86400 * 1000);

    await this.prisma.refreshToken.create({
      data: { user_id: userId, token_hash: tokenHash, ip_address: ip, expires_at: expiresAt },
    });

    return { tokenResponse, rawRefresh };
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictError('An account with this email already exists');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        full_name: dto.full_name.trim(),
        password_hash: this.hashPassword(dto.password),
        auth_provider: AuthProvider.local,
        role: UserRole.member,
        is_active: true,
        is_email_verified: true,
      },
    });

    const tokenStr = this.generateSecureToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        user_id: user.id,
        token: tokenStr,
        expires_at: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    this.logger.log(`[EMAIL] Verification for ${user.email}: token=${tokenStr}`);
    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.password_hash) throw new AuthenticationError('Invalid email or password');
    if (!this.verifyPassword(dto.password, user.password_hash)) throw new AuthenticationError('Invalid email or password');
    if (!user.is_active) throw new InactiveUserError();
    if (!user.is_email_verified) throw new EmailNotVerifiedError();
    return this.createSession(user.id, ip);
  }

  async googleAuth(idToken: string, ip?: string) {
    const googleData = await this.verifyGoogleIdToken(idToken);

    let user = await this.prisma.user.findUnique({ where: { google_id: googleData.google_id } });
    if (!user) user = await this.prisma.user.findUnique({ where: { email: googleData.email.toLowerCase() } });

    if (user) {
      if (!user.is_active) throw new InactiveUserError();
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          google_id: user.google_id ?? googleData.google_id,
          avatar_url: user.avatar_url ?? googleData.avatar_url ?? undefined,
          is_email_verified: true,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: googleData.email.toLowerCase(),
          full_name: googleData.full_name || googleData.email.split('@')[0],
          auth_provider: AuthProvider.google,
          google_id: googleData.google_id,
          avatar_url: googleData.avatar_url,
          role: UserRole.member,
          is_active: true,
          is_email_verified: true,
        },
      });
    }

    return this.createSession(user.id, ip);
  }

  async refreshTokens(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const rt = await this.prisma.refreshToken.findUnique({ where: { token_hash: tokenHash } });

    if (!rt || rt.revoked_at || rt.expires_at < new Date()) {
      throw new InvalidTokenError('Refresh token is invalid or has expired');
    }

    const user = await this.prisma.user.findFirst({ where: { id: rt.user_id, is_active: true } });
    if (!user) throw new AuthenticationError('User not found or inactive');

    await this.prisma.refreshToken.update({ where: { id: rt.id }, data: { revoked_at: new Date() } });
    return this.createSession(user.id);
  }

  async logout(jti: string, rawRefreshToken?: string): Promise<void> {
    await this.cache.set(`jti:blacklist:${jti}`, '1', TTL.JTI_BLACKLIST);
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({ where: { token_hash: tokenHash }, data: { revoked_at: new Date() } });
    }
  }

  async verifyEmail(token: string) {
    const vt = await this.prisma.emailVerificationToken.findUnique({ where: { token } });
    if (!vt || vt.used_at || vt.expires_at < new Date()) {
      throw new InvalidTokenError('Verification link is invalid or has expired');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { used_at: new Date() } }),
      this.prisma.user.update({ where: { id: vt.user_id }, data: { is_email_verified: true } }),
    ]);

    return this.createSession(vt.user_id);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user && user.auth_provider === AuthProvider.local) {
      const tokenStr = this.generateSecureToken();
      await this.prisma.emailVerificationToken.create({
        data: {
          user_id: user.id,
          token: `pwd:${tokenStr}`,
          expires_at: new Date(Date.now() + 3600 * 1000),
        },
      });
      this.logger.log(`[EMAIL] Password reset for ${user.email}: token=${tokenStr}`);
    }
    return { message: 'If an account exists with this email, you will receive a password reset link.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const vt = await this.prisma.emailVerificationToken.findUnique({ where: { token: `pwd:${token}` } });
    if (!vt || vt.used_at || vt.expires_at < new Date()) {
      throw new InvalidTokenError('Password reset link is invalid or has expired');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: vt.user_id }, data: { password_hash: this.hashPassword(newPassword) } }),
      this.prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { used_at: new Date() } }),
      this.prisma.refreshToken.updateMany({ where: { user_id: vt.user_id, revoked_at: null }, data: { revoked_at: new Date() } }),
    ]);

    return { message: 'Password has been reset successfully. Please log in.' };
  }

  private async verifyGoogleIdToken(idToken: string): Promise<any> {
    const clientId = this.config.get<string>('google.clientId');
    return new Promise((resolve, reject) => {
      const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new AuthenticationError('Invalid Google token'));
            if (clientId && parsed.aud !== clientId) {
              return reject(new AuthenticationError('Invalid Google token audience'));
            }
            resolve({ google_id: parsed.sub, email: parsed.email, full_name: parsed.name, avatar_url: parsed.picture });
          } catch {
            reject(new AuthenticationError('Failed to parse Google token response'));
          }
        });
      }).on('error', () => reject(new AuthenticationError('Failed to verify Google token')));
    });
  }
}
