// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UTIL_CONFIG } from '@modules/config/config.tokens';
import type { UtilConfig } from '@modules/config/config.schema';
import { AmqpService, OcppAmqpMessage } from '@amqp/amqp.service';
import { MessageStateHeader, OCPP_STATE_REQUEST } from '@amqp/amqp.tokens';
import type { WebhookEvent } from '@webhooks/webhook-events';

/**
 * Fan-out OCPP traffic to operator-configured HTTP endpoints.
 *
 * Two complementary channels:
 *   1. **Frame-level (raw)** — every OCPP frame the modules see also flows
 *      to webhook receivers. Subscribed via AMQP at module init; matches
 *      legacy `dispatchMessageReceived()`. Endpoints with no `events`
 *      filter (or `events: ['request', 'response']`) get this firehose.
 *
 *   2. **Semantic events** — handlers call `emit(eventType, payload, …)`
 *      to fire a typed business event ("boot.notification",
 *      "transaction.started", "status.notification", "authorize"). These
 *      are POSTed independently to endpoints whose `events` filter
 *      includes the event name — useful when the receiver only cares
 *      about specific lifecycle moments and not the raw frame stream.
 *
 * Failures are logged and retried with exponential backoff (max 3 attempts);
 * we never block the OCPP path on a slow/unavailable webhook receiver.
 *
 * Configure via `config.util.webhooks` in the system-config JSON:
 *   { url: "https://...", events?: ["request"|"response"|<semantic>], headers?: {...} }
 */
@Injectable()
export class WebhookService implements OnModuleInit {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @Inject(UTIL_CONFIG) private readonly util: UtilConfig,
    private readonly amqp: AmqpService,
  ) {}

  async onModuleInit(): Promise<void> {
    const webhooks = this.endpoints();
    if (webhooks.length === 0) return;

    await this.amqp.subscribeWebhooks(async (msg) => {
      await Promise.all(webhooks.map((wh) => this.dispatchFrame(wh, msg)));
    });

    this.logger.log(`WebhookService: dispatching to ${webhooks.length} endpoint(s)`);
  }

  /**
   * Fire a typed business event. Non-blocking — failures are retried
   * inside `dispatchSemantic` and never propagate to the caller.
   */
  emit(
    eventType: WebhookEvent,
    payload: Record<string, unknown>,
    context: { stationId: string; tenantId: number },
  ): void {
    const webhooks = this.endpoints();
    if (webhooks.length === 0) return;

    const envelope = {
      eventType,
      stationId: context.stationId,
      tenantId: context.tenantId,
      timestamp: new Date().toISOString(),
      payload,
    };

    for (const wh of webhooks) {
      void this.dispatchSemantic(wh, eventType, envelope);
    }
  }

  private endpoints(): WebhookEndpoint[] {
    return (this.util as unknown as { webhooks?: WebhookEndpoint[] }).webhooks ?? [];
  }

  private async dispatchFrame(endpoint: WebhookEndpoint, msg: OcppAmqpMessage): Promise<void> {
    if (endpoint.events && endpoint.events.length > 0) {
      const stateLabel =
        msg.state === OCPP_STATE_REQUEST ? MessageStateHeader.Request : MessageStateHeader.Response;
      if (!endpoint.events.includes(stateLabel)) return;
    }
    await this.post(endpoint, msg as unknown as Record<string, unknown>);
  }

  private async dispatchSemantic(
    endpoint: WebhookEndpoint,
    eventType: string,
    envelope: Record<string, unknown>,
  ): Promise<void> {
    if (endpoint.events && endpoint.events.length > 0 && !endpoint.events.includes(eventType)) {
      return;
    }
    await this.post(endpoint, envelope);
  }

  private async post(endpoint: WebhookEndpoint, body: Record<string, unknown>): Promise<void> {
    let attempt = 0;
    let backoffMs = 200;
    while (attempt < 3) {
      try {
        const res = await fetch(endpoint.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(endpoint.headers ?? {}) },
          body: JSON.stringify(body),
        });
        if (res.ok) return;
        this.logger.warn(`Webhook ${endpoint.url} returned HTTP ${res.status}`);
      } catch (err) {
        this.logger.warn(`Webhook ${endpoint.url} failed: ${(err as Error).message}`);
      }
      attempt++;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, backoffMs));
        backoffMs *= 2;
      }
    }
  }
}

interface WebhookEndpoint {
  url: string;
  /**
   * Event filter. Legacy values (`'request'`, `'response'`) match raw
   * AMQP frames; any other string matches semantic events emitted via
   * `emit()`. Omitting `events` (or leaving it empty) sends everything.
   */
  events?: string[];
  headers?: Record<string, string>;
}
