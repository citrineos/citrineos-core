// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { AmqpService } from '@amqp/amqp.service';

/**
 * RabbitMQ liveness + per-subscription readiness.
 *
 * Reports:
 *   - `amqp.connected` — whether the underlying connection is up.
 *   - `amqp.subscriptions` — `{ "module:transactions:requests": true, … }`,
 *     one entry per registered subscription. `false` means the
 *     subscription is registered but its queue/consumer hasn't been bound
 *     yet (typically because RabbitMQ is reconnecting).
 *
 * Probes can detect a stuck module (connected but missing its queue
 * binding) without resorting to RabbitMQ's management API.
 */
@Injectable()
export class AmqpHealthIndicator extends HealthIndicator {
  constructor(private readonly amqpService: AmqpService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const connected = this.amqpService.isConnected();
    const subscriptions = this.amqpService.getSubscriptionStatus();
    const allReady = Object.values(subscriptions).every((ready) => ready);
    const healthy = connected && allReady;

    const details: Record<string, unknown> = {
      connected,
      subscriptions,
    };
    if (!connected) details.message = 'RabbitMQ not connected';
    else if (!allReady) {
      const stuck = Object.entries(subscriptions)
        .filter(([, ready]) => !ready)
        .map(([label]) => label);
      details.message = `Subscriptions not ready: ${stuck.join(', ')}`;
    }

    return this.getStatus(key, healthy, details);
  }
}
