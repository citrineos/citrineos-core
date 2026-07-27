// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AsHandlerClass,
  DeleteCertificateStatusEnum,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  MessageState,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/base';
import type {
  IDeleteCertificateAttemptRepository,
  IInstalledCertificateRepository,
} from '@dal/index.js';
import { type ILogObj, Logger } from 'tslog';

@AsHandlerClass(OCPP_2_VER_LIST, OCPP_CallAction.DeleteCertificate, MessageState.Response)
export class DeleteCertificateResponseOcpp2Handler extends AbstractHandler {
  protected _deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  protected _installedCertificateRepository: IInstalledCertificateRepository;

  constructor({
    ocppSender,
    logger,
    deleteCertificateAttemptRepository,
    installedCertificateRepository,
  }: {
    ocppSender: IOcppSender;
    logger: Logger<ILogObj>;
    deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
    installedCertificateRepository: IInstalledCertificateRepository;
  }) {
    super({ ocppSender, logger });

    this._deleteCertificateAttemptRepository = deleteCertificateAttemptRepository;
    this._installedCertificateRepository = installedCertificateRepository;
  }

  async handle(
    message: IMessage<OCPP2_response_types.DeleteCertificateResponse>,
    props?: HandlerProperties,
  ) {
    this._logger.debug('Handler for DeleteCertificateResponse received message:', message, props);
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const existingPendingDeleteCertificateAttempt =
      await this._deleteCertificateAttemptRepository.readOnlyOneByQuery(tenantId, {
        where: {
          ocppConnectionName: ocppConnectionName,
          status: null,
        },
      });
    // should always be true
    if (existingPendingDeleteCertificateAttempt) {
      existingPendingDeleteCertificateAttempt.status = message.payload.status;
      await existingPendingDeleteCertificateAttempt.save();
      if (existingPendingDeleteCertificateAttempt.status === DeleteCertificateStatusEnum.Accepted) {
        const existingInstalledCertificates =
          await this._installedCertificateRepository.readAllByQuery(tenantId, {
            where: {
              ocppConnectionName: ocppConnectionName,
              hashAlgorithm: existingPendingDeleteCertificateAttempt.hashAlgorithm,
              issuerNameHash: existingPendingDeleteCertificateAttempt.issuerNameHash,
              issuerKeyHash: existingPendingDeleteCertificateAttempt.issuerKeyHash,
              serialNumber: existingPendingDeleteCertificateAttempt.serialNumber,
            },
          });
        // should always be true
        if (existingInstalledCertificates) {
          for (const existingInstalledCertificate of existingInstalledCertificates) {
            await existingInstalledCertificate.destroy();
          }
        }
      }
    }
  }
}
