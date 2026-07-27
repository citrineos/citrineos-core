// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AsHandlerClass,
  type HandlerProperties,
  type IMessage,
  type InstallCertificateStatusEnumType,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPPVersion,
} from '../../../../../base/dist';
import type { IOCPPMessageRepository } from '@dal/index.js';
import { type ILogObj, Logger } from 'tslog';
import type { IOcppSender } from '../../../../../base/dist/src/interfaces/handlers/IOcppSender.js';
import type { InstallCertificateHelperService } from '@modules/Certificates/src/index.js';

@AsHandlerClass(OCPP_2_VER_LIST, OCPP_CallAction.CertificateSigned, MessageState.Response)
export class CertificateSignedResponseHandler extends AbstractHandler {
  protected _ocppMessageRepository: IOCPPMessageRepository;
  protected _installCertificateHelperService: InstallCertificateHelperService;

  constructor({
    ocppSender,
    logger,
    ocppMessageRepository,
    installCertificateHelperService,
  }: {
    ocppSender: IOcppSender;
    logger: Logger<ILogObj>;
    ocppMessageRepository: IOCPPMessageRepository;
    installCertificateHelperService: InstallCertificateHelperService;
  }) {
    super({ ocppSender, logger });

    this._ocppMessageRepository = ocppMessageRepository;
    this._installCertificateHelperService = installCertificateHelperService;
  }

  async handle(
    message: IMessage<OCPP2_response_types.CertificateSignedResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Handler for CertificateSignedResponse received message:', message, props);
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    let requestId: number | undefined;
    if (message.protocol === OCPPVersion.OCPP2_1) {
      const originalRequest = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
        where: {
          ocppConnectionName,
          correlationId: message.context.correlationId,
          origin: MessageOrigin.ChargingStationManagementSystem,
        },
      });
      if (originalRequest) {
        const certSignedPayload = originalRequest.message[3] as OCPP2_1.CertificateSignedRequest;
        requestId = certSignedPayload?.requestId ?? undefined;
      }
    }

    await this._installCertificateHelperService.finalizeInstalledCertificate(
      tenantId,
      ocppConnectionName,
      message.payload.status as unknown as InstallCertificateStatusEnumType,
      requestId,
    );
    // TODO: If rejected, retry and/or send to callbackUrl if originally part of a triggered refresh
    // TODO: If accepted, revoke old certificate
  }
}
