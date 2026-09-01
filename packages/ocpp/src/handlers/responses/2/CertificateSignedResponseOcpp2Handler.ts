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
  MessageOrigin,
  OCPP2_1,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPPVersion,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IOCPPMessageRepository } from '@citrineos/dal';
import type { InstallCertificateHelperService } from '@/services/certificate/installCertificateHelperService.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.CertificateSigned)
export class CertificateSignedResponseOcpp2Handler extends AbstractHandler {
  protected _ocppMessageRepository: IOCPPMessageRepository;
  protected _installCertificateHelperService: InstallCertificateHelperService;

  constructor({
    logger,
    ocppMessageRepository,
    installCertificateHelperService,
  }: AbstractHandlerDependencies & {
    ocppMessageRepository: IOCPPMessageRepository;
    installCertificateHelperService: InstallCertificateHelperService;
  }) {
    super(logger);

    this._ocppMessageRepository = ocppMessageRepository;
    this._installCertificateHelperService = installCertificateHelperService;
  }

  async handle(
    message: IMessage<OCPP2_response_types.CertificateSignedResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('CertificateSignedResponse'),
      message,
      props,
    );
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    const originalRequest = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
      where: {
        ocppConnectionName,
        correlationId: message.context.correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    const certSignedPayload = originalRequest?.payload as
      | OCPP2_1.CertificateSignedRequest
      | undefined;

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
