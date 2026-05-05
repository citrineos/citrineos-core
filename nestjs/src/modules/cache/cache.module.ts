// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Global, Logger, Module } from '@nestjs/common';
import { CACHE_CONFIG } from '@modules/config/config.tokens';
import type { CacheConfig } from '@modules/config/config.schema';
import { CacheService } from '@cache/cache.service';
import { RedisCacheService } from '@cache/redis-cache.service';

const logger = new Logger('CacheModule');

/**
 * Picks the cache backend based on `config.util.cache`:
 *   - `redis: { url: ... }` → RedisCacheService (multi-process safe)
 *   - otherwise → in-memory `CacheService` (default)
 *
 * The module always exports the concrete `CacheService` class as the token,
 * so consumers don't have to know which backend they got.
 */
@Global()
@Module({
  providers: [
    {
      provide: CacheService,
      useFactory: (cache: CacheConfig): CacheService => {
        const redis = cache.redis;
        if (redis?.url || (redis?.host && redis?.port)) {
          const url = redis.url ?? `redis://${redis.host}:${redis.port}`;
          logger.log(`Using Redis cache backend (${url})`);
          return new RedisCacheService(url) as unknown as CacheService;
        }
        logger.log('Using in-memory cache backend');
        return new CacheService();
      },
      inject: [CACHE_CONFIG],
    },
  ],
  exports: [CacheService],
})
/**
 * NestJS DI module wiring the Cache surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class CacheModule {}
