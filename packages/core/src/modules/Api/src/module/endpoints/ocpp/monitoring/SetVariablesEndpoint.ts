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
import type { IDeviceModelRepository } from '@dal/interfaces/repositories.js';
import type { DeviceModelService } from '@util/deviceModel/DeviceModelService.js';
import { COMPONENT_DEVICE_DATA_CTRLR } from '../components.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';
import { sendInBatches } from './sendInBatches.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  deviceModelService: DeviceModelService;
  deviceModelRepository: IDeviceModelRepository;
}

export class SetVariablesEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.SetVariables,
    protocols: OCPP2_PROTOCOLS,
    endpointPrefixConfigKey: 'monitoring',
    bodySchema: ocpp2Schema('SetVariablesRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _deviceModelService: DeviceModelService;
  private readonly _deviceModelRepository: IDeviceModelRepository;

  constructor({ logger, ocppSender, deviceModelService, deviceModelRepository }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._deviceModelService = deviceModelService;
    this._deviceModelRepository = deviceModelRepository;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.SetVariablesRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifiers) {
      try {
        const setVariableData = request.setVariableData;

        await this._deviceModelRepository.createOrUpdateBySetVariablesDataAndStationId(
          tenantId,
          setVariableData,
          ocppConnectionName,
          new Date().toISOString(),
        );

        const itemsPerMessage =
          (await this._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            COMPONENT_DEVICE_DATA_CTRLR,
            OCPP_CallAction.SetVariables,
            tenantId,
            ocppConnectionName,
          )) ?? setVariableData.length;

        confirmations.push(
          ...(await sendInBatches({
            ocppSender: this._ocppSender,
            ocppConnectionName,
            tenantId,
            version,
            action: OCPP_CallAction.SetVariables,
            eventGroup: EventGroup.Monitoring,
            items: setVariableData,
            itemsPerMessage,
            buildPayload: (batch) => ({ ...request, setVariableData: batch }),
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
