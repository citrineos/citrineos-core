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
  type IVatProvider,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';

@AsRequestHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.VatNumberValidation)
export class VatNumberValidationRequestOcpp21Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _vatProvider?: IVatProvider;

  constructor({
    logger,
    ocppSender,
    viesVatProvider,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    viesVatProvider: IVatProvider;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._vatProvider = viesVatProvider;
  }

  async handle(
    message: IMessage<OCPP2_1.VatNumberValidationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('VatNumberValidationRequest'),
      message,
      props,
    );

    const request = message.payload;

    const company = this._vatProvider ? await this._vatProvider.getVat(request.vatNumber) : null;

    const response: OCPP2_1.VatNumberValidationResponse = {
      vatNumber: request.vatNumber,
      evseId: request.evseId,
      status: company
        ? OCPP2_1.GenericStatusEnumType.Accepted
        : OCPP2_1.GenericStatusEnumType.Rejected,
      company,
    };

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('VatNumberValidationResponse'),
      messageConfirmation,
    );
  }
}
