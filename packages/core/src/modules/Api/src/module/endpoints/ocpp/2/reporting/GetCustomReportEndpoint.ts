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
import { EventGroup, type OcppRequest, OCPP_CallAction, type OCPPVersion } from '@citrineos/types';
import { getBatches, getSizeOfRequest } from '@util/index.js';
import type { DeviceModelService } from '@util/deviceModel/DeviceModelService.js';
import { COMPONENT_DEVICE_DATA_CTRLR } from '../components.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  deviceModelService: DeviceModelService;
}

export class GetCustomReportEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.GetReport,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Reporting,
    bodySchema: ocpp2Schema('GetReportRequestSchema'),
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
    request: OCPP2_request_types.GetReportRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];
    for (const ocppConnectionName of identifiers) {
      confirmations.push(
        await this._handleStation(ocppConnectionName, request, callbackUrl, tenantId, version),
      );
    }
    return confirmations;
  }

  private async _handleStation(
    ocppConnectionName: string,
    request: OCPP2_request_types.GetReportRequest,
    callbackUrl: string | undefined,
    tenantId: number,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation> {
    const bytesPerMessageGetReport =
      await this._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
        COMPONENT_DEVICE_DATA_CTRLR,
        OCPP_CallAction.GetReport,
        tenantId,
        ocppConnectionName,
      );
    const requestBytes = getSizeOfRequest(request);
    if (bytesPerMessageGetReport && requestBytes > bytesPerMessageGetReport) {
      const errorMsg = `The request is too big. The max size is ${bytesPerMessageGetReport} bytes.`;
      this._logger.error(errorMsg);
      return { success: false, payload: errorMsg };
    }

    const componentVariables = request.componentVariable ?? [];

    if (componentVariables.length === 0) {
      return this._send(ocppConnectionName, tenantId, version, request, callbackUrl);
    }

    const itemsPerMessageGetReport =
      (await this._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        COMPONENT_DEVICE_DATA_CTRLR,
        OCPP_CallAction.GetReport,
        tenantId,
        ocppConnectionName,
      )) ?? componentVariables.length;

    const batchConfirmations = [];
    for (const [index, batch] of getBatches(
      componentVariables,
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
        batchConfirmations.push({
          success: batchResult.success,
          batch: `[${index}:${index + batch.length}]`,
          message: `${batchResult.payload}`,
        });
      } catch (error) {
        batchConfirmations.push({
          success: false,
          batch: `[${index}:${index + batch.length}]`,
          message: `${error}`,
        });
      }
    }

    return { success: true, payload: batchConfirmations };
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
      action: OCPP_CallAction.GetReport,
      eventGroup: EventGroup.Reporting,
      payload,
      callbackUrl,
    });
  }
}
