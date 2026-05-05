// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * AMQP wire constants — header values and queue-name builders that used
 * to be inline magic strings. Centralised so the router, modules, and
 * webhook fan-out reference one source.
 */

/** RabbitMQ exchange type for OCPP routing. The CitrineOS topology
 *  routes by header attributes (action, origin, state, stationId). */
export const AMQP_EXCHANGE_TYPE = 'headers';

/** `x-match` strategies for header-exchange bindings. */
export const X_MATCH_ALL = 'all';
export const X_MATCH_ANY = 'any';

/**
 * `origin` header — who emitted the OCPP frame.
 * Mirrors legacy `MessageOrigin` enum values on the AMQP wire.
 */
export const MessageOriginHeader = {
  ChargingStation: 'ChargingStation',
  ChargingStationManagementSystem: 'ChargingStationManagementSystem',
} as const;
export type MessageOriginHeader = (typeof MessageOriginHeader)[keyof typeof MessageOriginHeader];

/**
 * `state` header — which leg of the OCPP exchange the frame belongs to.
 * Lowercase per the legacy convention.
 */
export const MessageStateHeader = {
  Request: 'request',
  Response: 'response',
  Error: 'error',
} as const;
export type MessageStateHeader = (typeof MessageStateHeader)[keyof typeof MessageStateHeader];

/**
 * Numeric `state` value carried inside the AMQP body's `OcppAmqpMessage`.
 * The router uses it when materialising an outbound WS frame.
 */
export const OCPP_STATE_REQUEST = 1;
export const OCPP_STATE_RESPONSE = 2;
export const OCPP_STATE_ERROR = 3;

/** Short `origin` discriminator on the AMQP body. */
export const OCPP_ORIGIN_CHARGER = 'cs';
export const OCPP_ORIGIN_CSMS = 'csms';

/** Queue-name builders. Names match legacy CitrineOS so multi-tenant
 *  deployments can run nestjs and legacy services on the same broker. */
export const queueNames = {
  moduleRequests: (moduleName: string) => `${moduleName}_requests`,
  moduleResponses: (moduleName: string) => `${moduleName}_responses`,
  routerInstance: (instanceId: string) => `router_${instanceId}`,
  webhooks: (pid: number = process.pid) => `webhooks_${pid}`,
} as const;

/** Subscription readiness labels — keys in `AmqpService.getSubscriptionStatus()`. */
export const subscriptionLabels = {
  moduleRequests: (moduleName: string) => `module:${moduleName}:requests`,
  moduleResponses: (moduleName: string) => `module:${moduleName}:responses`,
  router: (queueName: string) => `router:${queueName}`,
  webhooks: 'webhooks',
} as const;
