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
  GenericStatusEnum,
  type GenericStatusEnumType,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_common_types,
  OCPP2_response_types,
} from '@citrineos/types';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetMonitoringLevel)
export class SetMonitoringLevelResponseOcpp2Handler extends AbstractHandler {
  constructor({ logger }: AbstractHandlerDependencies) {
    super(logger);
  }

  async handle(
    message: IMessage<OCPP2_response_types.SetMonitoringLevelResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('SetMonitoringLevelResponse'),
      message,
      props,
    );

    const status: GenericStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_common_types.StatusInfoType | undefined | null =
      message.payload.statusInfo;
    if (status === GenericStatusEnum.Rejected) {
      this._logger.error(
        'Failed to set monitoring level.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }
}
