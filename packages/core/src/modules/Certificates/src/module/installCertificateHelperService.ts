// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  BadRequestError,
  type CertificateDto,
  type CertificateUseEnumType,
  type IFileStorage,
  type InstallCertificateStatusEnumType,
  OCPP2_0_1,
  type WebsocketServerConfig,
} from '@citrineos/base';
import {
  CertificateGenerationScope,
  type GenerateCertificateChainRequest,
  UploadExistingCertificate,
} from '@dal/interfaces/index.js';
import type {
  ICertificateRepository,
  IDeleteCertificateAttemptRepository,
  IInstallCertificateAttemptRepository,
  IInstalledCertificateRepository,
} from '@dal/interfaces/repositories.js';
import {
  Certificate,
  CountryNameEnumType,
  InstallCertificateAttempt,
  InstalledCertificate,
  SignatureAlgorithmEnumType,
} from '@dal/layers/sequelize/index.js';
import {
  type CertificateAuthorityService,
  extractCertificateDetails,
  generateCertificate,
  generateCSR,
  parseCertificateChainPem,
  WebsocketNetworkConnection,
} from '@util/index.js';
import jsrsasign from 'jsrsasign';
import moment from 'moment';
import { type ILogObj, Logger } from 'tslog';

export const enum PemType {
  Root = 'Root',
  SubCA = 'SubCA',
  Leaf = 'Leaf',
}

export class InstallCertificateHelperService {
  protected certificateRepository: ICertificateRepository;
  protected installedCertificateRepository: IInstalledCertificateRepository;
  protected installCertificateAttemptRepository: IInstallCertificateAttemptRepository;
  protected deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  protected certificateAuthorityService: CertificateAuthorityService;
  protected networkConnection: WebsocketNetworkConnection;
  protected fileStorage: IFileStorage;
  protected logger: Logger<ILogObj>;

  constructor({
    certificateRepository,
    installedCertificateRepository,
    installCertificateAttemptRepository,
    deleteCertificateAttemptRepository,
    certificateAuthorityService,
    networkConnection,
    fileStorage,
    logger,
  }: {
    certificateRepository: ICertificateRepository;
    installedCertificateRepository: IInstalledCertificateRepository;
    installCertificateAttemptRepository: IInstallCertificateAttemptRepository;
    deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
    certificateAuthorityService: CertificateAuthorityService;
    networkConnection: WebsocketNetworkConnection;
    fileStorage: IFileStorage;
    logger: Logger<ILogObj>;
  }) {
    this.certificateRepository = certificateRepository;
    this.installedCertificateRepository = installedCertificateRepository;
    this.installCertificateAttemptRepository = installCertificateAttemptRepository;
    this.deleteCertificateAttemptRepository = deleteCertificateAttemptRepository;
    this.certificateAuthorityService = certificateAuthorityService;
    this.networkConnection = networkConnection;
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
    const hash = this.getCertificateHash(certificate);
    const existingPendingInstallCertificateAttempt =
      await this.installCertificateAttemptRepository.readOnlyOneByQuery(tenantId, {
        where: {
          ocppConnectionName: ocppConnectionName,
          certificateType: certificateType,
          status: null,
          ...(requestId != null ? { requestId } : {}),
        },
        include: [
          {
            model: Certificate,
            where: {
              certificateFileHash: hash,
            },
          },
        ],
      });
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
      let existingCertificate = await this.certificateRepository.readOnlyOneByQuery(tenantId, {
        where: {
          certificateFileHash: hash,
        },
      });
      if (!existingCertificate) {
        existingCertificate = await this.createNewCertificate(
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
      const installCertificateAttempt = new InstallCertificateAttempt();
      installCertificateAttempt.ocppConnectionName = ocppConnectionName;
      installCertificateAttempt.certificateType = certificateType;
      installCertificateAttempt.certificateId = existingCertificate!.id;
      if (requestId != null) {
        installCertificateAttempt.requestId = requestId;
      }
      await installCertificateAttempt.save();
    }
  }

  async finalizeInstalledCertificate(
    tenantId: number,
    ocppConnectionName: string,
    status: InstallCertificateStatusEnumType,
    requestId?: number,
  ) {
    const existingPendingInstallCertificateAttempt =
      await this.installCertificateAttemptRepository.readOnlyOneByQuery(tenantId, {
        where: {
          ocppConnectionName: ocppConnectionName,
          status: null,
          ...(requestId != null ? { requestId } : {}),
        },
      });
    // should always be true
    if (existingPendingInstallCertificateAttempt) {
      existingPendingInstallCertificateAttempt.status = status;
      await existingPendingInstallCertificateAttempt.save();
      if (
        existingPendingInstallCertificateAttempt.status ===
        OCPP2_0_1.InstallCertificateStatusEnumType.Accepted
      ) {
        const existingInstalledCertificate =
          await this.installedCertificateRepository.readOnlyOneByQuery(tenantId, {
            where: {
              ocppConnectionName: ocppConnectionName,
              certificateType: existingPendingInstallCertificateAttempt.certificateType,
            },
          });
        if (existingInstalledCertificate) {
          existingInstalledCertificate.certificateId =
            existingPendingInstallCertificateAttempt.certificateId;
          await existingInstalledCertificate.save();
        } else {
          const certificate = await existingPendingInstallCertificateAttempt.$get('certificate');
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
            const installedCertificate = new InstalledCertificate();
            installedCertificate.ocppConnectionName = ocppConnectionName;
            installedCertificate.certificateId =
              existingPendingInstallCertificateAttempt.certificateId;
            installedCertificate.certificateType =
              existingPendingInstallCertificateAttempt.certificateType;
            await installedCertificate.save();
          }
        }
      }
    }
  }

  async createNewCertificate(
    certificate: string,
    serialNumber: number | null,
    issuerName: string | null,
    organizationName: string | null,
    commonName: string | null,
    countryName: CountryNameEnumType | null,
    validBefore: Date | null,
    signatureAlgorithm: SignatureAlgorithmEnumType | null,
  ) {
    const certificateHash = this.getCertificateHash(certificate);
    const newCertificate = new Certificate();
    newCertificate.serialNumber = serialNumber!;
    newCertificate.issuerName = issuerName!;
    newCertificate.organizationName = organizationName!;
    newCertificate.commonName = commonName!;
    newCertificate.countryName = countryName!;
    newCertificate.validBefore = validBefore?.toISOString();
    newCertificate.signatureAlgorithm = signatureAlgorithm!;
    newCertificate.certificateFileId = await this.fileStorage.saveFile(
      `Existing_Cert_${serialNumber}.pem`,
      Buffer.from(certificate),
    );
    newCertificate.certificateFileHash = certificateHash;
    return await newCertificate.save();
  }

  async handleUploadExistingCertificate(
    tenantId: number,
    identifier: string,
    uploadExistingCertificate: UploadExistingCertificate,
    filePath?: string,
  ): Promise<InstalledCertificate> {
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

    let existingInstalledCertificate = await this.installedCertificateRepository.readOnlyOneByQuery(
      tenantId,
      {
        where: {
          ocppConnectionName: identifier,
          certificateType: uploadExistingCertificate.certificateType,
        },
      },
    );

    if (existingInstalledCertificate) {
      let existingCertificate: CertificateDto | undefined | null =
        await existingInstalledCertificate.$get('certificate');
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
        await Certificate.create({
          ...existingCertificate,
        });
      } else {
        // check if certificate record exists but not tied to installed certificate
        existingCertificate = await this.certificateRepository.readOnlyOneByQuery(tenantId, {
          where: {
            certificateFileHash: this.getCertificateHash(certificate),
          },
        });
        if (!existingCertificate) {
          // create new certificate record
          existingCertificate = await this.createNewCertificate(
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
        existingInstalledCertificate.certificateId = existingCertificate.id;
        existingInstalledCertificate = await existingInstalledCertificate.save();
      }
    } else {
      // check if certificate record exists
      let existingCertificate = await this.certificateRepository.readOnlyOneByQuery(tenantId, {
        where: {
          certificateFileHash: this.getCertificateHash(certificate),
        },
      });
      // create new certificate record
      if (!existingCertificate) {
        existingCertificate = await this.createNewCertificate(
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
      existingInstalledCertificate = new InstalledCertificate();
      existingInstalledCertificate.ocppConnectionName = identifier;
      existingInstalledCertificate.certificateId = existingCertificate.id;
      existingInstalledCertificate.certificateType = uploadExistingCertificate.certificateType;
      existingInstalledCertificate = await existingInstalledCertificate.save();
    }
    return existingInstalledCertificate;
  }

  /**
   * Generates a sub CA certificate signed by a CA server.
   *
   * @param {Certificate} certificate - The certificate information used for generating the root certificate.
   * @return {Promise<[string, string]>} An array containing the signed certificate and the private key.
   */
  async generateSubCACertificateSignedByCAServer(
    certificate: Certificate,
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
    certificateEntity: Certificate,
    certPem: string,
    keyPem: string,
    filePrefix: PemType,
    filePath?: string,
  ): Promise<Certificate> {
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
    return await this.certificateRepository.createOrUpdateCertificate(tenantId, certificateEntity);
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
    certificates: Certificate[];
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
        return this._generateFullChain(tenantId, certRequest);
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
    certificates: Certificate[];
    filePaths: {
      tlsKeyFilePath: string;
      tlsCertificateChainFilePath: string;
      mtlsCertificateAuthorityKeyFilePath: string;
      rootCACertificateFilePath?: string;
    };
  }> {
    return this._generateFullChain(tenantId, certRequest);
  }

  private async _generateLeafOnly(
    tenantId: number,
    websocketConfig: WebsocketServerConfig,
    certRequest: GenerateCertificateChainRequest,
  ): Promise<{
    certificates: Certificate[];
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

    const leafEntity = this._buildLeafEntity(certRequest, subCARecord.id, moment().valueOf());
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
    certificates: Certificate[];
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
    const subCAEntity = this._buildSubCAEntity(certRequest, rootRecord.id, subCASerialNumber);
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

    const leafEntity = this._buildLeafEntity(certRequest, storedSubCA.id, subCASerialNumber + 1);
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
    certRequest: GenerateCertificateChainRequest,
  ): Promise<{
    certificates: Certificate[];
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
    let storedSubCA: Certificate;
    let storedRoot: Certificate | undefined;

    if (selfSigned) {
      const rootSerialNumber = moment().valueOf();
      const rootEntity = this._buildRootEntity(certRequest, rootSerialNumber);
      const [rootCertPem, rootKeyPem] = generateCertificate(rootEntity, this.logger);
      storedRoot = await this.storeCertificateAndKey(
        tenantId,
        rootEntity,
        rootCertPem,
        rootKeyPem,
        PemType.Root,
        certRequest.filePath,
      );

      const subCAEntity = this._buildSubCAEntity(certRequest, storedRoot.id, rootSerialNumber + 1);
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
      const subCAEntity = new Certificate();
      subCAEntity.serialNumber = moment().valueOf();
      subCAEntity.keyLength = defaults.keyLength;
      subCAEntity.organizationName = certRequest.organizationName;
      // Must be a valid domain name, unlike the self-signed branch's suffixed commonName.
      subCAEntity.commonName = certRequest.commonName;
      subCAEntity.validBefore = defaults.validBefore;
      subCAEntity.countryName = defaults.countryName;
      subCAEntity.signatureAlgorithm = defaults.signatureAlgorithm;
      subCAEntity.isCA = true;
      subCAEntity.pathLen = 0;
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
      storedSubCA.id,
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
  ): Certificate {
    const defaults = this._buildCertificateDefaults(certRequest);
    const root = new Certificate();
    root.serialNumber = serialNumber;
    root.keyLength = defaults.keyLength;
    root.organizationName = certRequest.organizationName;
    root.commonName = `${certRequest.commonName} ${PemType.Root}`;
    root.validBefore = defaults.validBefore;
    root.countryName = defaults.countryName;
    root.signatureAlgorithm = defaults.signatureAlgorithm;
    root.isCA = true;
    root.pathLen = certRequest.pathLen ? certRequest.pathLen : 1;
    return root;
  }

  private _buildSubCAEntity(
    certRequest: GenerateCertificateChainRequest,
    signedByCertificateId: number,
    serialNumber: number,
  ): Certificate {
    const defaults = this._buildCertificateDefaults(certRequest);
    const subCA = new Certificate();
    subCA.serialNumber = serialNumber;
    subCA.keyLength = defaults.keyLength;
    subCA.organizationName = certRequest.organizationName;
    subCA.commonName = `${certRequest.commonName} ${PemType.SubCA}`;
    subCA.validBefore = defaults.validBefore;
    subCA.countryName = defaults.countryName;
    subCA.signatureAlgorithm = defaults.signatureAlgorithm;
    subCA.isCA = true;
    subCA.pathLen = 0;
    subCA.signedBy = signedByCertificateId;
    return subCA;
  }

  private _buildLeafEntity(
    certRequest: GenerateCertificateChainRequest,
    signedByCertificateId: number,
    serialNumber: number,
  ): Certificate {
    const defaults = this._buildCertificateDefaults(certRequest);
    const leaf = new Certificate();
    leaf.serialNumber = serialNumber;
    leaf.keyLength = defaults.keyLength;
    leaf.organizationName = certRequest.organizationName;
    leaf.commonName = certRequest.commonName;
    leaf.validBefore = defaults.validBefore;
    leaf.countryName = defaults.countryName;
    leaf.signatureAlgorithm = defaults.signatureAlgorithm;
    leaf.isCA = false;
    leaf.signedBy = signedByCertificateId;
    return leaf;
  }

  private async _findCertificateByPem(
    tenantId: number,
    certPem: string,
    serverId: string,
  ): Promise<Certificate> {
    const hash = this.getCertificateHash(certPem);
    const record = await this.certificateRepository.readOnlyOneByQuery(tenantId, {
      where: { certificateFileHash: hash },
    });
    if (!record) {
      throw new BadRequestError(
        `Could not find a certificate record matching the currently configured certificate for server ${serverId}: run a FullChain generation first to establish a trackable certificate lineage.`,
      );
    }
    return record;
  }

  private async _findCertificateById(tenantId: number, id: number): Promise<Certificate> {
    const record = await this.certificateRepository.readOnlyOneByQuery(tenantId, {
      where: { id },
    });
    if (!record) {
      throw new BadRequestError(`Could not find a certificate record with id ${id}.`);
    }
    return record;
  }

  /**
   * Reads and extracts the subCA certificate from a server's currently-configured
   * certificate chain file (chain = leaf + subCA concatenation). This is the only
   * config field relied on to identify a server's current lineage — the optional
   * `rootCACertificateFilePath`/`mtlsCertificateAuthorityKeyFilePath` fields are not
   * used, since they may not be set (e.g. typically absent for securityProfile 2).
   */
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
  ): Promise<string> {
    const buffer = await this.fileStorage.getFile(filePath);
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
