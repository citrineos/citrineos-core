// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractMessageEndpointDependencies,
  type IMessageConfirmation,
  type IMessageEndpointMetadata,
  type IOcppSender,
  AbstractMessageEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { LocalAuthListService } from '@modules/EVDriver/LocalAuthListService.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  localAuthListService: LocalAuthListService;
}

export class SendLocalListEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.SendLocalList,
    protocols: [OCPPVersion.OCPP1_6],
    eventGroup: EventGroup.EVDriver,
    bodySchema: () => OCPP1_6.SendLocalListRequestSchema,
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
    request: OCPP1_6.SendLocalListRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifiers) {
      try {
        const correlationId = await this._localAuthListService.prepareSendLocalList16(
          tenantId,
          ocppConnectionName,
          request,
        );

        results.push(
          await this._ocppSender.sendCall({
            ocppConnectionName,
            tenantId,
            protocol: OCPPVersion.OCPP1_6,
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
