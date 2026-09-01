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
  EventGroup,
  type OcppRequest,
  OCPP_CallAction,
  type OCPPVersion,
  type OCPP2_request_types,
} from '@citrineos/types';
import { getBatches, getSizeOfRequest } from '@util/index.js';
import type { DeviceModelService } from '@/services/deviceModel/DeviceModelService.js';
import { COMPONENT_DEVICE_DATA_CTRLR } from '../components.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  deviceModelService: DeviceModelService;
}

export class GetMonitoringReportEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.GetMonitoringReport,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Reporting,
    bodySchema: ocpp2Schema('GetMonitoringReportRequestSchema'),
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
    request: OCPP2_request_types.GetMonitoringReportRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const componentVariable = request.componentVariable ?? [];

    if (componentVariable.length === 0) {
      return Promise.all(
        identifiers.map((ocppConnectionName) =>
          this._send(ocppConnectionName, tenantId, version, request, callbackUrl),
        ),
      );
    }

    const confirmations: IMessageConfirmation[] = [];
    for (const ocppConnectionName of identifiers) {
      const maxBytes =
        await this._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
          COMPONENT_DEVICE_DATA_CTRLR,
          OCPP_CallAction.GetReport,
          tenantId,
          ocppConnectionName,
        );
      if (maxBytes && getSizeOfRequest(request) > maxBytes) {
        confirmations.push({
          success: false,
          payload: `${ocppConnectionName}: the request size exceeds the limit of ${maxBytes} bytes.`,
        });
        continue;
      }

      const itemsPerMessageGetReport =
        (await this._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
          COMPONENT_DEVICE_DATA_CTRLR,
          OCPP_CallAction.GetReport,
          tenantId,
          ocppConnectionName,
        )) ?? componentVariable.length;

      for (const [index, batch] of getBatches(
        componentVariable,
        itemsPerMessageGetReport,
      ).entries()) {
        try {
          const batchResult = await this._send(
            ocppConnectionName,
            tenantId,
            version,
            { ...request, componentVariable: batch },
            callbackUrl,
          );
          confirmations.push({
            success: batchResult.success,
            payload: `${ocppConnectionName} batch [${index}:${index + batch.length}]: ${batchResult.payload}`,
          });
        } catch (error) {
          confirmations.push({
            success: false,
            payload: `${ocppConnectionName} batch [${index}:${index + batch.length}]: ${error}`,
          });
        }
      }
    }

    return confirmations;
  }

  private _send(
    ocppConnectionName: string,
    tenantId: number,
    version: OCPPVersion,
    payload: OcppRequest,
    callbackUrl: string | undefined,
  ): Promise<IMessageConfirmation> {
    return this._ocppSender.sendCall({
      ocppConnectionName,
      tenantId,
      protocol: version,
      action: OCPP_CallAction.GetMonitoringReport,
      eventGroup: EventGroup.Reporting,
      payload,
      callbackUrl,
    });
  }
}
