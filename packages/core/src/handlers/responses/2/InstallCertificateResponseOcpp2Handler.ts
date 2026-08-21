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
  type HandlerProperties,
  MessageOrigin,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IOCPPMessageRepository } from '@dal/index.js';
import type { InstallCertificateHelperService } from '@modules/Certificates/src/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.InstallCertificate)
export class InstallCertificateResponseOcpp2Handler extends AbstractHandler {
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
    message: IMessage<OCPP2_response_types.InstallCertificateResponse>,
    props?: HandlerProperties,
  ) {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('InstallCertificateResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    // The station can have more than one certificate in flight, and the response says only whether
    // it was accepted. The certificate it answers for is on the request that was sent out.
    const originalRequest = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
      where: {
        ocppConnectionName,
        correlationId: message.context.correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    const requestPayload = originalRequest?.payload as
      | OCPP2_request_types.InstallCertificateRequest
      | undefined;

    await this._installCertificateHelperService.finalizeInstalledCertificate(
      tenantId,
      ocppConnectionName,
      message.payload.status,
      undefined,
      requestPayload?.certificateType,
    );
  }
}
