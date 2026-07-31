// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AbstractModule,
  EventGroup,
  type OcppModuleDependencies,
} from '@citrineos/base';
import type {
  IDeleteCertificateAttemptRepository,
  IInstallCertificateAttemptRepository,
  IInstalledCertificateRepository,
} from '@dal/interfaces/repositories.js';
import { CertificateAuthorityService } from '@util/index.js';
import type { InstallCertificateHelperService } from './installCertificateHelperService.js';

export interface CertificatesModuleDependencies extends OcppModuleDependencies {
  installedCertificateRepository: IInstalledCertificateRepository;
  installCertificateAttemptRepository: IInstallCertificateAttemptRepository;
  deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
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

  protected _installedCertificateRepository: IInstalledCertificateRepository;
  protected _installCertificateAttemptRepository: IInstallCertificateAttemptRepository;
  protected _deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  protected _certificateAuthorityService: CertificateAuthorityService;
  protected _installCertificateHelperService: InstallCertificateHelperService;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
    installedCertificateRepository,
    installCertificateAttemptRepository,
    deleteCertificateAttemptRepository,
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
      ocppSender,
      logger,
      ocppValidator,
      certificatesHandlers,
    );

    this._installedCertificateRepository = installedCertificateRepository;
    this._installCertificateAttemptRepository = installCertificateAttemptRepository;
    this._deleteCertificateAttemptRepository = deleteCertificateAttemptRepository;
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
}

export default CertificatesModule;
