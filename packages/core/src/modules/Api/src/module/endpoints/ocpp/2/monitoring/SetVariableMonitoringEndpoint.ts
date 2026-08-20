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
import {
  DataEnum,
  EventGroup,
  MonitorEnum,
  OCPP_CallAction,
  type OCPPVersion,
  type OCPP2_request_types,
} from '@citrineos/types';
import type {
  IDeviceModelRepository,
  IVariableMonitoringRepository,
} from '@dal/interfaces/repositories.js';
import type { DeviceModelService } from '@util/deviceModel/DeviceModelService.js';
import { getSizeOfRequest } from '@util/index.js';
import { COMPONENT_MONITORING_CTRLR } from '../components.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';
import { sendInBatches } from './sendInBatches.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  deviceModelService: DeviceModelService;
  deviceModelRepository: IDeviceModelRepository;
  variableMonitoringRepository: IVariableMonitoringRepository;
}

export class SetVariableMonitoringEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.SetVariableMonitoring,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Monitoring,
    bodySchema: ocpp2Schema('SetVariableMonitoringRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _deviceModelService: DeviceModelService;
  private readonly _deviceModelRepository: IDeviceModelRepository;
  private readonly _variableMonitoringRepository: IVariableMonitoringRepository;

  constructor({
    logger,
    ocppSender,
    deviceModelService,
    deviceModelRepository,
    variableMonitoringRepository,
  }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._deviceModelService = deviceModelService;
    this._deviceModelRepository = deviceModelRepository;
    this._variableMonitoringRepository = variableMonitoringRepository;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.SetVariableMonitoringRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifiers) {
      try {
        const maxBytes =
          await this._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
            COMPONENT_MONITORING_CTRLR,
            OCPP_CallAction.SetVariableMonitoring,
            tenantId,
            ocppConnectionName,
          );
        const requestBytes = getSizeOfRequest(request);

        if (maxBytes && requestBytes > maxBytes) {
          throw new Error(
            `The request size exceeds the limit of ${maxBytes} bytes for identifier ${ocppConnectionName}.`,
          );
        }

        const setMonitoringData = request.setMonitoringData;
        await this._persistMonitoringData(tenantId, ocppConnectionName, setMonitoringData);

        const itemsPerMessage =
          (await this._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            COMPONENT_MONITORING_CTRLR,
            OCPP_CallAction.SetVariableMonitoring,
            tenantId,
            ocppConnectionName,
          )) ?? setMonitoringData.length;

        confirmations.push(
          ...(await sendInBatches({
            ocppSender: this._ocppSender,
            ocppConnectionName,
            tenantId,
            version,
            action: OCPP_CallAction.SetVariableMonitoring,
            eventGroup: EventGroup.Monitoring,
            items: setMonitoringData,
            itemsPerMessage,
            buildPayload: (batch) => ({ ...request, setMonitoringData: batch }),
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

  private async _persistMonitoringData(
    tenantId: number,
    ocppConnectionName: string,
    setMonitoringData: OCPP2_request_types.SetVariableMonitoringRequest['setMonitoringData'],
  ): Promise<void> {
    for (const data of setMonitoringData) {
      const [component, variable] = await this._deviceModelRepository.findComponentAndVariable(
        tenantId,
        data.component,
        data.variable,
      );

      if (
        data.type === MonitorEnum.Delta &&
        variable?.variableCharacteristics?.dataType !== DataEnum.decimal &&
        variable?.variableCharacteristics?.dataType !== DataEnum.integer
      ) {
        data.value = 1;
        this._logger.debug('Updated SetMonitoringData value to 1', data);
      }

      if (component && variable) {
        await this._variableMonitoringRepository.createOrUpdateBySetMonitoringDataTypeAndStationId(
          tenantId,
          data,
          component.id,
          variable.id,
          ocppConnectionName,
        );
      }
    }
  }
}
