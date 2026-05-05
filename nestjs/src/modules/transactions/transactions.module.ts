import { Module } from '@nestjs/common';
import { AmqpModule } from '@amqp/amqp.module';
import { TransactionsModuleService } from '@modules/transactions/transactions.module-service';
import { TransactionsOcppController } from '@modules/transactions/transactions-ocpp.controller';
import { TransactionEventHandler } from '@modules/transactions/handlers/transaction-event.handler';
import { MeterValuesHandler } from '@modules/transactions/handlers/meter-values.handler';
import { MeterValues16Handler } from '@modules/transactions/handlers/meter-values-16.handler';
import { StatusNotificationHandler } from '@modules/transactions/handlers/status-notification.handler';
import { StatusNotification16Handler } from '@modules/transactions/handlers/status-notification-16.handler';
import { StartTransactionHandler } from '@modules/transactions/handlers/start-transaction.handler';
import { StopTransactionHandler } from '@modules/transactions/handlers/stop-transaction.handler';
import { TransactionRepository } from '@repositories/transaction.repository';
import { MeterValueRepository } from '@repositories/meter-value.repository';
import { StatusNotificationRepository } from '@repositories/status-notification.repository';
import { LatestStatusNotificationRepository } from '@repositories/latest-status-notification.repository';
import { ChargingStationSecurityInfoRepository } from '@repositories/charging-station-security-info.repository';
import { Ocpp16HistoryRepository } from '@repositories/ocpp16-history.repository';
import { TransactionService } from '@modules/transactions/services/transaction.service';
import { StatusNotificationService } from '@modules/transactions/services/status-notification.service';
import { CostService } from '@modules/transactions/services/cost.service';
import { CostNotifier } from '@modules/transactions/services/cost-notifier.service';
import { IdleTransactionWatchdog } from '@modules/transactions/services/idle-transaction-watchdog.service';
import { SignedMeterValueValidator } from '@modules/transactions/services/signed-meter-value-validator.service';
import { GetTransactionStatusResponseHandler } from '@modules/transactions/response-handlers/get-transaction-status.response-handler';
import { EvDriverModule } from '@modules/evdriver/evdriver.module';

// ConnectorRepository + ReservationRepository now live in the global
// RepositoriesModule; no module-level import needed for those. The
// `EvDriverModule` import remains for `AuthorizationService`.

@Module({
  imports: [AmqpModule, EvDriverModule],
  providers: [
    TransactionsModuleService,
    TransactionEventHandler,
    MeterValuesHandler,
    MeterValues16Handler,
    StatusNotificationHandler,
    StatusNotification16Handler,
    StartTransactionHandler,
    StopTransactionHandler,
    TransactionRepository,
    MeterValueRepository,
    StatusNotificationRepository,
    LatestStatusNotificationRepository,
    ChargingStationSecurityInfoRepository,
    Ocpp16HistoryRepository,
    TransactionService,
    StatusNotificationService,
    CostService,
    CostNotifier,
    IdleTransactionWatchdog,
    SignedMeterValueValidator,
    GetTransactionStatusResponseHandler,
  ],
  controllers: [TransactionsOcppController],
  exports: [TransactionRepository],
})
/**
 * NestJS DI module wiring the Transactions surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class TransactionsModule {}
