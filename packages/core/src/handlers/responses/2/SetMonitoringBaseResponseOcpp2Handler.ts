// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, type AbstractHandlerDependencies, AsResponseHandler, type IMessage, type IOcppSender, OCPP2_common_types, OCPP2_request_types, OCPP2_response_types } from '@citrineos/base';
import { ChargingStationSequenceTypeEnum, EventGroup, GenericDeviceModelStatusEnum, type GenericDeviceModelStatusEnumType, type HandlerProperties, OCPP_2_VER_LIST, OCPP_CallAction } from '@citrineos/types';
import type { IVariableMonitoringRepository } from '@/dal/index.js';
import { IdGenerator } from '@/util/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetMonitoringBase)
export class SetMonitoringBaseResponseOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;
  private _idGenerator: IdGenerator;

  constructor({
    logger,
    ocppSender,
    variableMonitoringRepository,
    idGenerator,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    variableMonitoringRepository: IVariableMonitoringRepository;
    idGenerator: IdGenerator;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._variableMonitoringRepository = variableMonitoringRepository;
    this._idGenerator = idGenerator;
  }

  async handle(
    message: IMessage<OCPP2_response_types.SetMonitoringBaseResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('SetMonitoringBaseResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const status: GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_common_types.StatusInfoType | undefined | null =
      message.payload.statusInfo;

    if (
      status === GenericDeviceModelStatusEnum.Rejected ||
      status === GenericDeviceModelStatusEnum.NotSupported
    ) {
      this._logger.error(
        'Failed to set monitoring base.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    } else {
      // After setting monitoring base, variable monitorings on charger side are influenced
      // To get all the latest monitoring data, we intend to mask all variable monitorings on the charger as rejected.
      // Then request a GetMonitoringReport for all monitorings
      const ocppConnectionName: string = message.context.ocppConnectionName;
      await this._variableMonitoringRepository.rejectAllVariableMonitoringsByStationId(
        tenantId,
        OCPP_CallAction.SetVariableMonitoring,
        ocppConnectionName,
      );
      this._logger.debug('Rejected all variable monitorings on the charger', ocppConnectionName);

      await this._ocppSender.sendCall({
        ocppConnectionName,
        tenantId,
        protocol: message.protocol,
        action: OCPP_CallAction.GetMonitoringReport,
        eventGroup: EventGroup.Monitoring,
        payload: {
          requestId: await this._idGenerator.generateRequestId(
            tenantId,
            message.context.ocppConnectionName,
            ChargingStationSequenceTypeEnum.getMonitoringReport,
          ),
        } as OCPP2_request_types.GetMonitoringReportRequest,
      });
    }
  }
}
