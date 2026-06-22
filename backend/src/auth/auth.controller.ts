import {
  Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ROLE_PERMISSIONS } from '../roles/permissions.config';
import { RegisterDto, LoginDto, GoogleCallbackDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { InvalidTokenError } from '../common/exceptions/app.exception';

const COOKIE_KEY = 'refresh_token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 3600 * 1000,
};

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
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: LoginDto) {
    const { tokenResponse, rawRefresh } = await this.authService.login(dto, req.ip);
    res.cookie(COOKIE_KEY, rawRefresh, COOKIE_OPTS);
    return { success: true, data: tokenResponse };
  }

  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  async googleCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: GoogleCallbackDto) {
    const { tokenResponse, rawRefresh } = await this.authService.googleAuth(dto.id_token, req.ip);
    res.cookie(COOKIE_KEY, rawRefresh, COOKIE_OPTS);
    return { success: true, data: tokenResponse };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[COOKIE_KEY];
    if (!rawToken) throw new InvalidTokenError('Refresh token not found');
    const { tokenResponse, rawRefresh } = await this.authService.refreshTokens(rawToken);
    res.cookie(COOKIE_KEY, rawRefresh, COOKIE_OPTS);
    return { success: true, data: tokenResponse };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentUser() user: any) {
    await this.authService.logout(user.jti, req.cookies?.[COOKIE_KEY]);
    res.clearCookie(COOKIE_KEY, { path: '/api/v1/auth' });
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Res({ passthrough: true }) res: Response, @Body() dto: VerifyEmailDto) {
    const { tokenResponse, rawRefresh } = await this.authService.verifyEmail(dto.token);
    res.cookie(COOKIE_KEY, rawRefresh, COOKIE_OPTS);
    return { success: true, data: tokenResponse };
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() jwtPayload: any) {
    const user = await this.prisma.user.findUnique({ where: { id: jwtPayload.sub } });
    if (!user) throw new Error('User not found');
    return {
      success: true,
      data: { ...user, permissions: Array.from(ROLE_PERMISSIONS[user.role] || []) },
    };
  }
}
