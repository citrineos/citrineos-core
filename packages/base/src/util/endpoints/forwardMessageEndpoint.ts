// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { OcppRequest, OCPPVersion } from '@citrineos/types';
import {
  AbstractMessageEndpoint,
  type AbstractMessageEndpointDependencies,
  type IMessageEndpointMetadata,
} from '@interfaces/api/endpoints/AbstractMessageEndpoint.js';
import type { MessageEndpointClass } from '@interfaces/api/endpoints/buildMessageEndpoints.js';
import type { IOcppSender } from '@interfaces/handlers/IOcppSender.js';
import type { IMessageConfirmation } from '@interfaces/messages/index.js';
import { DEFAULT_TENANT_ID } from '../identifiers.js';

interface ForwardMessageDependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
}

/**
 * Builds an endpoint that forwards a validated request to every identified station
 * unchanged. Every route whose only behaviour is fan-out is declared as one of these
 * rather than as its own class.
 */
export function forwardMessageEndpoint(route: IMessageEndpointMetadata): MessageEndpointClass {
  return class extends AbstractMessageEndpoint {
    static readonly route = route;

    private readonly _ocppSender: IOcppSender;

    constructor({ logger, ocppSender }: ForwardMessageDependencies) {
      super(logger);
      this._ocppSender = ocppSender;
    }

    async handle(
      identifiers: string[],
      request: OcppRequest,
      callbackUrl: string | undefined,
      tenantId: number | undefined,
      version: OCPPVersion,
    ): Promise<IMessageConfirmation[]> {
      return Promise.all(
        identifiers.map((ocppConnectionName) =>
          this._ocppSender.sendCall({
            ocppConnectionName,
            tenantId: tenantId ?? DEFAULT_TENANT_ID,
            protocol: version,
            action: route.action,
            eventGroup: route.eventGroup,
            payload: request,
            callbackUrl,
          }),
        ),
      );
    }
  };
}
