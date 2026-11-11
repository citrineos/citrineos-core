// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { createDockerPaymentConfig } from './envs/docker.js';
import { createLocalPaymentConfig } from './envs/local.js';
import type { PaymentConfig, PaymentConfigInput } from './types.js';
import { PaymentConfigSchema } from './types.js';

export function loadPaymentConfig(input: PaymentConfigInput): PaymentConfig {
  return PaymentConfigSchema.parse(input);
}

function configInputForEnv(appEnv: string | undefined): PaymentConfigInput {
  return appEnv === 'docker' ? createDockerPaymentConfig() : createLocalPaymentConfig();
}

export function getPaymentConfigForEnv(appEnv: string | undefined): PaymentConfig {
  return loadPaymentConfig(configInputForEnv(appEnv));
}

/** Only the database settings, so migrations run without the app's secrets configured. */
export function getDatabaseConfigForEnv(appEnv: string | undefined): PaymentConfig['database'] {
  return PaymentConfigSchema.shape.database.parse(configInputForEnv(appEnv).database);
}
