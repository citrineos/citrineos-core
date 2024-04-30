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
  Certificate,
  ContentType,
  RootCertificateRequest,
  RootCertificateSchema,
  TlsCertificateSchema,
  TlsCertificatesRequest,
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

  /**
   * This endpoint is used to create root certificates, root CA and sub CA
   * and install them on the charger by sending the InstallCertificateRequest
   * @param request - RootCertificateRequest
   * @return Promise<Certificate[]> - An array of generated certificates
   */
  @AsDataEndpoint(
    Namespace.RootCertificates,
    HttpMethod.Post,
    undefined,
    RootCertificateSchema,
  )
  async installRootCertificates(
    request: FastifyRequest<{ Body: RootCertificateRequest }>,
  ): Promise<Certificate[]> {
    const certRequest = request.body as RootCertificateRequest;

    this._logger.info(
      `Installing root certificates on charger ${certRequest.stationId}`,
    );

    const certificateFromReq = new Certificate();
    certificateFromReq.certificateType = certRequest.certificateType;
    certificateFromReq.serialNumber = certRequest.serialNumber
      ? certRequest.serialNumber
      : this._generateSerialNumber();
    certificateFromReq.keyLength = certRequest.keyLength
      ? certRequest.keyLength
      : 2048;
    certificateFromReq.organizationName = certRequest.organizationName;
    certificateFromReq.commonName = certRequest.commonName;
    if (certRequest.validBefore) {
      certificateFromReq.validBefore = certRequest.validBefore;
    } else {
      const defaultValidityDate: Date = new Date();
      defaultValidityDate.setFullYear(defaultValidityDate.getFullYear() + 1);
      certificateFromReq.validBefore = defaultValidityDate.toISOString();
    }

    let responseBody: Certificate[];
    let rootChainPem;
    if (certRequest.selfSigned) {
      // Generate self-signed root certificate
      const [rootCertificatePem, rootPrivateKeyPem] =
        this._generateSelfSignedRootCertificate(certificateFromReq);
      // Store root certificates in file storage
      certificateFromReq.privateKeyFileId = await this._fileAccess.uploadFile(
        `root_key_${certificateFromReq.serialNumber}.pem`,
        Buffer.from(rootPrivateKeyPem),
        certRequest.filePath,
      );
      certificateFromReq.certificateFileId = await this._fileAccess.uploadFile(
        `root_certificate_${certificateFromReq.serialNumber}.pem`,
        Buffer.from(rootCertificatePem),
        certRequest.filePath,
      );
      // Store root certificates in db
      await this._module.certificateRepository.createOrUpdateCertificate(
        certificateFromReq,
      );
      // Generate sub CA certificate
      const subCertificate: Certificate = new Certificate();
      subCertificate.certificateType = certificateFromReq.certificateType;
      subCertificate.serialNumber = this._generateSerialNumber();
      subCertificate.keyLength = certificateFromReq.keyLength;
      subCertificate.organizationName = certificateFromReq.organizationName;
      subCertificate.commonName = certRequest.commonName + ' Sub CA';
      subCertificate.validBefore = certificateFromReq.validBefore;
      subCertificate.signedBy = certificateFromReq.id;
      const [subCertificatePem, subPrivateKeyPem] =
        this._generateSubCACertificate(rootPrivateKeyPem, rootCertificatePem);
      // Store sub CA certificates in file storage
      subCertificate.privateKeyFileId = await this._fileAccess.uploadFile(
        `sub_CA_key_${subCertificate.serialNumber}.pem`,
        Buffer.from(subPrivateKeyPem),
        certRequest.filePath,
      );
      subCertificate.certificateFileId = await this._fileAccess.uploadFile(
        `sub_CA_certificate_${subCertificate.serialNumber}.pem`,
        Buffer.from(subCertificatePem),
        certRequest.filePath,
      );
      // Store sub certificates in db
      await this._module.certificateRepository.createOrUpdateCertificate(
        subCertificate,
      );

      responseBody = [subCertificate, certificateFromReq];
      rootChainPem = subCertificatePem + '\n' + rootCertificatePem;
    } else {
      // Get root certificate from external CA
      const externalRootCAPem =
        await this._module.certificateAuthorityService.getRootCACertificateFromExternalCA();

      // Generate sub CA certificate and private key
      const [certificatePem, privateKeyPem] =
        await this._generateSubCACertificateSignedByCAServer(
          certificateFromReq,
        );
      // Upload certificate and private key to file storage
      certificateFromReq.privateKeyFileId = await this._fileAccess.uploadFile(
        `sub_CA_key_${certificateFromReq.serialNumber}.pem`,
        Buffer.from(privateKeyPem),
        certRequest.filePath,
      );
      certificateFromReq.certificateFileId = await this._fileAccess.uploadFile(
        `sub_CA_certificate_${certificateFromReq.serialNumber}.pem`,
        Buffer.from(certificatePem),
        certRequest.filePath,
      );

      // Store sub CA certificate in db
      await this._module.certificateRepository.createOrUpdateCertificate(
        certificateFromReq,
      );

      responseBody = [certificateFromReq];
      rootChainPem = certificatePem + '\n' + externalRootCAPem;
    }

    // Send InstallCertificateRequest to the charger
    const confirmation: IMessageConfirmation = await this.installCertificate(
      certRequest.stationId,
      certRequest.tenantId,
      {
        certificateType: certRequest.certificateType,
        certificate: rootChainPem,
      } as InstallCertificateRequest,
      certRequest.callbackUrl,
    );
    if (!confirmation.success) {
      throw new Error('Send InstallCertificateRequest failed.');
    }

    return responseBody;
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
        this._module.certificateAuthorityService.updateSecurityCertChainKeyMap(
          serverId,
          tlsKey,
          tlsCertificateChain,
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
  private async _generateSubCACertificateSignedByCAServer(
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
      await this._module.certificateAuthorityService.signedSubCaCertificateByExternalCA(
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

  private _generateSubCACertificate(
    rootKeyPem: string,
    rootCertPem: string,
  ): [string, string] {
    const rootCert = forge.pki.certificateFromPem(rootCertPem);
    const rootKey = forge.pki.privateKeyFromPem(rootKeyPem);

    const subCAKeyPair = forge.pki.rsa.generateKeyPair({
      bits: rootKey.n.bitLength(),
    });
    const subCACert = forge.pki.createCertificate();
    const attrs = [
      { name: 'commonName', value: rootCert.subject.getField('CN') + ' SubCA' },
      { name: 'organizationName', value: rootCert.subject.getField('O') },
    ];
    subCACert.setSubject(attrs);
    subCACert.setIssuer(rootCert.subject.attributes);
    subCACert.publicKey = subCAKeyPair.publicKey;
    subCACert.validity.notBefore = new Date();
    subCACert.validity.notAfter = rootCert.validity.notAfter;
    subCACert.setExtensions([
      {
        name: 'basicConstraints',
        cA: false,
      },
      {
        name: 'keyUsage',
        critical: true,
        keyCertSign: true,
        digitalSignature: true,
        cRLSign: true,
      },
    ]);

    subCACert.sign(rootKey, forge.md.sha256.create());

    return [
      forge.pki.certificateToPem(subCACert),
      forge.pki.privateKeyToPem(subCAKeyPair.privateKey),
    ];
  }
}

interface RollBackFile {
  oldFilePath: string;
  newFilePath: string;
}
