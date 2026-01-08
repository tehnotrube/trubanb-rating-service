import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard that extracts user information from Kong-injected headers
 * Kong validates the JWT and injects these headers:
 * - X-User-Id
 * - X-User-Email
 * - X-User-Role
 */
@Injectable()
export class KongJwtGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Extract user information from Kong-injected headers
    const userId = request.headers['x-user-id'];
    const userEmail = request.headers['x-user-email'];
    const userRole = request.headers['x-user-role'];

    if (!userId) {
      throw new UnauthorizedException('No user information found in request headers');
    }

    // Attach user to request for use in controllers
    request.user = {
      id: userId,
      email: userEmail,
      role: userRole,
    };

    return true;
  }
}
