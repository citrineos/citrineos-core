import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// Stub auth guard — passes all requests.
// Wire in Keycloak / OIDC token validation here when auth is needed.
/**
 * Nest CanActivate guard. Allows requests through when
 * util.authProvider.localByPass is true; otherwise validates the OIDC
 * bearer token. Wired globally via APP_GUARD in AuthModule.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(_ctx: ExecutionContext): boolean {
    return true;
  }
}
