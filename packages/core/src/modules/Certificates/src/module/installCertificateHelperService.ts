// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type CertificateDto,
  type CertificateUseEnumType,
  type IFileStorage,
  type InstallCertificateStatusEnumType,
  OCPP2_0_1,
  type WebsocketServerConfig,
} from '@citrineos/base';
import { UploadExistingCertificate } from '@dal/interfaces/index.js';
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
  generateCSR,
  WebsocketNetworkConnection,
} from '@util/index.js';
import jsrsasign from 'jsrsasign';
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

  constructor(
    certificateRepository: ICertificateRepository,
    installedCertificateRepository: IInstalledCertificateRepository,
    installCertificateAttemptRepository: IInstallCertificateAttemptRepository,
    deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository,
    certificateAuthorityService: CertificateAuthorityService,
    networkConnection: WebsocketNetworkConnection,
    fileStorage: IFileStorage,
    logger: Logger<ILogObj>,
  ) {
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
    const keyFileName = `${filePrefix}_Key_${certificateEntity.serialNumber}.pem`;
    const certFileName = `${filePrefix}_Certificate_${certificateEntity.serialNumber}.pem`;
    certificateEntity.privateKeyFileId = await this.fileStorage.saveFile(
      filePath ? `${filePath}/${keyFileName}` : keyFileName,
      Buffer.from(keyPem),
    );
    certificateEntity.certificateFileId = await this.fileStorage.saveFile(
      filePath ? `${filePath}/${certFileName}` : certFileName,
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
   * Saves generated TLS certificate files to the configured file paths of all TLS-enabled websocket servers.
   *
   * @param websocketServersConfig - List of websocket server configurations to save certificates for.
   * @param certificateChainPem - Certificate chain PEM string (leaf + subCA concatenated).
   * @param leafKeyPem - Leaf certificate private key PEM string.
   * @param subCAKeyPem - Sub CA private key PEM string.
   * @param rootCACertPem - Root CA certificate PEM string. Only present for self-signed certificate chains.
   */
  async saveCertificatesToServerConfigs(
    websocketServersConfig: WebsocketServerConfig[],
    certificateChainPem: string,
    leafKeyPem: string,
    subCAKeyPem: string,
    rootCACertPem?: string,
  ): Promise<void> {
    const tlsServers = websocketServersConfig.filter((c) => c.securityProfile >= 2);
    for (const serverConfig of tlsServers) {
      // use path basename and dirname is to get rid of the default path in file storage
      // this makes sure the path is consist with reloading
      if (serverConfig.tlsCertificateChainFilePath) {
        await this.fileStorage.saveFile(
          serverConfig.tlsCertificateChainFilePath,
          Buffer.from(certificateChainPem),
        );
      }
      if (serverConfig.tlsKeyFilePath) {
        await this.fileStorage.saveFile(serverConfig.tlsKeyFilePath, Buffer.from(leafKeyPem));
      }
      if (serverConfig.mtlsCertificateAuthorityKeyFilePath) {
        await this.fileStorage.saveFile(
          serverConfig.mtlsCertificateAuthorityKeyFilePath,
          Buffer.from(subCAKeyPem),
        );
      }
      if (rootCACertPem && serverConfig.rootCACertificateFilePath) {
        await this.fileStorage.saveFile(
          serverConfig.rootCACertificateFilePath,
          Buffer.from(rootCACertPem),
        );
      }
      this.logger.info(`Saved TLS certificate files for server ${serverConfig.id}`);
    }
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
