import { inject, singleton } from "tsyringe";
import { SystemConfigService } from "../config/config/system.config.service";
import { type ILogObj, Logger } from "tslog";

@singleton()
export class LoggerService {
  logger: Logger<ILogObj>;

  constructor(
    @inject(SystemConfigService)
    private readonly configService?: SystemConfigService
  ) {
    this.logger = new Logger<ILogObj>({
      name: "CitrineOS Logger",
      minLevel: this.configService?.systemConfig.logLevel,
      hideLogPositionForProduction:
        this.configService?.systemConfig.env === "production",
      // Disable colors for cloud deployment as some cloude logging environments such as cloudwatch can not interpret colors
      stylePrettyLogs: process.env.DEPLOYMENT_TARGET !== "cloud",
    });
  }
}
