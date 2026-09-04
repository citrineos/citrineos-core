// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import {
  GenericDeviceModelStatusEnum,
  type GenericDeviceModelStatusEnumType,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_common_types,
  OCPP2_response_types,
} from '@citrineos/types';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetMonitoringReport)
export class GetMonitoringReportResponseOcpp2Handler extends AbstractHandler {
  constructor({ logger }: AbstractHandlerDependencies) {
    super(logger);
  }

  async handle(
    message: IMessage<OCPP2_response_types.GetMonitoringReportResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('GetMonitoringReportResponse'),
      message,
      props,
    );

    const status: GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_common_types.StatusInfoType | undefined | null =
      message.payload.statusInfo;

    if (
      status === GenericDeviceModelStatusEnum.Rejected ||
      status === GenericDeviceModelStatusEnum.NotSupported
    ) {
      this._logger.error(
        'Failed to get monitoring report.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }
}
