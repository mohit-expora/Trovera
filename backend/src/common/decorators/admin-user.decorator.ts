import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// @AdminUser() — injects the full session user populated by AdminAuthGuard.
// @AdminUser('id') — injects a single field, e.g. the user's id.
// Usage:
//   listBooks(@AdminUser() user: SessionUser)
//   getProfile(@AdminUser('id') userId: number)
export const AdminUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return data ? user?.[data] : user;
});
