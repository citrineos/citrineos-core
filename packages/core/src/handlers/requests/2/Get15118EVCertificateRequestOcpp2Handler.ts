// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type ILogObj, Logger } from 'tslog';
import {
  AbstractHandler,
  AsHandlerClass,
  ErrorCode,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  Iso15118EVCertificateStatusEnum,
  MessageState,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/base';
import { CertificateAuthorityService } from '@util/index.js';

@AsHandlerClass(OCPP_2_VER_LIST, OCPP_CallAction.Get15118EVCertificate, MessageState.Request)
export class Get15118EVCertificateRequestOcpp2Handler extends AbstractHandler {
  protected _certificateAuthorityService: CertificateAuthorityService;

  constructor({
    ocppSender,
    logger,
    certificateAuthorityService,
  }: {
    ocppSender: IOcppSender;
    logger: Logger<ILogObj>;
    certificateAuthorityService: CertificateAuthorityService;
  }) {
    super({ ocppSender, logger });

    this._certificateAuthorityService = certificateAuthorityService;
  }

  async handle(
    message: IMessage<OCPP2_request_types.Get15118EVCertificateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'Handler for Get15118EVCertificateRequest received message:',
      message,
      props,
    );
    const request: OCPP2_request_types.Get15118EVCertificateRequest = message.payload;

    try {
      const exiResponse = await this._certificateAuthorityService.getSignedContractData(
        request.iso15118SchemaVersion,
        request.exiRequest,
      );
      await this._ocppSender.sendCallResultWithMessage(message, {
        status: Iso15118EVCertificateStatusEnum.Accepted,
        exiResponse: exiResponse,
      } as OCPP2_response_types.Get15118EVCertificateResponse);
    } catch (error) {
      await this._ocppSender.sendCallResultWithMessage(message, {
        status: Iso15118EVCertificateStatusEnum.Failed,
        statusInfo: {
          reasonCode: ErrorCode.GenericError,
          additionalInfo: error instanceof Error ? error.message : undefined,
        },
        exiResponse: '',
      } as OCPP2_response_types.Get15118EVCertificateResponse);
    }
  }
}
