import { Global, Inject, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { TenantDrizzleService } from '@db/tenant-drizzle.service';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { AppConfigModule } from '@modules/config/app-config.module';
import { DATABASE_CONFIG } from '@modules/config/config.tokens';
import type { DatabaseConfig } from '@modules/config/config.schema';
import { schema } from '@db/schema';
import { DRIZZLE, PG_POOL, type DrizzleDb } from '@db/drizzle.tokens';

export { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';

@Injectable()
class PoolManager implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end().catch(() => {});
  }
}

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: PG_POOL,
      useFactory: (db: DatabaseConfig): Pool =>
        new Pool({
          host: db.host,
          port: db.port,
          user: db.username,
          password: db.password,
          database: db.name,
        }),
      inject: [DATABASE_CONFIG],
    },
    PoolManager,
    {
      provide: DRIZZLE,
      useFactory: (pool: Pool): DrizzleDb => drizzle(pool, { schema }),
      inject: [PG_POOL],
    },
    TenantDrizzleService,
  ],
  exports: [DRIZZLE, TenantDrizzleService],
})
/**
 * NestJS DI module wiring the Drizzle surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class DrizzleModule {}
