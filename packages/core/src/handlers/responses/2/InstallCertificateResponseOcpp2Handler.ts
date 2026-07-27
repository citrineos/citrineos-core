// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, type AbstractHandlerDependencies, AsResponseHandler, type IMessage, OCPP2_response_types } from '@citrineos/base';
import { type HandlerProperties, OCPP_2_VER_LIST, OCPP_CallAction } from '@citrineos/types';
import type { InstallCertificateHelperService } from '@modules/Certificates/src/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.InstallCertificate)
export class InstallCertificateResponseOcpp2Handler extends AbstractHandler {
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
    message: IMessage<OCPP2_response_types.InstallCertificateResponse>,
    props?: HandlerProperties,
  ) {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('InstallCertificateResponse'),
      message,
      props,
    );
    await this._installCertificateHelperService.finalizeInstalledCertificate(
      message.context.tenantId,
      message.context.ocppConnectionName,
      message.payload.status,
    );
  }
}
