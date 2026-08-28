// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { BadRequestError, type IFileStorage } from '@citrineos/base';
import {
  AttributeEnum,
  CertificateUseEnum,
  InstallCertificateStatusEnum,
  type CertificateCreate,
  type CertificateDto,
  type CertificateUseEnumType,
  type DeleteCertificateAttemptDto,
  type InstallCertificateStatusEnumType,
  type InstalledCertificateDto,
  type WebsocketServerConfig,
} from '@citrineos/types';
import {
  CertificateGenerationScope,
  type GenerateCertificateChainRequest,
  UploadExistingCertificate,
} from '@dal/interfaces/index.js';
import type {
  ICertificateRepository,
  IDeleteCertificateAttemptRepository,
  IDeviceModelRepository,
  IInstallCertificateAttemptRepository,
  IInstalledCertificateRepository,
} from '@dal/interfaces/repositories.js';
import { CountryNameEnumType, SignatureAlgorithmEnumType } from '@dal/layers/sequelize/index.js';
import {
  type CertificateAuthorityService,
  extractCertificateDetails,
  generateCertificate,
  generateCSR,
  isSignedBy,
  parseCertificateChainPem,
} from '@util/index.js';
import jsrsasign from 'jsrsasign';
import moment from 'moment';
import { type ILogObj, Logger } from 'tslog';

export const enum PemType {
  Root = 'Root',
  SubCA = 'SubCA',
  Leaf = 'Leaf',
}

type CertificateWorkingInput = Omit<CertificateCreate, 'issuerName'> & { issuerName?: string };

export class InstallCertificateHelperService {
  protected certificateRepository: ICertificateRepository;
  protected installedCertificateRepository: IInstalledCertificateRepository;
  protected installCertificateAttemptRepository: IInstallCertificateAttemptRepository;
  protected deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  protected deviceModelRepository: IDeviceModelRepository;
  protected certificateAuthorityService: CertificateAuthorityService;
  protected fileStorage: IFileStorage;
  protected logger: Logger<ILogObj>;

  constructor({
    certificateRepository,
    installedCertificateRepository,
    installCertificateAttemptRepository,
    deleteCertificateAttemptRepository,
    deviceModelRepository,
    certificateAuthorityService,
    fileStorage,
    logger,
  }: {
    certificateRepository: ICertificateRepository;
    installedCertificateRepository: IInstalledCertificateRepository;
    installCertificateAttemptRepository: IInstallCertificateAttemptRepository;
    deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
    deviceModelRepository: IDeviceModelRepository;
    certificateAuthorityService: CertificateAuthorityService;
    fileStorage: IFileStorage;
    logger: Logger<ILogObj>;
  }) {
    this.certificateRepository = certificateRepository;
    this.installedCertificateRepository = installedCertificateRepository;
    this.installCertificateAttemptRepository = installCertificateAttemptRepository;
    this.deleteCertificateAttemptRepository = deleteCertificateAttemptRepository;
    this.deviceModelRepository = deviceModelRepository;
    this.certificateAuthorityService = certificateAuthorityService;
    this.fileStorage = fileStorage;
    this.logger = logger;
  }

  async prepareToInstallCertificate(
    tenantId: number,
    ocppConnectionName: string,
    certificate: string,
    certificateType: CertificateUseEnumType,
    requestId?: number | null,
  ) {
    await this._verifyAdditionalRootCertificateCheck(
      tenantId,
      ocppConnectionName,
      certificateType,
      certificate,
    );

    const hash = this.getCertificateHash(certificate);
    const existingPendingInstallCertificateAttempt =
      await this.installCertificateAttemptRepository.findPendingByStationTypeAndCertHash(
        tenantId,
        ocppConnectionName,
        certificateType,
        hash,
        requestId,
      );
    if (!existingPendingInstallCertificateAttempt) {
      const {
        serialNumber,
        issuerName,
        organizationName,
        commonName,
        countryName,
        validBefore,
        signatureAlgorithm,
      } = extractCertificateDetails(certificate);
      let existingCertificate = await this.certificateRepository.findByFileHash(tenantId, hash);
      if (!existingCertificate) {
        existingCertificate = await this.createNewCertificate(
          tenantId,
          certificate,
          serialNumber,
          issuerName,
          organizationName,
          commonName,
          countryName,
          validBefore,
          signatureAlgorithm,
        );
      }
      await this.installCertificateAttemptRepository.createAttempt(tenantId, {
        ocppConnectionName,
        certificateType,
        certificateId: existingCertificate!.id!,
        ...(requestId != null ? { requestId } : {}),
      });
    }
  }

  async prepareToDeleteCertificate(
    tenantId: number,
    ocppConnectionName: string,
    certificateHashData: Pick<
      DeleteCertificateAttemptDto,
      'hashAlgorithm' | 'issuerNameHash' | 'issuerKeyHash' | 'serialNumber'
    >,
  ): Promise<void> {
    const existingPendingDeleteCertificateAttempt =
      await this.deleteCertificateAttemptRepository.findPendingByStationAndHashData(
        tenantId,
        ocppConnectionName,
        certificateHashData,
      );

    if (!existingPendingDeleteCertificateAttempt) {
      await this.deleteCertificateAttemptRepository.createAttempt(tenantId, {
        ocppConnectionName,
        hashAlgorithm: certificateHashData.hashAlgorithm,
        issuerNameHash: certificateHashData.issuerNameHash,
        issuerKeyHash: certificateHashData.issuerKeyHash,
        serialNumber: certificateHashData.serialNumber,
      });
    }
  }

  /**
   * OCPP 2.0.1 M05.FR.10: when SecurityCtrlr.AdditionalRootCertificateCheck is true and
   * the certificate being installed is a CSMSRootCertificate, the new root MUST be
   * signed by the CSMS root certificate it is replacing. Throws if that's not the case.
   */
  private async _verifyAdditionalRootCertificateCheck(
    tenantId: number,
    ocppConnectionName: string,
    certificateType: CertificateUseEnumType,
    newCertificatePem: string,
  ): Promise<void> {
    if (certificateType !== CertificateUseEnum.CSMSRootCertificate) {
      return;
    }

    const [additionalRootCertificateCheckAttribute] =
      await this.deviceModelRepository.readAllByQuerystring(tenantId, {
        tenantId,
        ocppConnectionName,
        component_name: 'SecurityCtrlr',
        variable_name: 'AdditionalRootCertificateCheck',
        type: AttributeEnum.Actual,
      });
    if (additionalRootCertificateCheckAttribute?.value !== 'true') {
      return;
    }

    const previouslyInstalledRoot = await this.installedCertificateRepository.findByStationAndType(
      tenantId,
      ocppConnectionName,
      CertificateUseEnum.CSMSRootCertificate,
    );
    if (!previouslyInstalledRoot) {
      // Nothing installed yet to replace
      return;
    }
    const previousRootCertificate = await this.installedCertificateRepository.getLinkedCertificate(
      tenantId,
      previouslyInstalledRoot.id!,
    );
    if (!previousRootCertificate?.certificateFileId) {
      throw new BadRequestError(
        `Cannot verify AdditionalRootCertificateCheck for ${ocppConnectionName}: the currently installed CSMS root certificate has no certificate file on record to verify the new one against.`,
      );
    }
    const previousRootPem = await this._readPemFile(
      previousRootCertificate.certificateFileId,
      'previously installed CSMS root certificate',
      ocppConnectionName,
    );

    if (!isSignedBy(newCertificatePem, previousRootPem)) {
      throw new BadRequestError(
        `Cannot install new CSMS root certificate for ${ocppConnectionName}: SecurityCtrlr.AdditionalRootCertificateCheck is enabled, so the new root certificate must be signed by the CSMS root certificate it is replacing.`,
      );
    }
  }

  async finalizeInstalledCertificate(
    tenantId: number,
    ocppConnectionName: string,
    status: InstallCertificateStatusEnumType,
    requestId?: number,
    certificateType?: CertificateUseEnumType,
  ) {
    const existingPendingInstallCertificateAttempt =
      await this.installCertificateAttemptRepository.findPendingByStation(
        tenantId,
        ocppConnectionName,
        requestId,
        certificateType,
      );
    // should always be true
    if (existingPendingInstallCertificateAttempt) {
      await this.installCertificateAttemptRepository.updateStatus(
        tenantId,
        existingPendingInstallCertificateAttempt.id!,
        status,
      );
      if (status === InstallCertificateStatusEnum.Accepted) {
        const existingInstalledCertificate =
          await this.installedCertificateRepository.findByStationAndType(
            tenantId,
            ocppConnectionName,
            existingPendingInstallCertificateAttempt.certificateType,
          );
        if (existingInstalledCertificate) {
          await this.installedCertificateRepository.setCertificateId(
            tenantId,
            existingInstalledCertificate.id!,
            existingPendingInstallCertificateAttempt.certificateId!,
          );
        } else {
          const certificate = await this.installCertificateAttemptRepository.getLinkedCertificate(
            tenantId,
            existingPendingInstallCertificateAttempt.id!,
          );
          if (certificate && certificate.certificateFileId) {
            const certificateBuffer = await this.fileStorage.getFile(certificate.certificateFileId);
            if (!certificateBuffer) {
              this.logger.error(
                'Failed to retrieve certificate file from storage for certificate',
                certificate,
              );
              return;
            }
            const certificateString = certificateBuffer.toString();
            const cert = new jsrsasign.X509();
            cert.readCertPEM(certificateString);
            await this.installedCertificateRepository.createInstalledCertificate(tenantId, {
              ocppConnectionName,
              certificateType: existingPendingInstallCertificateAttempt.certificateType,
              certificateId: existingPendingInstallCertificateAttempt.certificateId,
            });
          }
        }
      }
    }
  }

  async createNewCertificate(
    tenantId: number,
    certificate: string,
    serialNumber: number | null,
    issuerName: string | null,
    organizationName: string | null,
    commonName: string | null,
    countryName: CountryNameEnumType | null,
    validBefore: Date | null,
    signatureAlgorithm: SignatureAlgorithmEnumType | null,
  ): Promise<CertificateDto> {
    const certificateHash = this.getCertificateHash(certificate);
    const certificateFileId = await this.fileStorage.saveFile(
      `Existing_Cert_${serialNumber}.pem`,
      Buffer.from(certificate),
    );
    return await this.certificateRepository.createCertificate(tenantId, {
      serialNumber: serialNumber!,
      issuerName: issuerName!,
      organizationName: organizationName!,
      commonName: commonName!,
      countryName: countryName!,
      validBefore: validBefore ? validBefore.toISOString() : null,
      signatureAlgorithm: signatureAlgorithm!,
      certificateFileId,
      certificateFileHash: certificateHash,
    });
  }

  async handleUploadExistingCertificate(
    tenantId: number,
    identifier: string,
    uploadExistingCertificate: UploadExistingCertificate,
    filePath?: string,
  ): Promise<InstalledCertificateDto> {
    this.logger.info(
      `Uploading existing ${uploadExistingCertificate.certificateType} certificate for charger ${identifier}`,
    );
    const certificate = uploadExistingCertificate.certificate;
    const {
      serialNumber,
      issuerName,
      organizationName,
      commonName,
      countryName,
      validBefore,
      signatureAlgorithm,
    } = extractCertificateDetails(certificate);

    let existingInstalledCertificate = await this.installedCertificateRepository.findByStationAndType(
      tenantId,
      identifier,
      uploadExistingCertificate.certificateType,
    );

    if (existingInstalledCertificate) {
      let existingCertificate: CertificateDto | undefined | null =
        await this.installedCertificateRepository.getLinkedCertificate(
          tenantId,
          existingInstalledCertificate.id!,
        );
      if (existingCertificate && existingCertificate.certificateFileId) {
        throw new Error('Cannot upload exiting certificate because it already exists');
      } else if (existingCertificate && !existingCertificate.certificateFileId) {
        // set file where previously undefined
        existingCertificate.certificateFileId = await this.fileStorage.saveFile(
          filePath
            ? `${filePath}/Existing_Key_${serialNumber}.pem`
            : `Existing_Key_${serialNumber}.pem`,
          Buffer.from(certificate),
        );
        await this.certificateRepository.createCertificate(tenantId, {
          ...existingCertificate,
        });
      } else {
        // check if certificate record exists but not tied to installed certificate
        existingCertificate = await this.certificateRepository.findByFileHash(
          tenantId,
          this.getCertificateHash(certificate),
        );
        if (!existingCertificate) {
          // create new certificate record
          existingCertificate = await this.createNewCertificate(
            tenantId,
            certificate,
            serialNumber,
            issuerName,
            organizationName,
            commonName,
            countryName,
            validBefore,
            signatureAlgorithm,
          );
        }
        existingInstalledCertificate =
          (await this.installedCertificateRepository.setCertificateId(
            tenantId,
            existingInstalledCertificate.id!,
            existingCertificate.id!,
          )) ?? existingInstalledCertificate;
      }
    } else {
      // check if certificate record exists
      let existingCertificate = await this.certificateRepository.findByFileHash(
        tenantId,
        this.getCertificateHash(certificate),
      );
      // create new certificate record
      if (!existingCertificate) {
        existingCertificate = await this.createNewCertificate(
          tenantId,
          certificate,
          serialNumber,
          issuerName,
          organizationName,
          commonName,
          countryName,
          validBefore,
          signatureAlgorithm,
        );
      }
      existingInstalledCertificate =
        await this.installedCertificateRepository.createInstalledCertificate(tenantId, {
          ocppConnectionName: identifier,
          certificateType: uploadExistingCertificate.certificateType,
          certificateId: existingCertificate.id!,
        });
    }
    return existingInstalledCertificate!;
  }

  /**
   * Generates a sub CA certificate signed by a CA server.
   *
   * @param {CertificateWorkingInput} certificate - The certificate information used for generating the root certificate.
   * @return {Promise<[string, string]>} An array containing the signed certificate and the private key.
   */
  async generateSubCACertificateSignedByCAServer(
    certificate: CertificateWorkingInput,
  ): Promise<[string, string]> {
    const [csrPem, privateKeyPem] = generateCSR(certificate);
    const signedCertificate =
      await this.certificateAuthorityService.signedSubCaCertificateByExternalCA(csrPem);
    return [signedCertificate, privateKeyPem];
  }

  /**
   * Store certificate in file storage and db.
   * @param tenantId tenant id
   * @param certificateEntity certificate to be stored in db
   * @param certPem certificate pem to be stored in file storage
   * @param keyPem private key pem to be stored in file storage
   * @param filePrefix prefix for file name to be stored in file storage
   * @param filePath file path in file storage
   * @return certificate stored in db
   */
  async storeCertificateAndKey(
    tenantId: number,
    certificateEntity: CertificateWorkingInput,
    certPem: string,
    keyPem: string,
    filePrefix: PemType,
    filePath?: string,
  ): Promise<CertificateDto> {
    const certificateHash = this.getCertificateHash(certPem);
    // Store certificate and private key in file storage
    const keyPrefix = filePath ? `${filePath}/` : '';
    certificateEntity.privateKeyFileId = await this.fileStorage.saveFile(
      `${keyPrefix}${filePrefix}_Key_${certificateEntity.serialNumber}.pem`,
      Buffer.from(keyPem),
    );
    certificateEntity.certificateFileId = await this.fileStorage.saveFile(
      `${keyPrefix}${filePrefix}_Certificate_${certificateEntity.serialNumber}.pem`,
      Buffer.from(certPem),
    );
    certificateEntity.certificateFileHash = certificateHash;
    // Store certificate in db
    const certObj = new jsrsasign.X509();
    certObj.readCertPEM(certPem);
    certificateEntity.issuerName = certObj.getIssuerString();
    certificateEntity.tenantId = tenantId;
    // issuerName is now populated, so this satisfies the CertificateCreate contract.
    return await this.certificateRepository.createOrUpdateCertificate(
      tenantId,
      certificateEntity as CertificateCreate,
    );
  }

  /**
   * Groups websocket servers that should share a single regenerated chain rather than
   * each getting an independent one.
   *
   * For `FullChain`, a new root/subCA/leaf is always independent of prior state, so all
   * requested servers unconditionally share one freshly generated chain.
   *
   * For `Leaf`/`SubCAAndLeaf`, servers are grouped by whether they currently share the
   * same identifying certificate: the subCA cert for `Leaf` (since that's what's reused
   * to sign the new leaf), or the root that signed that subCA for `SubCAAndLeaf` (since
   * that's what's reused to sign the new subCA).
   */
  async groupServersForGeneration(
    tenantId: number,
    websocketConfigs: WebsocketServerConfig[],
    generationScope: CertificateGenerationScope,
  ): Promise<WebsocketServerConfig[][]> {
    if (generationScope === CertificateGenerationScope.FullChain) {
      return [websocketConfigs];
    }

    const lineageKeyOf = async (config: WebsocketServerConfig): Promise<string> => {
      const subCACertPem = await this._readCurrentSubCACertPem(config);
      if (generationScope === CertificateGenerationScope.Leaf) {
        return `subCA:${this.getCertificateHash(subCACertPem)}`;
      }
      // SubCAAndLeaf: group by the root that signed the current subCA, not the subCA
      // itself, since a new subCA (and leaf) will be minted from that root for the group.
      const subCARecord = await this._findCertificateByPem(tenantId, subCACertPem, config.id);
      if (subCARecord.signedBy == null) {
        throw new BadRequestError(
          `Cannot regenerate subCA and leaf certificates for server ${config.id}: the current subCA has no locally-generated root to reuse.`,
        );
      }
      return `root:${subCARecord.signedBy}`;
    };

    const groupsByLineageKey = new Map<string, WebsocketServerConfig[]>();
    for (const config of websocketConfigs) {
      const key = await lineageKeyOf(config);
      const group = groupsByLineageKey.get(key);
      if (group) {
        group.push(config);
      } else {
        groupsByLineageKey.set(key, [config]);
      }
    }
    return [...groupsByLineageKey.values()];
  }

  /**
   * Generates some or all of a websocket server's TLS certificate chain, scoped by
   * `certRequest.generationScope`. Reuses the server's
   * currently-configured cert/key files to identify and re-sign against the existing
   * root/subCA when not regenerating them. Returns the new cert/key file paths to be
   * written onto the server's config (the caller is responsible for persisting the
   * config and reloading the live TLS listener).
   */
  async generateCertificateChain(
    tenantId: number,
    websocketConfig: WebsocketServerConfig,
    certRequest: GenerateCertificateChainRequest,
  ): Promise<{
    certificates: CertificateDto[];
    filePaths: {
      tlsKeyFilePath: string;
      tlsCertificateChainFilePath: string;
      mtlsCertificateAuthorityKeyFilePath?: string;
      rootCACertificateFilePath?: string;
    };
  }> {
    const scope = certRequest.generationScope ?? CertificateGenerationScope.Leaf;
    switch (scope) {
      case CertificateGenerationScope.Leaf:
        return this._generateLeafOnly(tenantId, websocketConfig, certRequest);
      case CertificateGenerationScope.SubCAAndLeaf:
        return this._generateSubCAAndLeaf(tenantId, websocketConfig, certRequest);
      case CertificateGenerationScope.FullChain:
        return this._generateFullChain(tenantId, websocketConfig, certRequest);
      default:
        throw new BadRequestError(`Unknown generationScope: ${scope}`);
    }
  }

  /**
   * Generates a brand-new full certificate chain (root + subCA + leaf) that is not tied to
   * any websocket server.
   */
  async generateStandaloneFullChain(
    tenantId: number,
    certRequest: GenerateCertificateChainRequest,
  ): Promise<{
    certificates: CertificateDto[];
    filePaths: {
      tlsKeyFilePath: string;
      tlsCertificateChainFilePath: string;
      mtlsCertificateAuthorityKeyFilePath: string;
      rootCACertificateFilePath?: string;
    };
  }> {
    return this._generateFullChain(tenantId, undefined, certRequest);
  }

  private async _generateLeafOnly(
    tenantId: number,
    websocketConfig: WebsocketServerConfig,
    certRequest: GenerateCertificateChainRequest,
  ): Promise<{
    certificates: CertificateDto[];
    filePaths: { tlsKeyFilePath: string; tlsCertificateChainFilePath: string };
  }> {
    const subCACertPem = await this._readCurrentSubCACertPem(websocketConfig);
    const subCARecord = await this._findCertificateByPem(
      tenantId,
      subCACertPem,
      websocketConfig.id,
    );
    if (!subCARecord.privateKeyFileId) {
      throw new BadRequestError(
        `Cannot regenerate leaf certificate for server ${websocketConfig.id}: subCA certificate record is missing its private key.`,
      );
    }
    const subCAKeyPem = await this._readPemFile(
      subCARecord.privateKeyFileId,
      'subCA private key',
      websocketConfig.id,
    );

    const leafEntity = this._buildLeafEntity(certRequest, subCARecord.id!, moment().valueOf());
    const [leafCertPem, leafKeyPem] = generateCertificate(
      leafEntity,
      this.logger,
      subCAKeyPem,
      subCACertPem,
    );
    const storedLeaf = await this.storeCertificateAndKey(
      tenantId,
      leafEntity,
      leafCertPem,
      leafKeyPem,
      PemType.Leaf,
      certRequest.filePath,
    );
    const tlsCertificateChainFilePath = await this._saveChainFile(
      leafCertPem + subCACertPem,
      storedLeaf.serialNumber,
      certRequest.filePath,
    );

    return {
      certificates: [storedLeaf],
      filePaths: {
        tlsKeyFilePath: storedLeaf.privateKeyFileId!,
        tlsCertificateChainFilePath,
      },
    };
  }

  private async _generateSubCAAndLeaf(
    tenantId: number,
    websocketConfig: WebsocketServerConfig,
    certRequest: GenerateCertificateChainRequest,
  ): Promise<{
    certificates: CertificateDto[];
    filePaths: {
      tlsKeyFilePath: string;
      tlsCertificateChainFilePath: string;
      mtlsCertificateAuthorityKeyFilePath: string;
    };
  }> {
    const currentSubCACertPem = await this._readCurrentSubCACertPem(websocketConfig);
    const currentSubCARecord = await this._findCertificateByPem(
      tenantId,
      currentSubCACertPem,
      websocketConfig.id,
    );
    if (currentSubCARecord.signedBy == null) {
      throw new BadRequestError(
        `Cannot regenerate subCA and leaf certificates for server ${websocketConfig.id}: the current subCA has no locally-generated root to reuse.`,
      );
    }
    const rootRecord = await this._findCertificateById(tenantId, currentSubCARecord.signedBy);
    if (!rootRecord.certificateFileId || !rootRecord.privateKeyFileId) {
      throw new BadRequestError(
        `Cannot regenerate subCA for server ${websocketConfig.id}: root certificate record is missing its certificate or private key.`,
      );
    }
    const rootCertPem = await this._readPemFile(
      rootRecord.certificateFileId,
      'root certificate',
      websocketConfig.id,
    );
    const rootKeyPem = await this._readPemFile(
      rootRecord.privateKeyFileId,
      'root private key',
      websocketConfig.id,
    );

    const subCASerialNumber = moment().valueOf();
    const subCAEntity = this._buildSubCAEntity(certRequest, rootRecord.id!, subCASerialNumber);
    const [subCACertPem, subCAKeyPem] = generateCertificate(
      subCAEntity,
      this.logger,
      rootKeyPem,
      rootCertPem,
    );
    const storedSubCA = await this.storeCertificateAndKey(
      tenantId,
      subCAEntity,
      subCACertPem,
      subCAKeyPem,
      PemType.SubCA,
      certRequest.filePath,
    );

    const leafEntity = this._buildLeafEntity(certRequest, storedSubCA.id!, subCASerialNumber + 1);
    const [leafCertPem, leafKeyPem] = generateCertificate(
      leafEntity,
      this.logger,
      subCAKeyPem,
      subCACertPem,
    );
    const storedLeaf = await this.storeCertificateAndKey(
      tenantId,
      leafEntity,
      leafCertPem,
      leafKeyPem,
      PemType.Leaf,
      certRequest.filePath,
    );
    const tlsCertificateChainFilePath = await this._saveChainFile(
      leafCertPem + subCACertPem,
      storedLeaf.serialNumber,
      certRequest.filePath,
    );

    return {
      certificates: [storedLeaf, storedSubCA],
      filePaths: {
        tlsKeyFilePath: storedLeaf.privateKeyFileId!,
        tlsCertificateChainFilePath,
        mtlsCertificateAuthorityKeyFilePath: storedSubCA.privateKeyFileId!,
      },
    };
  }

  private async _generateFullChain(
    tenantId: number,
    websocketConfig: WebsocketServerConfig | undefined,
    certRequest: GenerateCertificateChainRequest,
  ): Promise<{
    certificates: CertificateDto[];
    filePaths: {
      tlsKeyFilePath: string;
      tlsCertificateChainFilePath: string;
      mtlsCertificateAuthorityKeyFilePath: string;
      rootCACertificateFilePath?: string;
    };
  }> {
    // External-CA-signed subCAs aren't functional in most deployments today (they depend
    // on a charging-station CA client being configured), so default to self-signed rather
    // than requiring every caller to specify it.
    const selfSigned = certRequest.selfSigned ?? true;

    let subCACertPem: string;
    let subCAKeyPem: string;
    let storedSubCA: CertificateDto;
    let storedRoot: CertificateDto | undefined;

    if (selfSigned) {
      // OCPP 2.0.1 M05.FR.11: sign the new root with the previous root, so charging stations
      // with SecurityCtrlr.AdditionalRootCertificateCheck enabled accept it as a valid replacement.
      // signWithPreviousRoot/overridePreviousRoot only applies to a server-scoped chain; a standalone chain
      // isn't tied to any server's previous root, so both params are ignored
      const signWithPreviousRoot = !!websocketConfig && (certRequest.signWithPreviousRoot ?? true);
      const previousRoot = signWithPreviousRoot
        ? await this._resolvePreviousRoot(
            tenantId,
            certRequest,
            websocketConfig!.id,
            websocketConfig,
          )
        : undefined;

      const rootSerialNumber = moment().valueOf();
      const rootEntity = this._buildRootEntity(certRequest, rootSerialNumber);
      if (previousRoot) {
        rootEntity.signedBy = previousRoot.certificateId;
      }
      const [rootCertPem, rootKeyPem] = previousRoot
        ? generateCertificate(rootEntity, this.logger, previousRoot.keyPem, previousRoot.certPem)
        : generateCertificate(rootEntity, this.logger);
      storedRoot = await this.storeCertificateAndKey(
        tenantId,
        rootEntity,
        rootCertPem,
        rootKeyPem,
        PemType.Root,
        certRequest.filePath,
      );

      const subCAEntity = this._buildSubCAEntity(certRequest, storedRoot.id!, rootSerialNumber + 1);
      const [subCertPem, subKeyPem] = generateCertificate(
        subCAEntity,
        this.logger,
        rootKeyPem,
        rootCertPem,
      );
      storedSubCA = await this.storeCertificateAndKey(
        tenantId,
        subCAEntity,
        subCertPem,
        subKeyPem,
        PemType.SubCA,
        certRequest.filePath,
      );
      subCACertPem = subCertPem;
      subCAKeyPem = subKeyPem;
    } else {
      const defaults = this._buildCertificateDefaults(certRequest);
      const subCAEntity: CertificateWorkingInput = {
        serialNumber: moment().valueOf(),
        keyLength: defaults.keyLength,
        organizationName: certRequest.organizationName,
        // Must be a valid domain name, unlike the self-signed branch's suffixed commonName.
        commonName: certRequest.commonName,
        validBefore: defaults.validBefore,
        countryName: defaults.countryName,
        signatureAlgorithm: defaults.signatureAlgorithm,
        isCA: true,
        pathLen: 0,
      };
      const [certPem, keyPem] = await this.generateSubCACertificateSignedByCAServer(subCAEntity);
      storedSubCA = await this.storeCertificateAndKey(
        tenantId,
        subCAEntity,
        certPem,
        keyPem,
        PemType.SubCA,
        certRequest.filePath,
      );
      subCACertPem = certPem;
      subCAKeyPem = keyPem;
    }

    const leafEntity = this._buildLeafEntity(
      certRequest,
      storedSubCA.id!,
      storedSubCA.serialNumber + 1,
    );
    const [leafCertPem, leafKeyPem] = generateCertificate(
      leafEntity,
      this.logger,
      subCAKeyPem,
      subCACertPem,
    );
    const storedLeaf = await this.storeCertificateAndKey(
      tenantId,
      leafEntity,
      leafCertPem,
      leafKeyPem,
      PemType.Leaf,
      certRequest.filePath,
    );
    const tlsCertificateChainFilePath = await this._saveChainFile(
      leafCertPem + subCACertPem,
      storedLeaf.serialNumber,
      certRequest.filePath,
    );

    return {
      certificates: storedRoot ? [storedLeaf, storedSubCA, storedRoot] : [storedLeaf, storedSubCA],
      filePaths: {
        tlsKeyFilePath: storedLeaf.privateKeyFileId!,
        tlsCertificateChainFilePath,
        mtlsCertificateAuthorityKeyFilePath: storedSubCA.privateKeyFileId!,
        ...(storedRoot ? { rootCACertificateFilePath: storedRoot.certificateFileId! } : {}),
      },
    };
  }

  private _buildCertificateDefaults(certRequest: GenerateCertificateChainRequest): {
    keyLength: number;
    validBefore: string;
    countryName: CountryNameEnumType;
    signatureAlgorithm: SignatureAlgorithmEnumType;
  } {
    let validBefore: string;
    if (certRequest.validBefore) {
      validBefore = certRequest.validBefore;
    } else {
      const defaultValidityDate = new Date();
      defaultValidityDate.setFullYear(defaultValidityDate.getFullYear() + 1);
      validBefore = defaultValidityDate.toISOString();
    }
    return {
      keyLength: certRequest.keyLength ? certRequest.keyLength : 2048,
      validBefore,
      countryName: certRequest.countryName ? certRequest.countryName : CountryNameEnumType.US,
      signatureAlgorithm: certRequest.signatureAlgorithm
        ? certRequest.signatureAlgorithm
        : SignatureAlgorithmEnumType.ECDSA,
    };
  }

  private _buildRootEntity(
    certRequest: GenerateCertificateChainRequest,
    serialNumber: number,
  ): CertificateWorkingInput {
    const defaults = this._buildCertificateDefaults(certRequest);
    return {
      serialNumber,
      keyLength: defaults.keyLength,
      organizationName: certRequest.organizationName,
      commonName: `${certRequest.commonName} ${PemType.Root}`,
      validBefore: defaults.validBefore,
      countryName: defaults.countryName,
      signatureAlgorithm: defaults.signatureAlgorithm,
      isCA: true,
      pathLen: certRequest.pathLen ? certRequest.pathLen : 1,
    };
  }

  private _buildSubCAEntity(
    certRequest: GenerateCertificateChainRequest,
    signedByCertificateId: number,
    serialNumber: number,
  ): CertificateWorkingInput {
    const defaults = this._buildCertificateDefaults(certRequest);
    return {
      serialNumber,
      keyLength: defaults.keyLength,
      organizationName: certRequest.organizationName,
      commonName: `${certRequest.commonName} ${PemType.SubCA}`,
      validBefore: defaults.validBefore,
      countryName: defaults.countryName,
      signatureAlgorithm: defaults.signatureAlgorithm,
      isCA: true,
      pathLen: 0,
      signedBy: signedByCertificateId,
    };
  }

  private _buildLeafEntity(
    certRequest: GenerateCertificateChainRequest,
    signedByCertificateId: number,
    serialNumber: number,
  ): CertificateWorkingInput {
    const defaults = this._buildCertificateDefaults(certRequest);
    return {
      serialNumber,
      keyLength: defaults.keyLength,
      organizationName: certRequest.organizationName,
      commonName: certRequest.commonName,
      validBefore: defaults.validBefore,
      countryName: defaults.countryName,
      signatureAlgorithm: defaults.signatureAlgorithm,
      isCA: false,
      signedBy: signedByCertificateId,
    };
  }

  private async _findCertificateByPem(
    tenantId: number,
    certPem: string,
    serverId: string,
  ): Promise<CertificateDto> {
    const hash = this.getCertificateHash(certPem);
    const record = await this.certificateRepository.findByFileHash(tenantId, hash);
    if (!record) {
      throw new BadRequestError(
        `Could not find a certificate record matching the currently configured certificate for server ${serverId}: run a FullChain generation first to establish a trackable certificate lineage.`,
      );
    }
    return record;
  }

  private async _findCertificateById(tenantId: number, id: number): Promise<CertificateDto> {
    const record = await this.certificateRepository.findById(tenantId, id);
    if (!record) {
      throw new BadRequestError(`Could not find a certificate record with id ${id}.`);
    }
    return record;
  }

  /**
   * Resolves the "previous root". A newly-generated root should be signed by:
   * `certRequest.overridePreviousRoot` if given, else `websocketConfig`'s currently
   * configured root. Returns `undefined` if neither is available.
   */
  private async _resolvePreviousRoot(
    tenantId: number,
    certRequest: GenerateCertificateChainRequest,
    contextId: string,
    websocketConfig?: WebsocketServerConfig,
  ): Promise<{ certPem: string; keyPem: string; certificateId: number } | undefined> {
    // `overridePreviousRoot` is caller-supplied over the API, so it stays path-validated;
    // `rootCACertificateFilePath` is config-driven and may be an
    // absolute path, so it's read as trusted.
    const previousRootFilePath = certRequest.overridePreviousRoot;
    const trustedRootFilePath = websocketConfig?.rootCACertificateFilePath;
    const resolvedFilePath = previousRootFilePath ?? trustedRootFilePath;
    if (!resolvedFilePath) {
      return undefined;
    }

    const certPem = previousRootFilePath
      ? await this._readPemFile(previousRootFilePath, 'previous root certificate', contextId)
      : await this._readPemFile(trustedRootFilePath!, 'previous root certificate', contextId, {
          trusted: true,
        });
    const record = await this.certificateRepository.findByFileHash(
      tenantId,
      this.getCertificateHash(certPem),
    );
    if (!record) {
      throw new BadRequestError(
        `Cannot sign the new root certificate for ${contextId} with the previous root at ${resolvedFilePath}: cannot find record from db.`,
      );
    }
    if (!record.privateKeyFileId) {
      throw new BadRequestError(
        `Cannot sign the new root certificate for ${contextId} with the previous root at ${resolvedFilePath}: private key cannot be located from db.`,
      );
    }
    const keyPem = await this._readPemFile(
      record.privateKeyFileId,
      'previous root private key',
      contextId,
    );
    return { certPem, keyPem, certificateId: record.id! };
  }

  private async _readCurrentSubCACertPem(config: WebsocketServerConfig): Promise<string> {
    if (!config.tlsCertificateChainFilePath) {
      throw new BadRequestError(
        `Cannot regenerate certificates for server ${config.id}: an existing certificate chain is required but is not configured.`,
      );
    }
    const currentChainPem = await this._readPemFile(
      config.tlsCertificateChainFilePath,
      'certificate chain',
      config.id,
      { trusted: true },
    );
    const [, subCACertPem] = parseCertificateChainPem(currentChainPem);
    if (!subCACertPem) {
      throw new BadRequestError(
        `Cannot regenerate certificates for server ${config.id}: existing certificate chain does not contain a subCA certificate.`,
      );
    }
    return subCACertPem;
  }

  private async _readPemFile(
    filePath: string,
    description: string,
    serverId: string,
    options?: { trusted?: boolean },
  ): Promise<string> {
    const buffer = await this.fileStorage.getFile(filePath, undefined, options);
    if (!buffer) {
      throw new BadRequestError(
        `Could not read ${description} for server ${serverId} at ${filePath}`,
      );
    }
    return buffer.toString();
  }

  private async _saveChainFile(
    chainPem: string,
    serialNumber: number,
    filePath?: string,
  ): Promise<string> {
    const keyPrefix = filePath ? `${filePath}/` : '';
    const chainFilePath = `${keyPrefix}Cert_Chain_${serialNumber}.pem`;
    await this.fileStorage.saveFile(chainFilePath, Buffer.from(chainPem));
    return chainFilePath;
  }

  /**
   * Generate a hash (fingerprint) from a certificate PEM string.
   * @param pemString The certificate PEM string.
   * @returns A SHA-256 hash of the certificate's DER encoding.
   */
  getCertificateHash(pemString: string): string {
    try {
      const cert = new jsrsasign.X509();
      cert.readCertPEM(pemString);

      // Get the raw DER encoding of the certificate
      const derHex = cert.hex;

      // Compute SHA-256 hash
      return jsrsasign.KJUR.crypto.Util.sha256(derHex);
    } catch (error) {
      console.error('Error generating certificate hash:', error);
      throw new Error('Invalid PEM format or unsupported certificate');
    }
  }
}
