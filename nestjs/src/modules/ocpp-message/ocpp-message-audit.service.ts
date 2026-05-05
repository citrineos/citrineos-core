// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { OcppMessageRepository } from '@repositories/ocpp-message.repository';
import { MessageOrigin } from '@enums/message-origin.enum';
import { MessageState } from '@enums/message-state.enum';
import { OCPPVersion } from '@ocpp/ocpp-version';

/**
 * Owns every write to the `OcppMessages` audit table.
 *
 * The router calls this for all four frame paths:
 *   - charger → CSMS CALL          (incoming Request)
 *   - charger → CSMS CALL_RESULT   (incoming Response to a CSMS-originated CALL)
 *   - CSMS → charger CALL          (outgoing Request, e.g. Reset/TriggerMessage)
 *   - CSMS → charger CALL_RESULT   (outgoing Response to a charger-originated CALL)
 *   - charger → CSMS CALL_ERROR    (incoming Error to a CSMS-originated CALL)
 *
 * Persistence is fire-and-forget — failures are logged but never block the
 * OCPP path. Mirrors `core/src/dal/repository/OCPPMessage.ts`.
 */
@Injectable()
export class OcppMessageAuditService {
  private readonly logger = new Logger(OcppMessageAuditService.name);

  constructor(private readonly repo: OcppMessageRepository) {}

  recordCall(args: {
    stationId: string;
    correlationId: string;
    action: string;
    origin: MessageOrigin;
    payload: Record<string, unknown>;
    tenantId: number;
    protocol?: OCPPVersion | string;
  }): void {
    void this.repo
      .create({
        stationId: args.stationId,
        correlationId: args.correlationId,
        action: args.action,
        origin: args.origin,
        state: MessageState.Request,
        protocol: args.protocol ?? null,
        message: args.payload,
        tenantId: args.tenantId,
      })
      .catch((err) =>
        this.logger.warn(`OcppMessages persist (Call) failed: ${(err as Error).message}`),
      );
  }

  recordCallResult(args: {
    stationId: string;
    correlationId: string;
    action: string;
    origin: MessageOrigin;
    payload: Record<string, unknown>;
    tenantId: number;
    protocol?: OCPPVersion | string;
  }): void {
    void this.repo
      .create({
        stationId: args.stationId,
        correlationId: args.correlationId,
        action: args.action,
        origin: args.origin,
        state: MessageState.Response,
        protocol: args.protocol ?? null,
        message: args.payload,
        tenantId: args.tenantId,
      })
      .catch((err) =>
        this.logger.warn(`OcppMessages persist (CallResult) failed: ${(err as Error).message}`),
      );
  }

  recordCallError(args: {
    stationId: string;
    correlationId: string;
    action: string;
    origin: MessageOrigin;
    errorCode: string;
    errorDescription: string;
    errorDetails?: Record<string, unknown>;
    tenantId: number;
    protocol?: OCPPVersion | string;
  }): void {
    void this.repo
      .create({
        stationId: args.stationId,
        correlationId: args.correlationId,
        action: args.action,
        origin: args.origin,
        state: MessageState.Error,
        protocol: args.protocol ?? null,
        // Legacy stuffs error fields into the `message` jsonb rather
        // than dedicated columns. Preserve the same shape so audit
        // queries can pull `errorCode` / `errorDescription` out of the blob.
        message: {
          errorCode: args.errorCode,
          errorDescription: args.errorDescription,
          errorDetails: args.errorDetails ?? {},
        },
        tenantId: args.tenantId,
      })
      .catch((err) =>
        this.logger.warn(`OcppMessages persist (CallError) failed: ${(err as Error).message}`),
      );
  }
}
