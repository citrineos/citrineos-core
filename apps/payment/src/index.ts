// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { loggerDefaults } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { createApp } from './app.js';
import { getPaymentConfigForEnv } from './config/loader.js';

async function main(): Promise<void> {
  const config = getPaymentConfigForEnv(process.env.APP_ENV);

  const logger = new Logger<ILogObj>({
    ...loggerDefaults(config.env),
    name: 'CitrineOS Payment',
    minLevel: config.logLevel,
    pretty: { style: process.env.DEPLOYMENT_TARGET !== 'cloud' },
  });

  const { server, consumer, reconciliation, sequelize } = await createApp(config, logger);
  await consumer.start();
  if (config.reconciliation.intervalSeconds > 0) {
    reconciliation.start(config.reconciliation.intervalSeconds * 1000);
  }

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info(`Received ${signal}, shutting down`);
    reconciliation.stop();
    await server.close();
    await consumer.stop();
    await sequelize.close();
    process.exit(0);
  };
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const) {
    process.on(signal, () => {
      void shutdown(signal);
    });
  }

  await server.listen({ host: config.server.host, port: config.server.port });
  logger.info(`Payment server listening on ${config.server.host}:${config.server.port}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
