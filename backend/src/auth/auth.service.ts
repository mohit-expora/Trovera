import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as https from 'https';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_PERMISSIONS } from '../roles/permissions.config';
import {
  AuthenticationError,
  ConflictError,
  EmailNotVerifiedError,
  InactiveUserError,
  InvalidTokenError,
} from '../common/exceptions/app.exception';
import { RegisterDto, LoginDto } from './dto/auth.dto';

export interface SessionUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  permissions: string[];
  avatar_url?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, 12);
  }

  private verifyPassword(plain: string, hashed: string): boolean {
    return bcrypt.compareSync(plain, hashed);
  }

  private generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  private buildSessionUser(user: any): SessionUser {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      permissions: Array.from(ROLE_PERMISSIONS[user.role] || []),
      avatar_url: user.avatar_url,
    };
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

  async login(dto: LoginDto): Promise<SessionUser> {
    const allowedDomains = ['expora.in', 'trovera.in'];
    const emailDomain = dto.email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      throw new AuthenticationError('Only @expora.in and @trovera.in email addresses are allowed');
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.password_hash) throw new AuthenticationError('Invalid email or password');
    if (!this.verifyPassword(dto.password, user.password_hash)) throw new AuthenticationError('Invalid email or password');
    if (!user.is_active) throw new InactiveUserError();
    if (!user.is_email_verified) throw new EmailNotVerifiedError();
    return this.buildSessionUser(user);
  }

  async googleAuth(idToken: string): Promise<SessionUser> {
    const googleData = await this.verifyGoogleIdToken(idToken);

    const allowedDomains = ['expora.in', 'trovera.in'];
    const emailDomain = googleData.email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      throw new AuthenticationError('Only @expora.in and @trovera.in email addresses are allowed');
    }

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

    return this.buildSessionUser(user);
  }

  async verifyEmail(token: string): Promise<SessionUser> {
    const vt = await this.prisma.emailVerificationToken.findUnique({ where: { token } });
    if (!vt || vt.used_at || vt.expires_at < new Date()) {
      throw new InvalidTokenError('Verification link is invalid or has expired');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { used_at: new Date() } }),
      this.prisma.user.update({ where: { id: vt.user_id }, data: { is_email_verified: true } }),
    ]);

    const user = await this.prisma.user.findUnique({ where: { id: vt.user_id } });
    return this.buildSessionUser(user);
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
