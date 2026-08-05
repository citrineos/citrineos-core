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
import { COMPONENT_MONITORING_CTRLR } from '../components.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';
import { sendInBatches } from './sendInBatches.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  deviceModelService: DeviceModelService;
}

export class ClearVariableMonitoringEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.ClearVariableMonitoring,
    protocols: OCPP2_PROTOCOLS,
    endpointPrefixConfigKey: 'monitoring',
    bodySchema: ocpp2Schema('ClearVariableMonitoringRequestSchema'),
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
    request: OCPP2_request_types.ClearVariableMonitoringRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifiers) {
      try {
        this._logger.debug(
          'ClearVariableMonitoring request received for station',
          ocppConnectionName,
          request,
        );

        const maxBytes =
          await this._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
            COMPONENT_MONITORING_CTRLR,
            OCPP_CallAction.ClearVariableMonitoring,
            tenantId,
            ocppConnectionName,
          );
        const requestBytes = getSizeOfRequest(request);

        if (maxBytes && requestBytes > maxBytes) {
          throw new Error(
            `The request size exceeds the limit of ${maxBytes} bytes for identifier ${ocppConnectionName}.`,
          );
        }

        const ids = request.id;
        const itemsPerMessage =
          (await this._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            COMPONENT_MONITORING_CTRLR,
            OCPP_CallAction.ClearVariableMonitoring,
            tenantId,
            ocppConnectionName,
          )) ?? ids.length;

        confirmations.push(
          ...(await sendInBatches({
            ocppSender: this._ocppSender,
            ocppConnectionName,
            tenantId,
            version,
            action: OCPP_CallAction.ClearVariableMonitoring,
            eventGroup: EventGroup.Monitoring,
            items: ids,
            itemsPerMessage,
            buildPayload: (batch) => ({ id: batch }),
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
