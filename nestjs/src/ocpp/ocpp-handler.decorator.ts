// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import { OCPP_CallAction } from '@ocpp/call-action';
import { OCPPVersion } from '@ocpp/ocpp-version';

/**
 * Reflect-metadata key carrying the `{ action, versions, requestClass }`
 * triple a handler used to declare as four boilerplate properties. The
 * `OcppRequestHandler` base reads it back via `getOcppHandlerMetadata`.
 */
export const OCPP_HANDLER_METADATA = Symbol('ocpp:handler:metadata');

export interface OcppHandlerMetadata<TRequest extends object = object> {
  action: OCPP_CallAction;
  versions: OCPPVersion[];
  requestClass: new () => TRequest;
}

/**
 * Class decorator that registers an OCPP request handler. Replaces the
 * four-line metadata preamble that used to live on every handler:
 *
 * ```ts
 * @OcppHandler(OCPP_CallAction.Foo, [OCPPVersion.OCPP2_0_1], FooRequest)
 * export class FooHandler extends OcppRequestHandler<FooRequest> { ... }
 * ```
 *
 * Also applies `@Injectable()` so handlers don't need both decorators.
 */
export function OcppHandler<TRequest extends object>(
  action: OCPP_CallAction,
  versions: OCPPVersion[],
  requestClass: new () => TRequest,
): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(
      OCPP_HANDLER_METADATA,
      { action, versions, requestClass } satisfies OcppHandlerMetadata<TRequest>,
      target,
    );
    Injectable()(target);
  };
}

/**
 * Read the metadata attached by `@OcppHandler`. Throws a clear error if
 * the decorator was forgotten — that's a developer mistake, not a
 * runtime condition, so we surface it loudly at construction.
 */
export function getOcppHandlerMetadata<TRequest extends object>(
  target: Function,
): OcppHandlerMetadata<TRequest> {
  const meta = Reflect.getMetadata(OCPP_HANDLER_METADATA, target) as
    | OcppHandlerMetadata<TRequest>
    | undefined;
  if (!meta) {
    throw new Error(
      `${target.name} extends OcppRequestHandler but is missing @OcppHandler(...) — ` +
        `add the decorator with action, versions, and requestClass.`,
    );
  }
  return meta;
}

// ─── Response-handler counterpart ─────────────────────────────────────────
//
// CSMS-initiated CALL_RESULT handlers (subclasses of `CsmsResponseHandler`)
// have the same `action` + `versions` boilerplate but no `requestClass`
// (no validation gate — the originating request is ours, the response
// comes from the charger and we trust the wire shape). A sibling
// decorator keeps the pattern consistent.

export const OCPP_RESPONSE_HANDLER_METADATA = Symbol('ocpp:response-handler:metadata');

export interface OcppResponseHandlerMetadata {
  action: OCPP_CallAction;
  versions: OCPPVersion[];
}

/**
 * Class decorator that registers an OCPP response handler. Replaces the
 * three-line metadata preamble that used to live on every handler:
 *
 * ```ts
 * @OcppResponseHandler(OCPP_CallAction.ReserveNow, [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1])
 * export class ReserveNowResponseHandler extends CsmsResponseHandler<ReserveNowResponse> { ... }
 * ```
 *
 * Also applies `@Injectable()` so handlers don't need both decorators.
 */
export function OcppResponseHandler(
  action: OCPP_CallAction,
  versions: OCPPVersion[],
): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(
      OCPP_RESPONSE_HANDLER_METADATA,
      { action, versions } satisfies OcppResponseHandlerMetadata,
      target,
    );
    Injectable()(target);
  };
}

/**
 * Read the metadata attached by `@OcppResponseHandler`. Throws if the
 * decorator was forgotten.
 */
export function getOcppResponseHandlerMetadata(target: Function): OcppResponseHandlerMetadata {
  const meta = Reflect.getMetadata(OCPP_RESPONSE_HANDLER_METADATA, target) as
    | OcppResponseHandlerMetadata
    | undefined;
  if (!meta) {
    throw new Error(
      `${target.name} extends CsmsResponseHandler but is missing @OcppResponseHandler(...) — ` +
        `add the decorator with action and versions.`,
    );
  }
  return meta;
}
