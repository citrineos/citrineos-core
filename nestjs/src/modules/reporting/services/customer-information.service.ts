// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

interface AccumulatorEntry {
  /** Concatenated `data` chunks in seqNo order. */
  parts: Map<number, string>;
  startedAt: Date;
}

/**
 * Accumulates `NotifyCustomerInformation` chunks across multiple wire
 * messages keyed on `(stationId, requestId)`. The OCPP wire shape splits
 * a single customer-information report into N messages with `tbc=true`
 * on every chunk except the last; this service stitches them.
 *
 * On completion (`tbc=false`) the joined report is fired as a
 * `customer-information.completed` semantic webhook event so external
 * systems receive the full payload, not the per-chunk dribble.
 *
 * In-memory only — matches legacy behavior. Restart drops in-flight
 * accumulators (the charger will re-send on the next CustomerInformation
 * round-trip).
 */
@Injectable()
export class CustomerInformationService {
  private readonly logger = new Logger(CustomerInformationService.name);
  private readonly buffers = new Map<string, AccumulatorEntry>();

  constructor(private readonly webhooks: WebhookService) {}

  /**
   * Append a chunk and, when `tbc=false`, finalize the accumulator and
   * emit the stitched report. Returns the joined data when complete,
   * otherwise `null` (so callers can log mid-stream progress).
   */
  appendChunk(args: {
    stationId: string;
    tenantId: number;
    requestId: number;
    seqNo: number;
    tbc: boolean;
    data: string;
    generatedAt: string;
  }): string | null {
    const key = `${args.tenantId}:${args.stationId}:${args.requestId}`;
    let entry = this.buffers.get(key);
    if (!entry) {
      entry = { parts: new Map(), startedAt: new Date() };
      this.buffers.set(key, entry);
    }
    entry.parts.set(args.seqNo, args.data);

    if (args.tbc) return null;

    // Complete — stitch in seqNo order.
    const sortedSeqs = [...entry.parts.keys()].sort((a, b) => a - b);
    const joined = sortedSeqs.map((s) => entry!.parts.get(s) ?? '').join('');
    this.buffers.delete(key);

    this.webhooks.emit(
      WebhookEvent.CustomerInformationCompleted,
      {
        requestId: args.requestId,
        generatedAt: args.generatedAt,
        chunks: sortedSeqs.length,
        data: joined,
      },
      { stationId: args.stationId, tenantId: args.tenantId },
    );

    this.logger.log(
      `CustomerInformation requestId=${args.requestId} for ${args.stationId} complete (${sortedSeqs.length} chunk(s), ${joined.length} chars)`,
    );
    return joined;
  }
}
