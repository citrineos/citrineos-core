import { KoaMiddlewareInterface, Middleware } from 'routing-controllers';
import { HttpStatus } from '@citrineos/base';
import { Context } from 'vm';
import { buildOcpiErrorResponse } from '../ocpi.error.response';

const permittedRoutes: string[] = ['/docs', '/docs/spec', '/favicon.png'];

@Middleware({ type: 'before' })
export class AuthMiddleware implements KoaMiddlewareInterface {
  throwError(ctx: Context) {
    ctx.throw(
      HttpStatus.UNAUTHORIZED,
      JSON.stringify(buildOcpiErrorResponse(HttpStatus.UNAUTHORIZED)),
    );
  }

  async use(ctx: Context, next: (err?: any) => Promise<any>): Promise<any> {
    const authHeader = ctx.request.headers['authorization'];

    if (!permittedRoutes.includes(ctx.request.originalUrl)) {
      if (!authHeader) {
        this.throwError(ctx);
      }

      try {
        // todo implement authentication logic here
        const token = authHeader.split(' ')[1];
        const isValid = await this.validateToken(token);
        if (!isValid) {
          this.throwError(ctx);
        }
      } catch (error) {
        this.throwError(ctx);
      }
    }

    return next();
  }

  private async validateToken(token: string): Promise<boolean> {
    // todo placeholder implement token validation logic here
    return token === '123'; // Example logic
  }
}
