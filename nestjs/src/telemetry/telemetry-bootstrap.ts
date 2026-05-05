// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Logger } from '@nestjs/common';
import { propagation } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import type { TelemetryConfig } from '@modules/config/config.schema';

const log = new Logger('TelemetryBootstrap');

let sdk: NodeSDK | undefined;

/**
 * Initialize OpenTelemetry tracing. MUST be called before NestJS / Fastify
 * import any instrumented modules — that's why this lives in `main.ts`
 * before `NestFactory.create`. Returns a teardown function so a graceful
 * shutdown can flush in-flight spans.
 *
 * No-op when `cfg.enabled === false` (default), so the deps stay optional
 * for operators that don't want OTLP.
 */
export function initTelemetry(cfg: TelemetryConfig | undefined): () => Promise<void> {
  if (!cfg?.enabled) {
    // Even with OTLP export disabled, register the W3C propagator so the
    // AMQP service can inject/extract `traceparent` between the router
    // and module spans (those still create local spans for log linking
    // even without an exporter).
    propagation.setGlobalPropagator(new W3CTraceContextPropagator());
    return async () => {};
  }

  sdk = new NodeSDK({
    resource: new Resource({ [ATTR_SERVICE_NAME]: cfg.serviceName }),
    traceExporter: new OTLPTraceExporter({ url: cfg.endpoint }),
    textMapPropagator: new W3CTraceContextPropagator(),
  });

  sdk.start();
  log.log(`OTLP tracing enabled (service=${cfg.serviceName}, endpoint=${cfg.endpoint})`);

  return async () => {
    try {
      await sdk?.shutdown();
      log.log('OTLP tracer flushed and shut down');
    } catch (err) {
      log.error(`OTLP shutdown failed: ${(err as Error).message}`);
    }
  };
}
