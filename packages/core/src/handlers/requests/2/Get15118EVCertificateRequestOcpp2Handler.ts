// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  ErrorCode,
  type HandlerProperties,
  type IMessage,
  Iso15118EVCertificateStatusEnum,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/base';
import { CertificateAuthorityService } from '@util/index.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.Get15118EVCertificate)
export class Get15118EVCertificateRequestOcpp2Handler extends AbstractHandler {
  protected _certificateAuthorityService: CertificateAuthorityService;

  constructor({
    ocppSender,
    logger,
    certificateAuthorityService,
  }: AbstractHandlerDependencies & {
    certificateAuthorityService: CertificateAuthorityService;
  }) {
    super(ocppSender, logger);

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
