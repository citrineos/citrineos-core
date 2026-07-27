// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AsHandlerClass,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  MessageState,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/base';
import type { InstallCertificateHelperService } from '@modules/Certificates/src/index.js';
import { type ILogObj, Logger } from 'tslog';

@AsHandlerClass(OCPP_2_VER_LIST, OCPP_CallAction.InstallCertificate, MessageState.Response)
export class InstallCertificateResponseOcpp2Handler extends AbstractHandler {
  protected _installCertificateHelperService: InstallCertificateHelperService;

  constructor({
    ocppSender,
    logger,
    installCertificateHelperService,
  }: {
    ocppSender: IOcppSender;
    logger: Logger<ILogObj>;
    installCertificateHelperService: InstallCertificateHelperService;
  }) {
    super({ ocppSender, logger });

    this._installCertificateHelperService = installCertificateHelperService;
  }

  async handle(
    message: IMessage<OCPP2_response_types.InstallCertificateResponse>,
    props?: HandlerProperties,
  ) {
    this._logger.debug('Handler for InstallCertificateResponse received message:', message, props);
    await this._installCertificateHelperService.finalizeInstalledCertificate(
      message.context.tenantId,
      message.context.ocppConnectionName,
      message.payload.status,
    );
  }
}
