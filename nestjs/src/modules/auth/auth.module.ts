import { Module } from '@nestjs/common';
import { AuthGuard } from '@auth/auth.guard';

@Module({
  providers: [AuthGuard],
  exports: [AuthGuard],
})
/**
 * NestJS DI module wiring the Auth surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class AuthModule {}
