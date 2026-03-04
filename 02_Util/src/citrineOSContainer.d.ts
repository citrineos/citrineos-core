import type { BootstrapConfig } from '@citrineos/base/dist/config/bootstrap.config.js';
import type { SystemConfig } from '@citrineos/base/dist/config/types.js';
import type { ContainerOptions } from 'inversify';
import { Container } from 'inversify';
export declare class CitrineOSContainer extends Container {
  constructor(
    bootstrapConfig: BootstrapConfig,
    systemConfig: SystemConfig,
    options?: ContainerOptions,
  );
}
