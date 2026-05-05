import { Inject, Injectable } from '@nestjs/common';
import { AmqpService } from '@amqp/amqp.service';
import {
  CONFIG_LIMITS,
  type ConfigLimits,
  TRANSACTIONS_MODULE_CONFIG,
} from '@modules/config/config.tokens';
import type { TransactionsModuleConfig } from '@modules/config/config.schema';
import { AbstractOcppModule } from '@ocpp/abstract-ocpp-module';
import { CacheService } from '@cache/cache.service';
import { EventGroup } from '@ocpp/event-group';
import { OcppHandlerRef } from '@ocpp/ocpp-request-handler';
import { CsmsResponseHandlerRef } from '@ocpp/csms-response-handler';
import { TransactionEventHandler } from '@modules/transactions/handlers/transaction-event.handler';
import { MeterValuesHandler } from '@modules/transactions/handlers/meter-values.handler';
import { MeterValues16Handler } from '@modules/transactions/handlers/meter-values-16.handler';
import { StatusNotificationHandler } from '@modules/transactions/handlers/status-notification.handler';
import { StatusNotification16Handler } from '@modules/transactions/handlers/status-notification-16.handler';
import { StartTransactionHandler } from '@modules/transactions/handlers/start-transaction.handler';
import { StopTransactionHandler } from '@modules/transactions/handlers/stop-transaction.handler';
import { GetTransactionStatusResponseHandler } from '@modules/transactions/response-handlers/get-transaction-status.response-handler';

/**
 * Transactions module-service. Subclasses AbstractOcppModule to
 * register this module’s request handlers and CSMS-initiated response
 * handlers with the AMQP routing layer. Maps OCPP (action, version) pairs
 * onto handler instances at boot.
 */
@Injectable()
export class TransactionsModuleService extends AbstractOcppModule {
  protected readonly eventGroup = EventGroup.Transactions;

  constructor(
    amqp: AmqpService,
    @Inject(TRANSACTIONS_MODULE_CONFIG) cfg: TransactionsModuleConfig,
    @Inject(CONFIG_LIMITS) limits: ConfigLimits,
    cache: CacheService,
    private readonly transactionEvent: TransactionEventHandler,
    private readonly meterValues: MeterValuesHandler,
    private readonly meterValues16: MeterValues16Handler,
    private readonly statusNotification: StatusNotificationHandler,
    private readonly statusNotification16: StatusNotification16Handler,
    private readonly startTransaction: StartTransactionHandler,
    private readonly stopTransaction: StopTransactionHandler,
    private readonly getTransactionStatusResponse: GetTransactionStatusResponseHandler,
  ) {
    super(amqp, cfg, limits, cache);
  }

  protected getHandlers(): OcppHandlerRef[] {
    return [
      this.transactionEvent,
      this.meterValues,
      this.meterValues16,
      this.statusNotification,
      this.statusNotification16,
      this.startTransaction,
      this.stopTransaction,
    ];
  }

  protected override getResponseHandlers(): CsmsResponseHandlerRef[] {
    return [this.getTransactionStatusResponse];
  }
}
