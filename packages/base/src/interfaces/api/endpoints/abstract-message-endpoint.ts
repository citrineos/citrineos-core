// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type ILogObj, Logger } from 'tslog';
import type { CallAction, EventGroup, OCPPVersion } from '@citrineos/types';
import type { IMessageConfirmation } from '@interfaces/messages/index.js';

export interface AbstractMessageEndpointDependencies {
  logger: Logger<ILogObj>;
}

/** How the Calls a message endpoint sends are delivered, from the request's query string. */
export interface MessageDelivery {
  callbackUrl?: string;
  /** See {@link IMessageContext.staleAfterSeconds}. */
  staleAfterSeconds?: number;
}

export interface IMessageEndpointMetadata {
  action: CallAction;
  protocols: OCPPVersion[];
  eventGroup: EventGroup;
  bodySchema: (version: OCPPVersion) => object | undefined;
  optionalQuerystrings?: Record<string, unknown>;
}

export abstract class AbstractMessageEndpoint {
  protected readonly _logger: Logger<ILogObj>;

  constructor(logger: Logger<ILogObj>) {
    this._logger = logger.getSubLogger({ name: this.constructor.name });
  }

  public abstract handle(
    identifiers: string[],
    request: unknown,
    delivery: MessageDelivery,
    tenantId: number | undefined,
    version: OCPPVersion,
    extraQueries?: Record<string, unknown>,
  ): Promise<IMessageConfirmation[]>;
}
