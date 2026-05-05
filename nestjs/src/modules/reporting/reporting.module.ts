import { Module } from '@nestjs/common';
import { AmqpModule } from '@amqp/amqp.module';
import { ReportingModuleService } from '@modules/reporting/reporting.module-service';
import { ReportingOcppController } from '@modules/reporting/reporting-ocpp.controller';
import { SecurityEventNotificationHandler } from '@modules/reporting/handlers/security-event-notification.handler';
import { LogStatusNotificationHandler } from '@modules/reporting/handlers/log-status-notification.handler';
import { NotifyReportHandler } from '@modules/reporting/handlers/notify-report.handler';
import { NotifyMonitoringReportHandler } from '@modules/reporting/handlers/notify-monitoring-report.handler';
import { NotifyCustomerInformationHandler } from '@modules/reporting/handlers/notify-customer-information.handler';
import { DiagnosticsStatusNotificationHandler } from '@modules/reporting/handlers/diagnostics-status-notification.handler';
import { SecurityEventRepository } from '@repositories/security-event.repository';
import { VariableAttributeRepository } from '@repositories/variable-attribute.repository';
// VariableMonitoringRepository now lives in the global RepositoriesModule —
// SetMonitoringBase response handler in monitoring/ needs it too.
import { NotifyReportService } from '@modules/reporting/services/notify-report.service';
import { NotifyMonitoringReportService } from '@modules/reporting/services/notify-monitoring-report.service';
import { CustomerInformationService } from '@modules/reporting/services/customer-information.service';
import { MonitoringModule } from '@modules/monitoring/monitoring.module';
import { ProvisioningModule } from '@modules/provisioning/provisioning.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';

@Module({
  imports: [AmqpModule, MonitoringModule, ProvisioningModule, TransactionsModule],
  providers: [
    ReportingModuleService,
    SecurityEventNotificationHandler,
    LogStatusNotificationHandler,
    NotifyReportHandler,
    NotifyMonitoringReportHandler,
    NotifyCustomerInformationHandler,
    DiagnosticsStatusNotificationHandler,
    SecurityEventRepository,
    VariableAttributeRepository,
    NotifyReportService,
    NotifyMonitoringReportService,
    CustomerInformationService,
  ],
  controllers: [ReportingOcppController],
})
/**
 * NestJS DI module wiring the Reporting surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class ReportingModule {}
