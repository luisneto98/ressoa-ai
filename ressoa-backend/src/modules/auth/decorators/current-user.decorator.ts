import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RoleUsuario } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  escolaId: string;
  role: RoleUsuario;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
