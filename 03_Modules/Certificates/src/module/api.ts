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
  ChargerCertificateRequest,
  ChargerCertificateSchema,
  ContentType,
  CsmsCertificateRequest,
  CsmsCertificateSchema,
  UpdateCsmsCertificateQuerySchema,
  UpdateCsmsCertificateQueryString,
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
    Namespace.CsmsCertificate,
    HttpMethod.Put,
    UpdateCsmsCertificateQuerySchema,
    CsmsCertificateSchema,
  )
  async putCsmsCertificate(
    request: FastifyRequest<{
      Body: CsmsCertificateRequest;
      Querystring: UpdateCsmsCertificateQueryString;
    }>,
  ): Promise<void> {
    const serverId = request.query.id as string;
    this._logger.info(
      `Receive update CSMS certificate request for server ${serverId}`,
    );

    const certRequest = request.body as CsmsCertificateRequest;
    const serverConfig: WebsocketServerConfig | undefined =
      this._websocketServersConfig.find((config) => config.id === serverId);

    if (!serverConfig) {
      throw new Error(`websocketServer id ${serverId} does not exist.`);
    } else if (serverConfig && serverConfig.securityProfile < 2) {
      throw new Error(`websocketServer ${serverId} is not tls or mtls server.`);
    }

    let tlsKeys: string;
    let tlsCertificateChain: string;
    let mtlsCARoots: string | undefined;
    if (certRequest.contentType === ContentType.FileId) {
      tlsKeys = (
        await this._fileAccess.getFile(certRequest.privateKeys)
      ).toString();
      tlsCertificateChain = (
        await this._fileAccess.getFile(certRequest.certificateChain)
      ).toString();
      if (
        serverConfig.mtlsCertificateAuthorityRootsFilepath &&
        certRequest.caCertificateRoots
      ) {
        mtlsCARoots = (
          await this._fileAccess.getFile(certRequest.caCertificateRoots)
        ).toString();
      }
    } else {
      tlsKeys = this._decode(certRequest.privateKeys);
      tlsCertificateChain = this._decode(certRequest.certificateChain);
      if (
        serverConfig.mtlsCertificateAuthorityRootsFilepath &&
        certRequest.caCertificateRoots
      ) {
        mtlsCARoots = this._decode(certRequest.caCertificateRoots);
      }
    }

    this._updateCertificates(
      serverConfig,
      serverId,
      tlsKeys,
      tlsCertificateChain,
      mtlsCARoots,
    );
  }

  @AsDataEndpoint(
    Namespace.ChargerCertificate,
    HttpMethod.Post,
    undefined,
    ChargerCertificateSchema,
  )
  async installChargerCertificate(
    request: FastifyRequest<{ Body: ChargerCertificateRequest }>,
  ): Promise<Certificate> {
    const certRequest = request.body as ChargerCertificateRequest;

    this._logger.info(
      `Installing certificate on charger ${certRequest.stationId}`,
    );

    const certificateEntity = new Certificate();
    certificateEntity.stationId = certRequest.stationId;
    certificateEntity.serialNumber = certRequest.serialNumber
      ? certRequest.serialNumber
      : this._generateSerialNumber();
    certificateEntity.certificateType = certRequest.certificateType;
    certificateEntity.keyLength = certRequest.keyLength
      ? certRequest.keyLength
      : 2048;
    certificateEntity.organizationName = certRequest.organizationName;
    // Refer to OCPP 2.0.1 Part 2 A00.FR.511
    certificateEntity.commonName = certRequest.commonName
      ? certRequest.commonName
      : certRequest.serialNumber;
    if (certRequest.validBefore) {
      certificateEntity.validBefore = certRequest.validBefore;
    } else {
      const defaultValidityDate: Date = new Date();
      defaultValidityDate.setFullYear(defaultValidityDate.getFullYear() + 1);
      certificateEntity.validBefore = defaultValidityDate.toISOString();
    }

    // Generate certificate
    const [certificatePem, privateKeyPem] =
      this._generateRootCertificate(certificateEntity);

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
    tlsKeys: string,
    tlsCertificateChain: string,
    mtlsCARoots?: string | undefined,
  ) {
    let rollbackFiles: RollBackFile[] = [];

    if (
      serverConfig.tlsKeysFilepath &&
      serverConfig.tlsCertificateChainFilepath
    ) {
      try {
        rollbackFiles = this._replaceFile(
          serverConfig.tlsKeysFilepath,
          tlsKeys,
          rollbackFiles,
        );
        rollbackFiles = this._replaceFile(
          serverConfig.tlsCertificateChainFilepath,
          tlsCertificateChain,
          rollbackFiles,
        );

        if (serverConfig.mtlsCertificateAuthorityRootsFilepath && mtlsCARoots) {
          rollbackFiles = this._replaceFile(
            serverConfig.mtlsCertificateAuthorityRootsFilepath,
            mtlsCARoots,
            rollbackFiles,
          );
        }

        this._networkConnection.updateCertificate(
          serverId,
          tlsKeys,
          tlsCertificateChain,
          mtlsCARoots,
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
   * Generate root certificate.
   * @return generated root certificate and its private key
   * @param certificate
   */
  private _generateRootCertificate(certificate: Certificate): [string, string] {
    const keys = forge.pki.rsa.generateKeyPair({ bits: certificate.keyLength });
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
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

    cert.sign(keys.privateKey, forge.md.sha256.create());

    return [
      forge.pki.certificateToPem(cert),
      forge.pki.privateKeyToPem(keys.privateKey),
    ];
  }
}

interface RollBackFile {
  oldFilePath: string;
  newFilePath: string;
}
