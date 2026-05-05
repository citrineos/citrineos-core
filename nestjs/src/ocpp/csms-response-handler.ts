// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Logger } from '@nestjs/common';
import { OcppAmqpMessage } from '@amqp/amqp.service';
import { OCPP_CallAction } from '@ocpp/call-action';
import { getOcppResponseHandlerMetadata } from '@ocpp/ocpp-handler.decorator';
import { OCPPVersion } from '@ocpp/ocpp-version';

/**
 * Typed message delivered to a CSMS-initiated response handler.
 *
 * `payload` is the charger's `CallResult` body for our originating CALL.
 * For example, if the CSMS sent a `ReserveNow` request, this message
 * carries the charger's `ReserveNowResponse`.
 */
export interface CsmsResponseMessage<TPayload> {
  context: OcppAmqpMessage['context'];
  payload: TPayload;
  action: string;
  protocol: string;
}

/**
 * Minimal interface used by `AbstractOcppModule` to dispatch responses
 * without depending on `TPayload`.
 */
export interface CsmsResponseHandlerRef {
  readonly action: OCPP_CallAction;
  readonly versions: OCPPVersion[];
  dispatch(raw: OcppAmqpMessage): Promise<void>;
}

/**
 * Base class for handlers that run domain logic when a charger returns a
 * `CALL_RESULT` for a CSMS-initiated `CALL`. Mirrors the legacy
 * `responseHandlers` map on each module.
 *
 * The default `RemoteCallsService.sendAndAwait` flow already publishes
 * the response to the cache via `AbstractOcppModule`'s default
 * `responseHandler`, which lets the awaiting REST request resolve.
 * Response handlers are an *additional* extension point — for actions
 * where the CSMS wants to mutate state (e.g. ReserveNow → upsert
 * Reservation row, RequestStartTransaction → mark Transaction
 * `remoteStartId`) — that always run, regardless of whether anyone is
 * awaiting the round-trip via REST.
 *
 * The `action` + `versions` pair comes from the `@OcppResponseHandler(...)`
 * class decorator (read via Reflect metadata). A `protected logger` is
 * created lazily from `this.constructor.name`.
 *
 * Subclasses only declare `handle` — the domain logic.
 */
export abstract class CsmsResponseHandler<TPayload extends object>
  implements CsmsResponseHandlerRef
{
  readonly action: OCPP_CallAction;
  readonly versions: OCPPVersion[];
  protected readonly logger: Logger;

  constructor() {
    const meta = getOcppResponseHandlerMetadata(this.constructor);
    this.action = meta.action;
    this.versions = meta.versions;
    this.logger = new Logger(this.constructor.name);
  }

  abstract handle(msg: CsmsResponseMessage<TPayload>): Promise<void>;

  async dispatch(raw: OcppAmqpMessage): Promise<void> {
    await this.handle({
      context: raw.context,
      payload: raw.payload as TPayload,
      action: raw.action,
      protocol: raw.protocol,
    });
  }
}
