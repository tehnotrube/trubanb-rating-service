import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { UserRole } from './roles.guard';

/**
 * Guard that extracts user information from Kong-injected headers
 * Kong validates the JWT and injects these headers:
 * - X-User-Id
 * - X-User-Email
 * - X-User-Role
 */
interface RequestWithHeaders {
  headers: {
    'x-user-id'?: string;
    'x-user-email'?: string;
    'x-user-role'?: string;
  };
  user?: AuthenticatedUser;
}

@Injectable()
export class KongJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();

    // Extract user information from Kong-injected headers
    const userId = request.headers['x-user-id'];
    const userEmail = request.headers['x-user-email'];
    const userRole = request.headers['x-user-role'] as UserRole | undefined;

    if (!userId) {
      throw new UnauthorizedException(
        'No user information found in request headers',
      );
    }

    // Attach user to request for use in controllers
    const user: AuthenticatedUser = {
      id: userId,
      email: userEmail ?? '',
      role: userRole ?? UserRole.GUEST,
    };

    request.user = user;

    return true;
  }
}
