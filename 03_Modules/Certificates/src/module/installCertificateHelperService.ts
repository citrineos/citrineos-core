import {
  Certificate,
  CountryNameEnumType,
  type ICertificateRepository,
  type IDeleteCertificateAttemptRepository,
  type IInstallCertificateAttemptRepository,
  type IInstalledCertificateRepository,
  InstallCertificateAttempt,
  InstalledCertificate,
  SignatureAlgorithmEnumType,
  UploadExistingCertificate,
} from '@citrineos/data';
import {
  type CertificateAuthorityService,
  extractCertificateDetails,
  generateCSR,
  WebsocketNetworkConnection,
} from '@citrineos/util';
import { type IFileStorage, OCPP2_0_1, type WebsocketServerConfig } from '@citrineos/base';
import { type ILogObj, Logger } from 'tslog';
import fs from 'fs';
import jsrsasign from 'jsrsasign';

export const enum PemType {
  Root = 'Root',
  SubCA = 'SubCA',
  Leaf = 'Leaf',
}

interface RollBackFile {
  oldFilePath: string;
  newFilePath: string;
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
    stationId: string,
    certificate: string,
    certificateType: OCPP2_0_1.InstallCertificateUseEnumType,
  ) {
    const hash = this.getCertificateHash(certificate);
    const existingPendingInstallCertificateAttempt =
      await this.installCertificateAttemptRepository.readOnlyOneByQuery(tenantId, {
        where: {
          stationId: stationId,
          certificateType: certificateType,
          status: null,
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
      installCertificateAttempt.stationId = stationId;
      installCertificateAttempt.certificateType = certificateType;
      installCertificateAttempt.certificateId = existingCertificate!.id;
      await installCertificateAttempt.save();
    }
  }

  async finalizeInstalledCertificate(
    tenantId: number,
    stationId: string,
    status: OCPP2_0_1.InstallCertificateStatusEnumType,
  ) {
    const existingPendingInstallCertificateAttempt =
      await this.installCertificateAttemptRepository.readOnlyOneByQuery(tenantId, {
        where: {
          stationId,
          status: null,
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
              stationId,
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
            const serialNumber = parseInt(cert.getSerialNumberHex());
            const installedCertificate = new InstalledCertificate();
            installedCertificate.stationId = stationId;
            installedCertificate.serialNumber = serialNumber.toString();
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
          stationId: identifier,
          certificateType: uploadExistingCertificate.certificateType,
        },
      },
    );

    if (existingInstalledCertificate) {
      let existingCertificate: Certificate | undefined | null =
        await existingInstalledCertificate.$get('certificate');
      if (existingCertificate && existingCertificate.certificateFileId) {
        throw new Error('Cannot upload exiting certificate because it already exists');
      } else if (existingCertificate && !existingCertificate.certificateFileId) {
        // set file where previously undefined
        existingCertificate.certificateFileId = await this.fileStorage.saveFile(
          `Existing_Key_${serialNumber}.pem`,
          Buffer.from(certificate),
          filePath,
        );
        await existingCertificate.save();
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
      // create new certificate record
      const newCertificate: Certificate = await this.createNewCertificate(
        certificate,
        serialNumber,
        issuerName,
        organizationName,
        commonName,
        countryName,
        validBefore,
        signatureAlgorithm,
      );
      existingInstalledCertificate = new InstalledCertificate();
      existingInstalledCertificate.stationId = identifier;
      existingInstalledCertificate.certificateId = newCertificate.id;
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
    certificateEntity.privateKeyFileId = await this.fileStorage.saveFile(
      `${filePrefix}_Key_${certificateEntity.serialNumber}.pem`,
      Buffer.from(keyPem),
      filePath,
    );
    certificateEntity.certificateFileId = await this.fileStorage.saveFile(
      `${filePrefix}_Certificate_${certificateEntity.serialNumber}.pem`,
      Buffer.from(certPem),
      filePath,
    );
    certificateEntity.certificateFileHash = certificateHash;
    // Store certificate in db
    const certObj = new jsrsasign.X509();
    certObj.readCertPEM(certPem);
    certificateEntity.issuerName = certObj.getIssuerString();
    certificateEntity.tenantId = tenantId;
    return await this.certificateRepository.createOrUpdateCertificate(tenantId, certificateEntity);
  }

  updateCertificates(
    serverConfig: WebsocketServerConfig,
    serverId: string,
    tlsKey: string,
    tlsCertificateChain: string,
    subCAKey?: string,
    rootCA?: string,
  ) {
    let rollbackFiles: RollBackFile[] = [];

    if (serverConfig.tlsKeyFilePath && serverConfig.tlsCertificateChainFilePath) {
      try {
        rollbackFiles = this.replaceFile(serverConfig.tlsKeyFilePath, tlsKey, rollbackFiles);
        rollbackFiles = this.replaceFile(
          serverConfig.tlsCertificateChainFilePath,
          tlsCertificateChain,
          rollbackFiles,
        );
        if (serverConfig.mtlsCertificateAuthorityKeyFilePath && subCAKey) {
          rollbackFiles = this.replaceFile(
            serverConfig.mtlsCertificateAuthorityKeyFilePath,
            subCAKey,
            rollbackFiles,
          );
        }
        if (serverConfig.rootCACertificateFilePath && rootCA) {
          rollbackFiles = this.replaceFile(
            serverConfig.rootCACertificateFilePath,
            rootCA,
            rollbackFiles,
          );
        }

        // Update the security context of the server without restarting it
        this.networkConnection.updateTlsCertificates(serverId, tlsKey, tlsCertificateChain, rootCA);

        // Update the map which stores sub CA certs and keys for websocket server securityProfile 3.
        // This map is used when signing charging station certificates for use case A02 in OCPP 2.0.1 Part 2.
        if (serverConfig.securityProfile === 3 && subCAKey) {
          this.certificateAuthorityService.updateSecurityCertChainKeyMap(
            serverId,
            tlsCertificateChain,
            subCAKey,
          );
        }

        this.logger.info(`Updated TLS certificate for server ${serverId} successfully.`);
      } catch (error) {
        this.logger.error(`Failed to update certificate for server ${serverId}: `, error);

        this.logger.info('Performing rollback...');
        for (const { oldFilePath, newFilePath } of rollbackFiles) {
          fs.renameSync(newFilePath, oldFilePath);
          this.logger.info(`Rolled back ${newFilePath} to ${oldFilePath}`);
        }

        throw error;
      }
    }
  }

  private replaceFile(
    targetFilePath: string,
    newContent: string,
    rollbackFiles: RollBackFile[],
  ): RollBackFile[] {
    // Back up old file
    fs.renameSync(targetFilePath, targetFilePath.concat('.backup'));
    rollbackFiles.push({
      oldFilePath: targetFilePath,
      newFilePath: targetFilePath.concat('.backup'),
    });
    // Write new content using target path
    fs.writeFileSync(targetFilePath, newContent);
    this.logger.debug(`Backed up and overwrote file ${targetFilePath}`);
    return rollbackFiles;
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
      const hash = jsrsasign.KJUR.crypto.Util.sha256(derHex);

      return hash;
    } catch (error) {
      console.error('Error generating certificate hash:', error);
      throw new Error('Invalid PEM format or unsupported certificate');
    }
  }
}
