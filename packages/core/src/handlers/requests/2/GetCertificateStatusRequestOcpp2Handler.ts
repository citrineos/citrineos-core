// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AsRequestHandler,
  ErrorCode,
  GetCertificateStatusEnum,
  type HandlerProperties,
  type IMessage,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/base';
import jsrsasign from 'jsrsasign';
import { sendOCSPRequest } from '@util/index.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetCertificateStatus)
export class GetCertificateStatusRequestOcpp2Handler extends AbstractHandler {
  async handle(
    message: IMessage<OCPP2_request_types.GetCertificateStatusRequest>,
    props?: HandlerProperties,
  ) {
    this._logger.debug('Handler for GetCertificateStatusRequest received message:', message, props);

    const reqData = message.payload.ocspRequestData;
    try {
      const ocspRequest = new jsrsasign.KJUR.asn1.ocsp.Request({
        alg: reqData.hashAlgorithm,
        keyhash: reqData.issuerKeyHash,
        namehash: reqData.issuerNameHash,
        serial: reqData.serialNumber,
      });
      const ocspResponse = await sendOCSPRequest(ocspRequest, reqData.responderURL);
      await this._ocppSender.sendCallResultWithMessage(message, {
        status: GetCertificateStatusEnum.Accepted,
        ocspResponse: ocspResponse,
      } as OCPP2_response_types.GetCertificateStatusResponse);
    } catch (error) {
      this._logger.error(`GetCertificateStatus failed: ${error}`);
      await this._ocppSender.sendCallResultWithMessage(message, {
        status: GetCertificateStatusEnum.Failed,
        statusInfo: { reasonCode: ErrorCode.GenericError },
      } as OCPP2_response_types.GetCertificateStatusResponse);
    }
  }
}
