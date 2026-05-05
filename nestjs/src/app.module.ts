import { DynamicModule, Logger, Module, Type } from '@nestjs/common';
import { AppConfigModule } from '@modules/config/app-config.module';
import { AppConfig } from '@modules/config/config.schema';
import { EventGroup } from '@ocpp/event-group';
import { AmqpModule } from '@amqp/amqp.module';
import { CacheModule } from '@cache/cache.module';
import { DrizzleModule } from '@db/drizzle.module';
import { OcppRouterModule } from '@router/ocpp-router.module';
import { RemoteCallsModule } from '@remote-calls/remote-calls.module';
import { WebhookModule } from '@webhooks/webhook.module';
import { HealthModule } from '@health/health.module';
import { FileStorageModule } from '@file-storage/file-storage.module';
import { CertificateAuthorityModule } from '@certificate-authority/certificate-authority.module';
import { MetricsModule } from '@metrics/metrics.module';
import { OcppMessageModule } from '@modules/ocpp-message/ocpp-message.module';
import { RepositoriesModule } from '@repositories/repositories.module';
import { ReportingModule } from '@modules/reporting/reporting.module';
import { ProvisioningModule } from '@modules/provisioning/provisioning.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';
import { MonitoringModule } from '@modules/monitoring/monitoring.module';
import { CertificatesModule } from '@modules/certificates/certificates.module';
import { EvDriverModule } from '@modules/evdriver/evdriver.module';
import { SmartChargingModule } from '@modules/smartcharging/smartcharging.module';
import { TenantModule } from '@modules/tenant/tenant.module';

type NestModule = Type<unknown> | DynamicModule;

const logger = new Logger('AppModule');

const EVENT_GROUP_MODULE_MAP: Partial<Record<EventGroup, NestModule>> = {
  [EventGroup.Configuration]: ProvisioningModule,
  [EventGroup.Transactions]: TransactionsModule,
  [EventGroup.EVDriver]: EvDriverModule,
  [EventGroup.Monitoring]: MonitoringModule,
  [EventGroup.Reporting]: ReportingModule,
  [EventGroup.SmartCharging]: SmartChargingModule,
  [EventGroup.Certificates]: CertificatesModule,
  [EventGroup.Tenant]: TenantModule,
};

const ALL_DOMAIN_MODULES: NestModule[] = Object.values(EVENT_GROUP_MODULE_MAP) as NestModule[];

function eventGroupFromString(appName: string | undefined): EventGroup {
  const lower = (appName ?? 'all').toLowerCase().trim();
  if (Object.values(EventGroup).includes(lower as EventGroup)) {
    return lower as EventGroup;
  }
  logger.warn(`Unknown APP_NAME="${appName}", defaulting to EventGroup.All`);
  return EventGroup.All;
}

/**
 * NestJS DI module wiring the App surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
@Module({})
export class AppModule {
  static create(_config: AppConfig): DynamicModule {
    const eventGroup = eventGroupFromString(process.env['APP_NAME']);

    const includeRouter = eventGroup === EventGroup.All || eventGroup === EventGroup.Router;
    let domainModules: NestModule[];
    if (eventGroup === EventGroup.All || eventGroup === EventGroup.Modules) {
      domainModules = ALL_DOMAIN_MODULES;
    } else {
      const mod = EVENT_GROUP_MODULE_MAP[eventGroup];
      domainModules = mod ? [mod] : [];
    }

    logger.log(
      `Initializing in ${eventGroup.toUpperCase()} mode` +
        ` — router: ${includeRouter}, modules: [${domainModules.map((m) => (m as Type).name ?? 'DynamicModule').join(', ')}]`,
    );

    return {
      module: AppModule,
      imports: [
        AppConfigModule,
        CacheModule,
        DrizzleModule,
        RepositoriesModule,
        AmqpModule,
        RemoteCallsModule,
        WebhookModule,
        HealthModule,
        FileStorageModule,
        CertificateAuthorityModule,
        MetricsModule,
        OcppMessageModule,
        ...(includeRouter ? [OcppRouterModule] : []),
        ...domainModules,
      ],
    };
  }
}
