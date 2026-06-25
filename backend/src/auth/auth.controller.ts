import {
  Controller, Post, Get, Body, Req, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminUser } from '../common/decorators/admin-user.decorator';
import { ROLE_PERMISSIONS } from '../roles/permissions.config';
import { RegisterDto, LoginDto, GoogleCallbackDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return { success: true, data: await this.authService.register(dto) };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request, @Body() dto: LoginDto) {
    const user = await this.authService.login(dto);
    req.session['user'] = user;
    // Explicitly save so the Set-Cookie header is guaranteed before response is sent
    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve())),
    );
    return { success: true, data: user };
  }

  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  async googleCallback(@Req() req: Request, @Body() dto: GoogleCallbackDto) {
    const user = await this.authService.googleAuth(dto.id_token);
    req.session['user'] = user;
    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve())),
    );
    return { success: true, data: user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminAuthGuard)
  async logout(@Req() req: Request) {
    // Destroys the session in Redis and clears the cookie on the client
    await new Promise<void>((resolve, reject) =>
      req.session.destroy((err) => (err ? reject(err) : resolve())),
    );
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Req() req: Request, @Body() dto: VerifyEmailDto) {
    // Auto-login after email verification — no need for a separate login step
    const user = await this.authService.verifyEmail(dto.token);
    req.session['user'] = user;
    return { success: true, data: user };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return { success: true, data: await this.authService.forgotPassword(dto.email) };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return { success: true, data: await this.authService.resetPassword(dto.token, dto.new_password) };
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  async me(@AdminUser() sessionUser: any) {
    // Re-fetch from DB to get the latest user state (role changes, deactivation, etc.)
    // Session data could be stale if the user was modified after login
    const user = await this.prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) throw new Error('User not found');
    return {
      success: true,
      data: { ...user, permissions: Array.from(ROLE_PERMISSIONS[user.role] || []) },
    };
  }
}
