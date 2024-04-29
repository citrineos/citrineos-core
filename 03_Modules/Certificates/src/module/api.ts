// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModuleApi,
  AsDataEndpoint,
  AsMessageEndpoint,
  CallAction,
  CertificateSignedRequest,
  CertificateSignedRequestSchema,
  DeleteCertificateRequest,
  DeleteCertificateRequestSchema,
  GetInstalledCertificateIdsRequest,
  GetInstalledCertificateIdsRequestSchema,
  HttpMethod,
  IFileAccess,
  IMessageConfirmation,
  InstallCertificateRequest,
  InstallCertificateRequestSchema,
  Namespace,
  WebsocketServerConfig,
} from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { ICertificatesModuleApi } from './interface';
import { CertificatesModule } from './module';
import { WebsocketNetworkConnection } from '@citrineos/util';
import {
  ChargingStation,
  Certificate,
  RootCertificateRequest,
  RootCertificateSchema,
  ContentType,
  TlsCertificatesRequest,
  TlsCertificateSchema,
  UpdateTlsCertificateQuerySchema,
  UpdateTlsCertificateQueryString,
} from '@citrineos/data';
import fs from 'fs';
import * as forge from 'node-forge';
/**
 * Server API for the Certificates module.
 */
export class CertificatesModuleApi
  extends AbstractModuleApi<CertificatesModule>
  implements ICertificatesModuleApi {
  private readonly _networkConnection: WebsocketNetworkConnection;
  private readonly _websocketServersConfig: WebsocketServerConfig[];
  private readonly _fileAccess: IFileAccess;

  /**
   * Constructs a new instance of the class.
   *
   * @param {CertificatesModule} certificatesModule - The Certificates module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   * @param {IFileAccess} fileAccess - The FileAccess
   * @param {WebsocketNetworkConnection} networkConnection - The NetworkConnection
   * @param {WebsocketServerConfig[]} websocketServersConfig - Configuration for websocket servers
   */
  constructor(
    certificatesModule: CertificatesModule,
    server: FastifyInstance,
    fileAccess: IFileAccess,
    networkConnection: WebsocketNetworkConnection,
    websocketServersConfig: WebsocketServerConfig[],
    logger?: Logger<ILogObj>,
  ) {
    super(certificatesModule, server, logger);
    this._fileAccess = fileAccess;
    this._networkConnection = networkConnection;
    this._websocketServersConfig = websocketServersConfig;
  }

  /**
   * Interface implementation
   */

  @AsMessageEndpoint(
    CallAction.CertificateSigned,
    CertificateSignedRequestSchema,
  )
  certificateSigned(
    identifier: string,
    tenantId: string,
    request: CertificateSignedRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.CertificateSigned,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.InstallCertificate,
    InstallCertificateRequestSchema,
  )
  installCertificate(
    identifier: string,
    tenantId: string,
    request: InstallCertificateRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.InstallCertificate,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.GetInstalledCertificateIds,
    GetInstalledCertificateIdsRequestSchema,
  )
  getInstalledCertificateIds(
    identifier: string,
    tenantId: string,
    request: GetInstalledCertificateIdsRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.GetInstalledCertificateIds,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.DeleteCertificate,
    DeleteCertificateRequestSchema,
  )
  deleteCertificate(
    identifier: string,
    tenantId: string,
    request: DeleteCertificateRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.DeleteCertificate,
      request,
      callbackUrl,
    );
  }

  /**
   * Data Endpoint Methods
   */

  @AsDataEndpoint(
    Namespace.TlsCertificates,
    HttpMethod.Put,
    UpdateTlsCertificateQuerySchema,
    TlsCertificateSchema,
  )
  async putTlsCertificates(
    request: FastifyRequest<{
      Body: TlsCertificatesRequest;
      Querystring: UpdateTlsCertificateQueryString;
    }>,
  ): Promise<void> {
    const serverId = (request.query as UpdateTlsCertificateQueryString)
      .id as string;
    this._logger.info(
      `Receive update TLS certificates request for server ${serverId}`,
    );

    const certRequest = request.body as TlsCertificatesRequest;
    const serverConfig: WebsocketServerConfig | undefined =
      this._websocketServersConfig.find((config) => config.id === serverId);

    if (!serverConfig) {
      throw new Error(`websocketServer id ${serverId} does not exist.`);
    } else if (serverConfig && serverConfig.securityProfile < 2) {
      throw new Error(`websocketServer ${serverId} is not tls or mtls server.`);
    }

    let tlsKey: string;
    let tlsCertificateChain: string;
    let rootCA: string | undefined;
    if (certRequest.contentType === ContentType.FileId) {
      tlsKey = (
        await this._fileAccess.getFile(certRequest.privateKey)
      ).toString();
      tlsCertificateChain = (
        await this._fileAccess.getFile(certRequest.certificateChain)
      ).toString();
      if (certRequest.rootCA) {
        rootCA = (
          await this._fileAccess.getFile(certRequest.rootCA)
        ).toString();
      }
    } else if (certRequest.contentType === ContentType.EncodedRawContent) {
      tlsKey = this._decode(certRequest.privateKey);
      tlsCertificateChain = this._decode(certRequest.certificateChain);
      if (certRequest.rootCA) {
        rootCA = this._decode(certRequest.rootCA);
      }
    } else {
      throw new Error(
        `contentType ${certRequest.contentType} is not supported.`,
      );
    }

    this._updateCertificates(
      serverConfig,
      serverId,
      tlsKey,
      tlsCertificateChain,
      rootCA,
    );
  }

  @AsDataEndpoint(
    Namespace.RootCertificate,
    HttpMethod.Post,
    undefined,
    RootCertificateSchema,
  )
  async installRootCertificate(
    request: FastifyRequest<{ Body: RootCertificateRequest }>,
  ): Promise<Certificate> {
    const certRequest = request.body as RootCertificateRequest;

    this._logger.info(
      `Installing certificate on charger ${certRequest.stationId}`,
    );

    const certificateEntity = new Certificate();
    certificateEntity.stationId = certRequest.stationId;
    certificateEntity.certificateType = certRequest.certificateType;

    let certificatePem: string;
    let privateKeyPem: string;

    if (certRequest.certificateFileId && certRequest.privateKeyFileId) {
      // Load certificate and private key from file storage
      certificatePem = (
        await this._fileAccess.getFile(certRequest.certificateFileId)
      ).toString();
      privateKeyPem = (
        await this._fileAccess.getFile(certRequest.privateKeyFileId)
      ).toString();

      const certificate = forge.pki.certificateFromPem(certificatePem);
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
      certificateEntity.serialNumber = certificate.serialNumber;
      certificateEntity.keyLength = privateKey.n.bitLength();
      certificateEntity.organizationName = certificate.subject.getField({
        shortName: 'O',
      });
      certificateEntity.commonName = certificate.subject.getField({
        shortName: 'CN',
      });
      certificateEntity.validBefore =
        certificate.validity.notAfter.toDateString();
      certificateEntity.certificateFileId = certRequest.certificateFileId;
      certificateEntity.privateKeyFileId = certRequest.privateKeyFileId;
    } else {
      // Generate certificate and private key
      certificateEntity.serialNumber = certRequest.serialNumber
        ? certRequest.serialNumber
        : this._generateSerialNumber();
      certificateEntity.keyLength = certRequest.keyLength
        ? certRequest.keyLength
        : 2048;
      certificateEntity.organizationName = certRequest.organizationName;
      // Refer to OCPP 2.0.1 Part 2 A00.FR.511
      if (certRequest.commonName) {
        certificateEntity.commonName = certRequest.commonName;
      } else {
        const chargingStation: ChargingStation | null =
          await this._module.locationRepository.readChargingStationByStationId(
            certRequest.stationId,
          );
        if (chargingStation && chargingStation.serialNumber) {
          certificateEntity.commonName = chargingStation.serialNumber;
        } else {
          throw new Error(
            'commonName must be provided to generate certificate.',
          );
        }
      }
      if (certRequest.validBefore) {
        certificateEntity.validBefore = certRequest.validBefore;
      } else {
        const defaultValidityDate: Date = new Date();
        defaultValidityDate.setFullYear(defaultValidityDate.getFullYear() + 1);
        certificateEntity.validBefore = defaultValidityDate.toISOString();
      }

      // Generate certificate
      [certificatePem, privateKeyPem] = certRequest.selfSigned
        ? this._generateSelfSignedRootCertificate(certificateEntity)
        : await this._generateRootCertificateSignedByCAServer(
            certificateEntity,
          );

      // Upload certificates to file storage
      certificateEntity.privateKeyFileId = await this._fileAccess.uploadFile(
        `private_key_${certificateEntity.serialNumber}.pem`,
        Buffer.from(privateKeyPem),
        certRequest.filePath,
      );
      certificateEntity.certificateFileId = await this._fileAccess.uploadFile(
        `root_certificate_${certificateEntity.serialNumber}.pem`,
        Buffer.from(certificatePem),
        certRequest.filePath,
      );
    }

    // Store certificates in db
    await this._module.certificateRepository.createOrUpdateCertificate(
      certificateEntity,
    );

    // Send InstallCertificateRequest to the charger
    const confirmation: IMessageConfirmation = await this.installCertificate(
      certRequest.stationId,
      certRequest.tenantId,
      {
        certificateType: certRequest.certificateType,
        certificate: certificatePem,
      } as InstallCertificateRequest,
      certRequest.callbackUrl,
    );
    if (!confirmation.success) {
      throw new Error('Send InstallCertificateRequest failed.');
    }

    return certificateEntity;
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix =
      this._module.config.modules.certificates?.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: Namespace): string {
    const endpointPrefix =
      this._module.config.modules.certificates?.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }

  private _decode(content: string): string {
    return Buffer.from(content, 'base64').toString('binary');
  }

  private _replaceFile(
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

    return rollbackFiles;
  }

  private _updateCertificates(
    serverConfig: WebsocketServerConfig,
    serverId: string,
    tlsKey: string,
    tlsCertificateChain: string,
    subCAKey?: string,
    rootCA?: string | undefined,
  ) {
    let rollbackFiles: RollBackFile[] = [];

    if (
      serverConfig.tlsKeyFilePath &&
      serverConfig.tlsCertificateChainFilePath
    ) {
      try {
        rollbackFiles = this._replaceFile(
          serverConfig.tlsKeyFilePath,
          tlsKey,
          rollbackFiles,
        );
        rollbackFiles = this._replaceFile(
          serverConfig.tlsCertificateChainFilePath,
          tlsCertificateChain,
          rollbackFiles,
        );
        if (serverConfig.mtlsCertificateAuthorityKeyFilePath && subCAKey) {
          rollbackFiles = this._replaceFile(
            serverConfig.mtlsCertificateAuthorityKeyFilePath,
            subCAKey,
            rollbackFiles,
          );
        }
        if (serverConfig.rootCaCertificateFilePath && rootCA) {
          rollbackFiles = this._replaceFile(
            serverConfig.rootCaCertificateFilePath,
            rootCA,
            rollbackFiles,
          );
        }

        // Update the security context of the server without restarting it
        this._networkConnection.updateTlsCertificates(
          serverId,
          tlsKey,
          tlsCertificateChain,
          rootCA,
        );

        // Update the map which stores sub CA certs and keys for each websocket server.
        // This map is used when signing charging station certificates for use case A02 in OCPP 2.0.1 Part 2.
        this._module.securityAuthorityService.updateSecurityCaCertsKeyMap(
          serverId,
          tlsKey,
          tlsCertificateChain,
          rootCA,
        );

        this._logger.info(
          `Updated CSMS certificate for server ${serverId} successfully.`,
        );
      } catch (error) {
        this._logger.error(
          `Failed to update certificate for server ${serverId}: `,
          error,
        );

        this._logger.info('Performing rollback...');
        for (const { oldFilePath, newFilePath } of rollbackFiles) {
          fs.renameSync(newFilePath, oldFilePath);
          this._logger.info(`Rolled back ${newFilePath} to ${oldFilePath}`);
        }

        throw error;
      }
    }
  }

  /**
   * Generate a serial number without leading 0s.
   */
  private _generateSerialNumber(): string {
    const hexString = forge.util.bytesToHex(forge.random.getBytesSync(20));
    return hexString.replace(/^0+/, '');
  }

  /**
   * Generates a root certificate signed by a CA server.
   *
   * @param {Certificate} certificate - The certificate information used for generating the root certificate.
   * @return {Promise<[string, string]>} An array containing the signed certificate and the private key.
   */
  private async _generateRootCertificateSignedByCAServer(
    certificate: Certificate,
  ): Promise<[string, string]> {
    const csr = forge.pki.createCertificationRequest();
    const keyPair = forge.pki.rsa.generateKeyPair({
      bits: certificate.keyLength,
    });

    csr.publicKey = keyPair.publicKey;
    csr.setSubject([
      { name: 'commonName', value: certificate.commonName },
      { name: 'organizationName', value: certificate.organizationName },
    ]);
    csr.sign(keyPair.privateKey);

    const signedCertificate =
      await this._module.certificateAuthorityService.getSignedCertificateByExternalCA(
        forge.pki.certificationRequestToPem(csr),
      );

    return [signedCertificate, forge.pki.privateKeyToPem(keyPair.privateKey)];
  }

  /**
   * Generate root certificate.
   * @return generated root certificate and its private key
   * @param certificate
   */
  private _generateSelfSignedRootCertificate(
    certificate: Certificate,
  ): [string, string] {
    const keyPair = forge.pki.rsa.generateKeyPair({
      bits: certificate.keyLength,
    });
    const cert = forge.pki.createCertificate();
    cert.publicKey = keyPair.publicKey;
    cert.serialNumber = certificate.serialNumber;
    cert.validity.notBefore = new Date();
    if (certificate.validBefore) {
      cert.validity.notAfter = new Date(Date.parse(certificate.validBefore));
    } else {
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(
        cert.validity.notAfter.getFullYear() + 1,
      );
    }

    const attrs = [
      { name: 'commonName', value: certificate.commonName },
      { name: 'organizationName', value: certificate.organizationName },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: true,
      },
      {
        // Based on OCPP 2.0.1 Part 2 A00.FR.512, Key Usage should be used but no details defined.
        name: 'keyUsage',
        critical: true,
        keyCertSign: true,
        digitalSignature: true,
        cRLSign: true,
      },
    ]);

    cert.sign(keyPair.privateKey, forge.md.sha256.create());

    return [
      forge.pki.certificateToPem(cert),
      forge.pki.privateKeyToPem(keyPair.privateKey),
    ];
  }
}

interface RollBackFile {
  oldFilePath: string;
  newFilePath: string;
}
