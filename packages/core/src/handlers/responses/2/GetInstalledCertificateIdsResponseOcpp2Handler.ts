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
    if (message.payload.status === GetInstalledCertificateStatusEnum.NotFound) {
      const request = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
        where: {
          ocppConnectionName: ocppConnectionName,
          correlationId,
          origin: MessageOrigin.ChargingStationManagementSystem,
        },
      });
      if (request) {
        // should always be true
        const getInstalledCertificateIdsRequest =
          request.payload as OCPP2_request_types.GetInstalledCertificateIdsRequest;
        let certificateType;
        if (
          getInstalledCertificateIdsRequest &&
          getInstalledCertificateIdsRequest.certificateType
        ) {
          certificateType = getInstalledCertificateIdsRequest.certificateType;
        }
        if (certificateType) {
          this._logger.debug(
            `GetInstalledCertificateIdsRequest sent to ${ocppConnectionName} had certificateType: ${certificateType}. Cleaning up installed certificates of this type in DB if any.`,
          );
          const certificateTypes = Array.isArray(certificateType)
            ? certificateType
            : [certificateType];
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
      }
      return;
    }
    if (certificateHashDataList && certificateHashDataList.length > 0) {
      for (const certificateHashDataWrap of certificateHashDataList) {
        const certificateHashData = certificateHashDataWrap.certificateHashData;
        const certificateType =
          certificateHashDataWrap.certificateType as unknown as CertificateUseEnumType;
        const existingInstalledCertificate =
          await this._installedCertificateRepository.findByStationAndType(
            tenantId,
            ocppConnectionName,
            certificateType,
          );
        if (existingInstalledCertificate) {
          const updated = await this._installedCertificateRepository.updateHashData(
            tenantId,
            existingInstalledCertificate.id!,
            {
              hashAlgorithm: certificateHashData.hashAlgorithm,
              issuerNameHash: certificateHashData.issuerNameHash,
              issuerKeyHash: certificateHashData.issuerKeyHash,
              serialNumber: certificateHashData.serialNumber,
            },
          );
          this._logger.debug('Updated installed certificate record', updated);
        } else {
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
      }
    }
  }
}
