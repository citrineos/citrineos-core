// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractMessageEndpointDependencies,
  type IMessageConfirmation,
  type IMessageEndpointDeclaration,
  type IOcppSender,
  type OCPP2_request_types,
  AbstractMessageEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { EventGroup, OCPP_CallAction, type OCPPVersion } from '@citrineos/types';
import type { NetworkProfileService } from '@util/networkProfile/NetworkProfileService.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

const WEBSOCKET_SERVER_CONFIG_ID = 'websocketServerConfigId';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  networkProfileService: NetworkProfileService;
}

export class SetNetworkProfileEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.SetNetworkProfile,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Configuration,
    bodySchema: ocpp2Schema('SetNetworkProfileRequestSchema'),
    optionalQuerystrings: { [WEBSOCKET_SERVER_CONFIG_ID]: { type: 'string' } },
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _networkProfileService: NetworkProfileService;

  constructor({ logger, ocppSender, networkProfileService }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._networkProfileService = networkProfileService;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.SetNetworkProfileRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
    extraQueries?: Record<string, unknown>,
  ): Promise<IMessageConfirmation[]> {
    const websocketServerConfigId = extraQueries?.[WEBSOCKET_SERVER_CONFIG_ID];
    const correlationId = await this._networkProfileService.prepareSetNetworkProfile(
      tenantId,
      identifiers,
      request,
      extraQueries
        ? {
            websocketServerConfigId:
              typeof websocketServerConfigId === 'string' ? websocketServerConfigId : undefined,
          }
        : undefined,
    );

    return Promise.all(
      identifiers.map((ocppConnectionName) =>
        this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: version,
          action: OCPP_CallAction.SetNetworkProfile,
          eventGroup: EventGroup.Configuration,
          payload: request,
          callbackUrl,
          correlationId,
        }),
      ),
    );
  }
}
