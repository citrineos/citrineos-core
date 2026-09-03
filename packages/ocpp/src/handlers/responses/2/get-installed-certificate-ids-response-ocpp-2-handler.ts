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
  GetInstalledCertificateStatusEnum,
  type HandlerProperties,
  MessageOrigin,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import { type IInstalledCertificateRepository, type IOCPPMessageRepository } from '@citrineos/dal';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetInstalledCertificateIds)
export class GetInstalledCertificateIdsResponseOcpp2Handler extends AbstractHandler {
  protected _ocppMessageRepository: IOCPPMessageRepository;
  protected _installedCertificateRepository: IInstalledCertificateRepository;

  constructor({
    logger,
    ocppMessageRepository,
    installedCertificateRepository,
  }: AbstractHandlerDependencies & {
    ocppMessageRepository: IOCPPMessageRepository;
    installedCertificateRepository: IInstalledCertificateRepository;
  }) {
    super(logger);

    this._ocppMessageRepository = ocppMessageRepository;
    this._installedCertificateRepository = installedCertificateRepository;
  }

  async handle(
    message: IMessage<OCPP2_response_types.GetInstalledCertificateIdsResponse>,
    props?: HandlerProperties,
  ) {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('GetInstalledCertificateIdsResponse'),
      message,
      props,
    );
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const correlationId = message.context.correlationId;
    const certificateHashDataList: OCPP2_common_types.CertificateHashDataChainType[] =
      message.payload.certificateHashDataChain!;
    const requestedCertificateType = await this.readRequestedCertificateType(
      tenantId,
      ocppConnectionName,
      correlationId,
    );

    if (message.payload.status === GetInstalledCertificateStatusEnum.NotFound) {
      if (requestedCertificateType) {
        this._logger.debug(
          `GetInstalledCertificateIdsRequest sent to ${ocppConnectionName} had certificateType: ${requestedCertificateType}. Cleaning up installed certificates of this type in DB if any.`,
        );
        const certificateTypes = Array.isArray(requestedCertificateType)
          ? requestedCertificateType
          : [requestedCertificateType];
        for (const type of certificateTypes) {
          await this._installedCertificateRepository.deleteByStationAndType(
            tenantId,
            ocppConnectionName,
            type as unknown as CertificateUseEnumType,
          );
        }
      } else {
        this._logger.debug(
          `GetInstalledCertificateIdsRequest sent to ${ocppConnectionName} had no certificateType. Cleaning up all installed certificates in DB if any.`,
        );
        await this._installedCertificateRepository.deleteByStation(tenantId, ocppConnectionName);
      }
      return;
    }

    // Reconcile stored installed-certificate records against what the station reported: create any
    // reported certificate we don't have, and remove any stored certificate the station no longer
    // reports (scoped to the requested certificate type(s) when the request specified them).
    const reported = certificateHashDataList ?? [];
    const reportedKeys = new Set(
      reported.map((wrap) =>
        installedCertificateKey(
          wrap.certificateType as unknown as CertificateUseEnumType,
          wrap.certificateHashData,
        ),
      ),
    );

    const requestedTypes = requestedCertificateType
      ? (Array.isArray(requestedCertificateType)
          ? requestedCertificateType
          : [requestedCertificateType]
        ).map((type) => type as unknown as CertificateUseEnumType)
      : undefined;
    const allStored = await this._installedCertificateRepository.findAllByStation(
      tenantId,
      ocppConnectionName,
    );
    const stored = requestedTypes
      ? allStored.filter((existing) => requestedTypes.includes(existing.certificateType))
      : allStored;
    const storedKeys = new Set(
      stored.map((existing) => installedCertificateKey(existing.certificateType, existing)),
    );

    for (const certificateHashDataWrap of reported) {
      const certificateHashData = certificateHashDataWrap.certificateHashData;
      const certificateType =
        certificateHashDataWrap.certificateType as unknown as CertificateUseEnumType;
      if (storedKeys.has(installedCertificateKey(certificateType, certificateHashData))) {
        this._logger.debug('Installed certificate already recorded', certificateHashData);
        continue;
      }
      const created = await this._installedCertificateRepository.createInstalledCertificate(
        tenantId,
        {
          ocppConnectionName: ocppConnectionName,
          certificateType: certificateType,
          hashAlgorithm: certificateHashData.hashAlgorithm,
          issuerNameHash: certificateHashData.issuerNameHash,
          issuerKeyHash: certificateHashData.issuerKeyHash,
          serialNumber: certificateHashData.serialNumber,
        },
      );
      this._logger.debug('Created new installed certificate record', created);
    }

    for (const existing of stored) {
      if (reportedKeys.has(installedCertificateKey(existing.certificateType, existing))) {
        continue;
      }
      await this._installedCertificateRepository.deleteById(tenantId, existing.id!);
      this._logger.debug('Removed installed certificate no longer on the station', existing);
    }
  }

  private async readRequestedCertificateType(
    tenantId: number,
    ocppConnectionName: string,
    correlationId: string,
  ): Promise<OCPP2_request_types.GetInstalledCertificateIdsRequest['certificateType']> {
    const request = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
      where: {
        ocppConnectionName: ocppConnectionName,
        correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });

    const payload = request?.payload as
      | OCPP2_request_types.GetInstalledCertificateIdsRequest
      | undefined;
    return payload?.certificateType ?? undefined;
  }
}

function installedCertificateKey(
  certificateType: CertificateUseEnumType,
  hashData: {
    hashAlgorithm?: string | null;
    issuerNameHash?: string | null;
    issuerKeyHash?: string | null;
    serialNumber?: string | null;
  },
): string {
  return [
    certificateType,
    hashData.hashAlgorithm,
    hashData.issuerNameHash,
    hashData.issuerKeyHash,
    hashData.serialNumber,
  ].join('|');
}
