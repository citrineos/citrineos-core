import { inject, injectable } from 'inversify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { SystemConfig } from './types.js';
import { ContainerType } from './ContainerType.js';

@injectable()
export class CitrineOSLogger extends Logger<ILogObj> {
  constructor(
    @inject(ContainerType.SystemConfig)
    public readonly systemConfig: SystemConfig,
  ) {
    const isCloud = process.env.DEPLOYMENT_TARGET === 'cloud';
    const loggerSettings = {
      name: 'CitrineOS Logger',
      minLevel: systemConfig.logLevel,
      hideLogPositionForProduction: systemConfig.env === 'production',
      type: isCloud ? ('json' as const) : ('pretty' as const),
    };
    super(loggerSettings);
  }
}
