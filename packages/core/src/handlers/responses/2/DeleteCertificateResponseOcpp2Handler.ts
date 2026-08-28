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
  DeleteCertificateStatusEnum,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_response_types,
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
      await this._deleteCertificateAttemptRepository.findPendingByStation(
        tenantId,
        ocppConnectionName,
      );
    // should always be true
    if (existingPendingDeleteCertificateAttempt) {
      await this._deleteCertificateAttemptRepository.updateStatus(
        tenantId,
        existingPendingDeleteCertificateAttempt.id!,
        message.payload.status,
      );
      if (message.payload.status === DeleteCertificateStatusEnum.Accepted) {
        await this._installedCertificateRepository.deleteByStationAndHashData(
          tenantId,
          ocppConnectionName,
          {
            hashAlgorithm: existingPendingDeleteCertificateAttempt.hashAlgorithm,
            issuerNameHash: existingPendingDeleteCertificateAttempt.issuerNameHash,
            issuerKeyHash: existingPendingDeleteCertificateAttempt.issuerKeyHash,
            serialNumber: existingPendingDeleteCertificateAttempt.serialNumber,
          },
        );
      }
    }
  }
}
