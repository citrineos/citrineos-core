// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AbstractModule,
  AsHandler,
  type CallAction,
  EventGroup,
  type HandlerProperties,
  type IFileStorage,
  type IMessage,
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
