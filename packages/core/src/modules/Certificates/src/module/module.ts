// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AbstractModule,
  AsHandler,
  type CallAction,
  type CertificateUseEnumType,
  DeleteCertificateStatusEnum,
  EventGroup,
  GetInstalledCertificateStatusEnum,
  type HandlerProperties,
  type IFileStorage,
  type IMessage,
  MessageOrigin,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  type OcppModuleDependencies,
} from '@citrineos/base';
import type {
  ICertificateRepository,
  IDeleteCertificateAttemptRepository,
  IDeviceModelRepository,
  IInstallCertificateAttemptRepository,
  IInstalledCertificateRepository,
  IOCPPMessageRepository,
} from '@dal/interfaces/repositories.js';
import { InstalledCertificate } from '@dal/layers/sequelize/index.js';

import { CertificateAuthorityService } from '@util/index.js';
import { Crypto } from '@peculiar/webcrypto';
import * as pkijs from 'pkijs';

import type { InstallCertificateHelperService } from './installCertificateHelperService.js';

const cryptoEngine = new pkijs.CryptoEngine({
  crypto: new Crypto(),
});
pkijs.setEngine('crypto', cryptoEngine as pkijs.ICryptoEngine);

export interface CertificatesModuleDependencies extends OcppModuleDependencies {
  fileStorage: IFileStorage;
  deviceModelRepository: IDeviceModelRepository;
  certificateRepository: ICertificateRepository;
  installedCertificateRepository: IInstalledCertificateRepository;
  installCertificateAttemptRepository: IInstallCertificateAttemptRepository;
  deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  ocppMessageRepository: IOCPPMessageRepository;
  certificateAuthorityService: CertificateAuthorityService;
  installCertificateHelperService: InstallCertificateHelperService;
  certificatesHandlers?: AbstractHandler[];
}

/**
 * Component that handles provisioning related messages.
 */
export class CertificatesModule extends AbstractModule {
  /**
   * Fields
   */

  _requests: CallAction[] = [];

  _responses: CallAction[] = [];

  protected _deviceModelRepository: IDeviceModelRepository;
  protected _certificateRepository: ICertificateRepository;
  protected _installedCertificateRepository: IInstalledCertificateRepository;
  protected _installCertificateAttemptRepository: IInstallCertificateAttemptRepository;
  protected _deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  protected _ocppMessageRepository: IOCPPMessageRepository;
  protected _certificateAuthorityService: CertificateAuthorityService;
  protected _fileStorage: IFileStorage;
  protected _installCertificateHelperService: InstallCertificateHelperService;

  constructor({
    config,
    cache,
    sender,
    handler,
    fileStorage,
    logger,
    ocppValidator,
    deviceModelRepository,
    certificateRepository,
    installedCertificateRepository,
    installCertificateAttemptRepository,
    deleteCertificateAttemptRepository,
    ocppMessageRepository,
    certificateAuthorityService,
    installCertificateHelperService,
    certificatesHandlers,
  }: CertificatesModuleDependencies) {
    super(
      config,
      cache,
      handler,
      sender,
      EventGroup.Certificates,
      logger,
      ocppValidator,
      certificatesHandlers,
    );

    // TODO potentially deprecated _requests and _responses
    this._requests = config.modules.certificates?.requests ?? [];
    this._responses = config.modules.certificates?.responses ?? [];
    this._fileStorage = fileStorage;

    this._deviceModelRepository = deviceModelRepository;
    this._certificateRepository = certificateRepository;
    this._installedCertificateRepository = installedCertificateRepository;
    this._installCertificateAttemptRepository = installCertificateAttemptRepository;
    this._deleteCertificateAttemptRepository = deleteCertificateAttemptRepository;
    this._ocppMessageRepository = ocppMessageRepository;
    this._certificateAuthorityService = certificateAuthorityService;

    this._installCertificateHelperService = installCertificateHelperService;
  }

  get certificateAuthorityService(): CertificateAuthorityService {
    return this._certificateAuthorityService;
  }

  get installedCertificateRepository(): IInstalledCertificateRepository {
    return this._installedCertificateRepository;
  }

  get deleteCertificateAttemptRepository(): IDeleteCertificateAttemptRepository {
    return this._deleteCertificateAttemptRepository;
  }

  get installCertificateHelperService(): InstallCertificateHelperService {
    return this._installCertificateHelperService;
  }

  /**
   * Handle responses
   */

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.DeleteCertificate)
  protected async _handleDeleteCertificate(
    message: IMessage<OCPP2_response_types.DeleteCertificateResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('DeleteCertificate received:', message, props);
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const existingPendingDeleteCertificateAttempt =
      await this.deleteCertificateAttemptRepository.readOnlyOneByQuery(tenantId, {
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
          await this.installedCertificateRepository.readAllByQuery(tenantId, {
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

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetInstalledCertificateIds)
  protected async _handleGetInstalledCertificateIds(
    message: IMessage<OCPP2_response_types.GetInstalledCertificateIdsResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetInstalledCertificateIds received:', message, props);
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
        const getInstalledCertificateIdsRequest = request
          .message[3] as OCPP2_request_types.GetInstalledCertificateIdsRequest;
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
          await this.installedCertificateRepository.deleteAllByQuery(tenantId, {
            where: {
              ocppConnectionName: ocppConnectionName,
              certificateType,
            },
          });
        } else {
          this._logger.debug(
            `GetInstalledCertificateIdsRequest sent to ${ocppConnectionName} had no certificateType. Cleaning up all installed certificates in DB if any.`,
          );
          await this.installedCertificateRepository.deleteAllByQuery(tenantId, {
            where: {
              ocppConnectionName: ocppConnectionName,
            },
          });
        }
      }
      return;
    }
    if (certificateHashDataList && certificateHashDataList.length > 0) {
      for (const certificateHashDataWrap of certificateHashDataList) {
        const certificateHashData = certificateHashDataWrap.certificateHashData;
        const certificateType =
          certificateHashDataWrap.certificateType as unknown as CertificateUseEnumType;
        let existingInstalledCertificate =
          await this._installedCertificateRepository.readOnlyOneByQuery(tenantId, {
            where: {
              ocppConnectionName: ocppConnectionName,
              certificateType: certificateType,
            },
          });
        if (existingInstalledCertificate) {
          existingInstalledCertificate.hashAlgorithm = certificateHashData.hashAlgorithm;
          existingInstalledCertificate.issuerNameHash = certificateHashData.issuerNameHash;
          existingInstalledCertificate.issuerKeyHash = certificateHashData.issuerKeyHash;
          existingInstalledCertificate.serialNumber = certificateHashData.serialNumber;
          await existingInstalledCertificate.save();
          this._logger.debug('Updated installed certificate record', existingInstalledCertificate);
        } else {
          existingInstalledCertificate = new InstalledCertificate();
          existingInstalledCertificate.hashAlgorithm = certificateHashData.hashAlgorithm;
          existingInstalledCertificate.issuerNameHash = certificateHashData.issuerNameHash;
          existingInstalledCertificate.issuerKeyHash = certificateHashData.issuerKeyHash;
          existingInstalledCertificate.serialNumber = certificateHashData.serialNumber;
          existingInstalledCertificate.ocppConnectionName = ocppConnectionName;
          existingInstalledCertificate.certificateType = certificateType;
          await existingInstalledCertificate.save();
          this._logger.debug(
            'Created new installed certificate record',
            existingInstalledCertificate,
          );
        }
      }
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.InstallCertificate)
  protected async _handleInstallCertificate(
    message: IMessage<OCPP2_response_types.InstallCertificateResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('InstallCertificate received:', message, props);
    await this.installCertificateHelperService.finalizeInstalledCertificate(
      message.context.tenantId,
      message.context.ocppConnectionName,
      message.payload.status,
    );
  }
}

export default CertificatesModule;
