// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/base';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.ClearedChargingLimit)
export class ClearedChargingLimitRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;

  constructor({ logger, ocppSender }: AbstractHandlerDependencies & { ocppSender: IOcppSender }) {
    super(logger);
    this._ocppSender = ocppSender;
  }

  async handle(
    message: IMessage<OCPP2_request_types.ClearedChargingLimitRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('ClearedChargingLimitRequest'),
      message,
      props,
    );

    const response: OCPP2_response_types.ClearedChargingLimitResponse = {};
    await this._ocppSender.sendCallResultWithMessage(message, response);
  }
}
