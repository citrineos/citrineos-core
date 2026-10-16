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
  type CertificateUseEnumType,
  type HandlerProperties,
  type InstallCertificateStatusEnumType,
  OCPP2_1,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPPVersion,
  OCPP2_response_types,
} from '@citrineos/types';
import type { InstallCertificateHelperService } from '@services/certificate/install-certificate-helper-service.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.CertificateSigned)
export class CertificateSignedResponseOcpp2Handler extends AbstractHandler {
  protected _installCertificateHelperService: InstallCertificateHelperService;

  constructor({
    logger,
    installCertificateHelperService,
  }: AbstractHandlerDependencies & {
    installCertificateHelperService: InstallCertificateHelperService;
  }) {
    super(logger);

    this._installCertificateHelperService = installCertificateHelperService;
  }

  async handle(
    message: IMessage<
      OCPP2_response_types.CertificateSignedResponse,
      OCPP2_1.CertificateSignedRequest
    >,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('CertificateSignedResponse'),
      message,
      props,
    );
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    const certSignedPayload = message.request;

    const requestId =
      message.protocol === OCPPVersion.OCPP2_1
        ? (certSignedPayload?.requestId ?? undefined)
        : undefined;

    await this._installCertificateHelperService.finalizeInstalledCertificate(
      tenantId,
      ocppConnectionName,
      message.payload.status as unknown as InstallCertificateStatusEnumType,
      requestId,
      certSignedPayload?.certificateType as unknown as CertificateUseEnumType | undefined,
    );
    // TODO: If rejected, retry and/or send to callbackUrl if originally part of a triggered refresh
    // TODO: If accepted, revoke old certificate
  }
}
