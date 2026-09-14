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

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
}

export class TriggerMessageEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.TriggerMessage,
    protocols: [OCPPVersion.OCPP1_6],
    eventGroup: EventGroup.Configuration,
    bodySchema: () => OCPP1_6.TriggerMessageRequestSchema,
  };

  private readonly _ocppSender: IOcppSender;

  constructor({ logger, ocppSender }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
  }

  async handle(
    identifiers: string[],
    request: OCPP1_6.TriggerMessageRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const connectorId = request.connectorId;
    if (connectorId !== null && connectorId !== undefined && connectorId <= 0) {
      const errorMsg = `connectorId should be either omitted or greater than 0.`;
      this._logger.error(errorMsg);
      return [{ success: false, payload: errorMsg }];
    }

    return Promise.all(
      identifiers.map((ocppConnectionName) =>
        this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: OCPPVersion.OCPP1_6,
          action: OCPP_CallAction.TriggerMessage,
          eventGroup: EventGroup.Configuration,
          payload: request,
          callbackUrl,
        }),
      ),
    );
  }
}
