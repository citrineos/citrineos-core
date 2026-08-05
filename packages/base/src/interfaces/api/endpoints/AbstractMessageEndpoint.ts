// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type ILogObj, Logger } from 'tslog';
import type { CallAction, EventGroup, OCPPVersion, SystemConfig } from '@citrineos/types';
import type { IMessageConfirmation } from '@interfaces/messages/index.js';

export interface AbstractMessageEndpointDependencies {
  logger: Logger<ILogObj>;
}

export interface IMessageEndpointDeclaration {
  action: CallAction;
  protocols: OCPPVersion[];
  endpointPrefixConfigKey: keyof SystemConfig['modules'];
  bodySchema: (version: OCPPVersion) => object | undefined;
  optionalQuerystrings?: Record<string, unknown>;
}

export interface IPassthroughMessageEndpointDeclaration extends IMessageEndpointDeclaration {
  eventGroup: EventGroup;
}

export abstract class AbstractMessageEndpoint {
  protected readonly _logger: Logger<ILogObj>;

  constructor(logger: Logger<ILogObj>) {
    this._logger = logger.getSubLogger({ name: this.constructor.name });
  }

  public abstract handle(
    identifiers: string[],
    request: unknown,
    callbackUrl: string | undefined,
    tenantId: number | undefined,
    version: OCPPVersion,
    extraQueries?: Record<string, unknown>,
  ): Promise<IMessageConfirmation[]>;
}
