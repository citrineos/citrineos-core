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
  MessageOrigin,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import type {
  IDeleteCertificateAttemptRepository,
  IInstalledCertificateRepository,
  IOCPPMessageRepository,
} from '@dal/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.DeleteCertificate)
export class DeleteCertificateResponseOcpp2Handler extends AbstractHandler {
  protected _deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  protected _installedCertificateRepository: IInstalledCertificateRepository;
  protected _ocppMessageRepository: IOCPPMessageRepository;

  constructor({
    logger,
    deleteCertificateAttemptRepository,
    installedCertificateRepository,
    ocppMessageRepository,
  }: AbstractHandlerDependencies & {
    deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
    installedCertificateRepository: IInstalledCertificateRepository;
    ocppMessageRepository: IOCPPMessageRepository;
  }) {
    super(logger);

    this._deleteCertificateAttemptRepository = deleteCertificateAttemptRepository;
    this._installedCertificateRepository = installedCertificateRepository;
    this._ocppMessageRepository = ocppMessageRepository;
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

    const originalRequest = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
      where: {
        ocppConnectionName,
        correlationId: message.context.correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    const certificateHashData = (
      originalRequest?.payload as OCPP2_request_types.DeleteCertificateRequest | undefined
    )?.certificateHashData;

    const existingPendingDeleteCertificateAttempt =
      await this._deleteCertificateAttemptRepository.readOnlyOneByQuery(tenantId, {
        where: {
          ocppConnectionName: ocppConnectionName,
          status: null,
          ...(certificateHashData
            ? {
                hashAlgorithm: certificateHashData.hashAlgorithm,
                issuerNameHash: certificateHashData.issuerNameHash,
                issuerKeyHash: certificateHashData.issuerKeyHash,
                serialNumber: certificateHashData.serialNumber,
              }
            : {}),
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
