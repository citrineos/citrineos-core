// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { PaymentConfigInput } from '../types.js';
import { coreAuthFromEnv, sharedPaymentSettings } from './shared.js';

export function createDockerPaymentConfig(): PaymentConfigInput {
  return {
    env: 'development',

    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PAYMENT_PORT || '9010'),
      trustProxy: process.env.PAYMENT_TRUST_PROXY === 'true',
    },

    database: {
      host: process.env.DB_HOST || 'ocpp-db',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'citrine',
      username: process.env.DB_USER || 'citrine',
      password: process.env.DB_PASS || 'citrine',
    },

    logLevel: parseInt(process.env.LOG_LEVEL || '2'),

    publicUrl: process.env.PAYMENT_PUBLIC_URL || 'http://localhost:9010',
    internalUrl: process.env.PAYMENT_INTERNAL_URL || 'http://citrineos-payment:9010',
    callbackSecret: process.env.PAYMENT_CALLBACK_SECRET ?? '',
    frontendDir: process.env.PAYMENT_FRONTEND_DIR || undefined,

    stripe: {
      apiKey: process.env.STRIPE_API_KEY ?? '',
      connectWebhookSecret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET ?? '',
    },

    core: {
      url: process.env.CORE_URL || 'http://citrine:8080',
      headers: JSON.parse(process.env.CORE_HEADERS || '{}'),
      tenantHeaders: JSON.parse(process.env.CORE_TENANT_HEADERS || '{}'),
      ...coreAuthFromEnv(),
    },

    amqp: {
      url: process.env.AMQP_URL || 'amqp://guest:guest@amqp-broker:5672',
      exchange: process.env.AMQP_EXCHANGE || 'citrineos',
      queue: process.env.AMQP_QUEUE || 'payment',
    },

    idTokenPrefix: process.env.PAYMENT_ID_TOKEN_PREFIX || 'PAY_',

    ...sharedPaymentSettings(),
  };
}
