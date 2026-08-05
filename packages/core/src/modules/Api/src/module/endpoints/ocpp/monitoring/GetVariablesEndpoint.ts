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
import type { DeviceModelService } from '@util/deviceModel/DeviceModelService.js';
import { getSizeOfRequest } from '@util/index.js';
import { COMPONENT_DEVICE_DATA_CTRLR } from '../components.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';
import { sendInBatches } from './sendInBatches.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  deviceModelService: DeviceModelService;
}

export class GetVariablesEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.GetVariables,
    protocols: OCPP2_PROTOCOLS,
    endpointPrefixConfigKey: 'monitoring',
    bodySchema: ocpp2Schema('GetVariablesRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _deviceModelService: DeviceModelService;

  constructor({ logger, ocppSender, deviceModelService }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._deviceModelService = deviceModelService;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.GetVariablesRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifiers) {
      try {
        const maxBytes =
          await this._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
            COMPONENT_DEVICE_DATA_CTRLR,
            OCPP_CallAction.GetVariables,
            tenantId,
            ocppConnectionName,
          );
        const requestBytes = getSizeOfRequest(request);

        if (maxBytes && requestBytes > maxBytes) {
          throw new Error(
            `The request size exceeds the limit of ${maxBytes} bytes for identifier ${ocppConnectionName}.`,
          );
        }

        const getVariableData = request.getVariableData;
        const itemsPerMessage =
          (await this._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            COMPONENT_DEVICE_DATA_CTRLR,
            OCPP_CallAction.GetVariables,
            tenantId,
            ocppConnectionName,
          )) ?? getVariableData.length;

        confirmations.push(
          ...(await sendInBatches({
            ocppSender: this._ocppSender,
            ocppConnectionName,
            tenantId,
            version,
            action: OCPP_CallAction.GetVariables,
            eventGroup: EventGroup.Monitoring,
            items: getVariableData,
            itemsPerMessage,
            buildPayload: (batch) => ({ ...request, getVariableData: batch }),
            callbackUrl,
          })),
        );
      } catch (error) {
        confirmations.push({
          success: false,
          payload: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return confirmations;
  }
}
