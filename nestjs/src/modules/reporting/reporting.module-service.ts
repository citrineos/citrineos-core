import { Inject, Injectable } from '@nestjs/common';
import { AmqpService } from '@amqp/amqp.service';
import {
  CONFIG_LIMITS,
  type ConfigLimits,
  REPORTING_MODULE_CONFIG,
} from '@modules/config/config.tokens';
import type { ReportingModuleConfig } from '@modules/config/config.schema';
import { AbstractOcppModule } from '@ocpp/abstract-ocpp-module';
import { CacheService } from '@cache/cache.service';
import { EventGroup } from '@ocpp/event-group';
import { OcppHandlerRef } from '@ocpp/ocpp-request-handler';
import { SecurityEventNotificationHandler } from '@modules/reporting/handlers/security-event-notification.handler';
import { LogStatusNotificationHandler } from '@modules/reporting/handlers/log-status-notification.handler';
import { NotifyReportHandler } from '@modules/reporting/handlers/notify-report.handler';
import { NotifyMonitoringReportHandler } from '@modules/reporting/handlers/notify-monitoring-report.handler';
import { NotifyCustomerInformationHandler } from '@modules/reporting/handlers/notify-customer-information.handler';
import { DiagnosticsStatusNotificationHandler } from '@modules/reporting/handlers/diagnostics-status-notification.handler';

/**
 * Reporting module-service. Subclasses AbstractOcppModule to
 * register this module’s request handlers and CSMS-initiated response
 * handlers with the AMQP routing layer. Maps OCPP (action, version) pairs
 * onto handler instances at boot.
 */
@Injectable()
export class ReportingModuleService extends AbstractOcppModule {
  protected readonly eventGroup = EventGroup.Reporting;

  constructor(
    amqp: AmqpService,
    @Inject(REPORTING_MODULE_CONFIG) cfg: ReportingModuleConfig,
    @Inject(CONFIG_LIMITS) limits: ConfigLimits,
    cache: CacheService,
    private readonly securityEventNotification: SecurityEventNotificationHandler,
    private readonly logStatusNotification: LogStatusNotificationHandler,
    private readonly notifyReport: NotifyReportHandler,
    private readonly notifyMonitoringReport: NotifyMonitoringReportHandler,
    private readonly notifyCustomerInformation: NotifyCustomerInformationHandler,
    private readonly diagnosticsStatusNotification: DiagnosticsStatusNotificationHandler,
  ) {
    super(amqp, cfg, limits, cache);
  }

  protected getHandlers(): OcppHandlerRef[] {
    return [
      this.securityEventNotification,
      this.logStatusNotification,
      this.notifyReport,
      this.notifyMonitoringReport,
      this.notifyCustomerInformation,
      this.diagnosticsStatusNotification,
    ];
  }
}
