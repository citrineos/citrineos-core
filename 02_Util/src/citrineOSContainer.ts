import type { BootstrapConfig, EventGroup, ICache, SystemConfig } from '@citrineos/base';
import { ContainerType } from '@citrineos/base';
import type { ContainerOptions } from 'inversify';
import { Container } from 'inversify';
import { RedisCache } from './cache/redis.js';
import { MemoryCache } from './cache/memory.js';

export class CitrineOSContainer extends Container {
  constructor(
    bootstrapConfig: BootstrapConfig,
    systemConfig: SystemConfig,
    options?: ContainerOptions,
  ) {
    super(options);
    this.bind<SystemConfig & BootstrapConfig>(ContainerType.SystemConfig).toConstantValue({
      ...bootstrapConfig,
      ...systemConfig,
    } as SystemConfig & BootstrapConfig);
    if (systemConfig.util.cache.redis) {
      this.bind<ICache>(ContainerType.Cache).to(RedisCache).inSingletonScope();
    } else {
      this.bind<ICache>(ContainerType.Cache).to(MemoryCache).inSingletonScope();
    }
    this.bind(ContainerType.AppName).toConstantValue(
      process.env.APP_NAME?.toLowerCase() as EventGroup,
    );
  }
}
