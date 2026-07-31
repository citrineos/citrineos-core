// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
  OCPP2_response_types,
} from '@citrineos/base';
import {
  DeleteCertificateStatusEnum,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/types';
import type {
  IDeleteCertificateAttemptRepository,
  IInstalledCertificateRepository,
} from '@dal/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.DeleteCertificate)
export class DeleteCertificateResponseOcpp2Handler extends AbstractHandler {
  protected _deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  protected _installedCertificateRepository: IInstalledCertificateRepository;

  constructor({
    logger,
    deleteCertificateAttemptRepository,
    installedCertificateRepository,
  }: AbstractHandlerDependencies & {
    deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
    installedCertificateRepository: IInstalledCertificateRepository;
  }) {
    super(logger);

    this._deleteCertificateAttemptRepository = deleteCertificateAttemptRepository;
    this._installedCertificateRepository = installedCertificateRepository;
  }

  async handle(
    message: IMessage<OCPP2_response_types.DeleteCertificateResponse>,
    props?: HandlerProperties,
  ) {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('DeleteCertificateResponse'),
      message,
      props,
    );
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
