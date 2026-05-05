import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '@modules/config/app-config.module';
import { AmqpService } from '@amqp/amqp.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [AmqpService],
  exports: [AmqpService],
})
/**
 * NestJS DI module wiring the Amqp surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class AmqpModule {}
