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
import {
  type IInstalledCertificateRepository,
  InstalledCertificate,
  type IOCPPMessageRepository,
} from '@dal/index.js';

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
      const certificateType = requestedCertificateType;
      if (certificateType) {
        this._logger.debug(
          `GetInstalledCertificateIdsRequest sent to ${ocppConnectionName} had certificateType: ${certificateType}. Cleaning up installed certificates of this type in DB if any.`,
        );
        await this._installedCertificateRepository.deleteAllByQuery(tenantId, {
          where: {
            ocppConnectionName: ocppConnectionName,
            certificateType,
          },
        });
      } else {
        this._logger.debug(
          `GetInstalledCertificateIdsRequest sent to ${ocppConnectionName} had no certificateType. Cleaning up all installed certificates in DB if any.`,
        );
        await this._installedCertificateRepository.deleteAllByQuery(tenantId, {
          where: {
            ocppConnectionName: ocppConnectionName,
          },
        });
      }
      return;
    }
    const reported = certificateHashDataList ?? [];
    const reportedKeys = new Set(
      reported.map((wrap) =>
        installedCertificateKey(
          wrap.certificateType as unknown as CertificateUseEnumType,
          wrap.certificateHashData,
        ),
      ),
    );

    for (const certificateHashDataWrap of reported) {
      const certificateHashData = certificateHashDataWrap.certificateHashData;
      const certificateType =
        certificateHashDataWrap.certificateType as unknown as CertificateUseEnumType;
      const existingInstalledCertificate =
        await this._installedCertificateRepository.readOnlyOneByQuery(tenantId, {
          where: {
            ocppConnectionName: ocppConnectionName,
            certificateType: certificateType,
            hashAlgorithm: certificateHashData.hashAlgorithm,
            issuerNameHash: certificateHashData.issuerNameHash,
            issuerKeyHash: certificateHashData.issuerKeyHash,
            serialNumber: certificateHashData.serialNumber,
          },
        });
      if (existingInstalledCertificate) {
        this._logger.debug('Installed certificate already recorded', existingInstalledCertificate);
      } else {
        const installedCertificate = new InstalledCertificate();
        installedCertificate.hashAlgorithm = certificateHashData.hashAlgorithm;
        installedCertificate.issuerNameHash = certificateHashData.issuerNameHash;
        installedCertificate.issuerKeyHash = certificateHashData.issuerKeyHash;
        installedCertificate.serialNumber = certificateHashData.serialNumber;
        installedCertificate.ocppConnectionName = ocppConnectionName;
        installedCertificate.certificateType = certificateType;
        await installedCertificate.save();
        this._logger.debug('Created new installed certificate record', installedCertificate);
      }
    }

    const storedForStation = await this._installedCertificateRepository.readAllByQuery(tenantId, {
      where: {
        ocppConnectionName: ocppConnectionName,
        ...(requestedCertificateType ? { certificateType: requestedCertificateType } : {}),
      },
    });

    for (const stored of storedForStation) {
      const key = installedCertificateKey(stored.certificateType, stored);
      if (reportedKeys.has(key)) {
        continue;
      }
      await this._installedCertificateRepository.deleteByKey(tenantId, String(stored.id));
      this._logger.debug('Removed installed certificate no longer on the station', stored);
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
