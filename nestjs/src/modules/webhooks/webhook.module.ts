// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Global, Module } from '@nestjs/common';
import { WebhookService } from '@webhooks/webhook.service';

/**
 * Webhook fan-out dispatcher. Marked `@Global()` so any handler can inject
 * `WebhookService` directly without each domain module having to import
 * `WebhookModule`.
 *
 * Subscribes to AMQP and POSTs every OCPP frame to operator-configured
 * endpoints; handlers can also call `webhookService.emit()` to fire
 * semantic events. Inactive when `config.util.webhooks` is empty (no
 * extra cost).
 */
@Global()
@Module({
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
