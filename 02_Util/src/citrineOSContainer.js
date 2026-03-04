import { ContainerType } from '@citrineos/base/dist/config/ContainerType.js';
import { Container } from 'inversify';
export class CitrineOSContainer extends Container {
  constructor(bootstrapConfig, systemConfig, options) {
    super(options);
    this.bind(ContainerType.SystemConfig).toConstantValue({
      ...bootstrapConfig,
      ...systemConfig,
    });
    this.bind(ContainerType.AppName).toConstantValue(process.env.APP_NAME?.toLowerCase());
  }
}
//# sourceMappingURL=citrineOSContainer.js.map
