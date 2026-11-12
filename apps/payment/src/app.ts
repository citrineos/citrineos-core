// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Sequelize } from '@citrineos/dal';
import {
  SequelizeAuthorizationRepository,
  SequelizeChargingStationSequenceRepository,
  SequelizeLocationRepository,
  SequelizeTariffRepository,
  SequelizeTenantRepository,
  SequelizeTransactionEventRepository,
} from '@citrineos/dal';
import type { FastifyInstance } from 'fastify';
import { fileURLToPath } from 'node:url';
import type { ILogObj, Logger } from 'tslog';
import type { PaymentConfig } from './config/types.js';
import { CoreAuthMode } from './config/types.js';
import { CoreApiClient } from './core/core-api-client.js';
import { LocalDevCoreAuth, StaticCoreAuth } from './core/core-auth.js';
import { CoreData } from './core/core-data.js';
import { initializeDatabase, toSystemConfig } from './db/database.js';
import { RabbitMqConsumer } from './messaging/rabbitmq-consumer.js';
import {
  SequelizeCheckoutRepository,
  SequelizePaymentAccountRepository,
} from './repositories/index.js';
import { AdminAuthenticator } from './admin/admin-auth.js';
import { CorePermissions } from './admin/core-permissions.js';
import { AdminService } from './admin/admin-service.js';
import { buildServer } from './server.js';
import { CallbackSigner } from './services/callback-signer.js';
import { CheckoutService } from './services/checkout-service.js';
import { IdTokens } from './services/id-tokens.js';
import { ReconciliationService } from './services/reconciliation-service.js';
import { ScanAndChargeService } from './services/scan-and-charge-service.js';
import { SettlementService } from './services/settlement-service.js';
import { StartService } from './services/start-service.js';
import type { IPaymentProvider } from './stripe/payment-provider.js';
import { StripePaymentProvider } from './stripe/payment-provider.js';

export interface PaymentApp {
  server: FastifyInstance;
  consumer: RabbitMqConsumer;
  /** Not sweeping until started. */
  reconciliation: ReconciliationService;
  sequelize: Sequelize;
}

/**
 * Wires the app together and connects it to the database. `payments` replaces the Stripe provider,
 * for running against something other than Stripe.
 */
export async function createApp(
  config: PaymentConfig,
  logger: Logger<ILogObj>,
  payments: IPaymentProvider = StripePaymentProvider.create(
    config.stripe.apiKey,
    config.stripe.connectWebhookSecret,
  ),
): Promise<PaymentApp> {
  const sequelize = await initializeDatabase(config, logger);
  const repositoryDependencies = {
    config: toSystemConfig(config),
    logger,
    sequelizeInstance: sequelize,
  };
  // One repository serves EVSEs, connectors, stations and locations alike.
  const locationRepository = new SequelizeLocationRepository(repositoryDependencies);
  const coreData = new CoreData({
    evseRepository: locationRepository,
    connectorRepository: locationRepository,
    chargingStationRepository: locationRepository,
    locationRepository,
    tenantRepository: new SequelizeTenantRepository(repositoryDependencies),
    tariffRepository: new SequelizeTariffRepository(repositoryDependencies),
    authorizationRepository: new SequelizeAuthorizationRepository(repositoryDependencies),
    chargingStationSequenceRepository: new SequelizeChargingStationSequenceRepository(
      repositoryDependencies,
    ),
    transactionRepository: new SequelizeTransactionEventRepository(repositoryDependencies),
  });

  const checkoutRepository = new SequelizeCheckoutRepository();
  const paymentAccountRepository = new SequelizePaymentAccountRepository();
  const idTokens = new IdTokens(config.idTokenPrefix);

  const checkoutService = new CheckoutService({
    coreData,
    payments,
    checkoutRepository,
    paymentAccountRepository,
    publicUrl: config.publicUrl,
    logger,
  });
  const coreAuth =
    config.core.authMode === CoreAuthMode.LocalDev
      ? new LocalDevCoreAuth(config.core.url, config.core.localDevRoles)
      : new StaticCoreAuth(config.core.headers, config.core.tenantHeaders);
  const coreApi = new CoreApiClient(config.core.url, coreAuth);
  const startService = new StartService({
    coreData,
    coreApi,
    payments,
    checkoutRepository,
    paymentAccountRepository,
    callbackSigner: new CallbackSigner(config.callbackSecret),
    idTokens,
    internalUrl: config.internalUrl,
    logger,
  });
  const settlementService = new SettlementService({
    coreData,
    payments,
    checkoutRepository,
    idTokens,
    logger,
  });

  const scanAndChargeService = new ScanAndChargeService({
    coreData,
    coreApi,
    payments,
    checkoutRepository,
    paymentAccountRepository,
    idTokens,
    publicUrl: config.publicUrl,
    logger,
  });

  const reconciliationService = new ReconciliationService({
    coreData,
    payments,
    checkoutRepository,
    settlementService,
    idTokens,
    staleAfterMs: config.reconciliation.staleAfterSeconds * 1000,
    logger,
  });
  const adminAuthenticator = new AdminAuthenticator(
    config.admin,
    new CorePermissions(config.core.url),
  );

  return {
    server: buildServer({
      checkoutService,
      startService,
      scanAndChargeService,
      payments,
      rateLimitPerMinute: config.rateLimitPerMinute,
      trustProxy: config.server.trustProxy,
      admin: {
        authenticator: adminAuthenticator,
        service: new AdminService({
          checkoutRepository,
          paymentAccountRepository,
          payments,
          reconciliationService,
          logger,
        }),
      },
      // Next to this package's dist/ unless configured: frontend/dist.
      frontendDir:
        config.frontendDir ?? fileURLToPath(new URL('../frontend/dist', import.meta.url)),
      logger,
    }),
    consumer: new RabbitMqConsumer(config.amqp, settlementService, scanAndChargeService, logger),
    reconciliation: reconciliationService,
    sequelize,
  };
}
