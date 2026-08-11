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
import type { LocalAuthListService } from '@modules/EVDriver/src/module/LocalAuthListService.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  localAuthListService: LocalAuthListService;
}

export class SendLocalListEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.SendLocalList,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.EVDriver,
    bodySchema: ocpp2Schema('SendLocalListRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _localAuthListService: LocalAuthListService;

  constructor({ logger, ocppSender, localAuthListService }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._localAuthListService = localAuthListService;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.SendLocalListRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifiers) {
      try {
        const correlationId = await this._localAuthListService.prepareSendLocalList(
          tenantId,
          ocppConnectionName,
          request,
        );

        results.push(
          await this._ocppSender.sendCall({
            ocppConnectionName,
            tenantId,
            protocol: version,
            action: OCPP_CallAction.SendLocalList,
            eventGroup: EventGroup.EVDriver,
            payload: request,
            callbackUrl,
            correlationId,
          }),
        );
      } catch (error) {
        results.push({
          success: false,
          payload: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }

    return results;
  }
}
