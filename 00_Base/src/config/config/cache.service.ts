import {inject, singleton} from "tsyringe";
import {RedisCache} from "./cache/redis";
import {MemoryCache} from "./cache/memory";
import {ICache} from "../../interfaces/cache/cache";
import {SystemConfigService} from "./system.config.service";

@singleton()
export class CacheService {
  readonly cache: ICache

  constructor(@inject(SystemConfigService) private readonly configService?: SystemConfigService) {
    this.cache = (this.configService?.systemConfig?.util.cache.redis
      ? new RedisCache({
        socket: {
          host: this.configService?.systemConfig.util.cache.redis.host,
          port: this.configService?.systemConfig.util.cache.redis.port
        }
      })
      : new MemoryCache())
  }
}