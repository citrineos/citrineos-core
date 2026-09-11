// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  type IOcppSender,
} from '@citrineos/base';
import {
  ErrorCode,
  type HandlerProperties,
  Iso15118EVCertificateStatusEnum,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import { CertificateAuthorityService } from '@services/index.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.Get15118EVCertificate)
export class Get15118EVCertificateRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _certificateAuthorityService: CertificateAuthorityService;

  constructor({
    logger,
    ocppSender,
    certificateAuthorityService,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    certificateAuthorityService: CertificateAuthorityService;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._certificateAuthorityService = certificateAuthorityService;
  }

  async handle(
    message: IMessage<OCPP2_request_types.Get15118EVCertificateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('Get15118EVCertificateRequest'),
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
