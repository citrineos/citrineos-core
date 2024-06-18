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
import {
  generateCertificate,
  generateCSR,
  WebsocketNetworkConnection,
} from '@citrineos/util';
import {
  Certificate,
  CountryNameEnumType,
  GenerateCertificateChainRequest,
  GenerateCertificateChainSchema,
  InstallRootCertificateRequest,
  InstallRootCertificateSchema,
  SignatureAlgorithmEnumType,
  TlsCertificateSchema,
  TlsCertificatesRequest,
  UpdateTlsCertificateQuerySchema,
  UpdateTlsCertificateQueryString,
} from '@citrineos/data';
import fs from 'fs';
import moment from 'moment';
import jsrsasign from 'jsrsasign';

const enum PemType {
  Root = 'Root',
  SubCA = 'SubCA',
  Leaf = 'Leaf',
}
/**
 * Server API for the Certificates module.
 */
export class CertificatesModuleApi
  extends AbstractModuleApi<CertificatesModule>
  implements ICertificatesModuleApi
{
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
    } else if (serverConfig.securityProfile === 3 && !certRequest.subCAKey) {
      throw new Error(
        `WebsocketServer ${serverId} is mtls server but subCAKey is missing.`,
      );
    }

    const tlsKey: string = (
      await this._fileAccess.getFile(certRequest.privateKey)
    ).toString();
    let tlsCertificateChain = '';
    for (const fileId of certRequest.certificateChain) {
      tlsCertificateChain += (
        await this._fileAccess.getFile(fileId)
      ).toString();
    }
    const rootCA: string | undefined = certRequest.rootCA
      ? (await this._fileAccess.getFile(certRequest.rootCA)).toString()
      : undefined;
    const subCAKey: string | undefined = certRequest.subCAKey
      ? (await this._fileAccess.getFile(certRequest.subCAKey)).toString()
      : undefined;

    this._updateCertificates(
      serverConfig,
      serverId,
      tlsKey,
      tlsCertificateChain,
      subCAKey,
      rootCA,
    );
  }

  /**
   * This endpoint is used to create certificate chain, root CA, sub CA and leaf certificate
   *
   * @param request - GenerateRootCertificatesRequest
   * @return Promise<Certificate[]> - An array of generated certificates
   */
  @AsDataEndpoint(
    Namespace.CertificateChain,
    HttpMethod.Post,
    undefined,
    GenerateCertificateChainSchema,
  )
  async generateCertificateChain(
    request: FastifyRequest<{ Body: GenerateCertificateChainRequest }>,
  ): Promise<Certificate[]> {
    this._logger.info(
      `Receiving generate certificate chain request ${JSON.stringify(request.body)}`,
    );

    const certRequest = request.body as GenerateCertificateChainRequest;

    let certificateFromReq = new Certificate();
    certificateFromReq.serialNumber = moment().valueOf();
    certificateFromReq.keyLength = certRequest.keyLength
      ? certRequest.keyLength
      : 2048;
    certificateFromReq.organizationName = certRequest.organizationName;
    certificateFromReq.commonName = certRequest.commonName + ` ${PemType.Root}`;
    if (certRequest.validBefore) {
      certificateFromReq.validBefore = certRequest.validBefore;
    } else {
      const defaultValidityDate: Date = new Date();
      defaultValidityDate.setFullYear(defaultValidityDate.getFullYear() + 1);
      certificateFromReq.validBefore = defaultValidityDate.toISOString();
    }
    certificateFromReq.countryName = certRequest.countryName
      ? certRequest.countryName
      : CountryNameEnumType.US;
    certificateFromReq.signatureAlgorithm = certRequest.signatureAlgorithm
      ? certRequest.signatureAlgorithm
      : SignatureAlgorithmEnumType.ECDSA;
    certificateFromReq.isCA = true;
    certificateFromReq.pathLen = certRequest.pathLen ? certRequest.pathLen : 1;

    let responseBody: Certificate[];
    if (certRequest.selfSigned) {
      // Generate self-signed root CA certificate
      const [rootCertificatePem, rootPrivateKeyPem] = generateCertificate(
        certificateFromReq,
        this._logger,
      );
      certificateFromReq = await this._storeCertificateAndKey(
        certificateFromReq,
        rootCertificatePem,
        rootPrivateKeyPem,
        PemType.Root,
        certRequest.filePath,
      );

      // Generate sub CA certificate
      let subCertificate: Certificate = new Certificate();
      subCertificate.serialNumber = certificateFromReq.serialNumber + 1;
      subCertificate.keyLength = certificateFromReq.keyLength;
      subCertificate.organizationName = certificateFromReq.organizationName;
      subCertificate.commonName = certRequest.commonName + ` ${PemType.SubCA}`;
      subCertificate.validBefore = certificateFromReq.validBefore;
      subCertificate.signedBy = certificateFromReq.id;
      subCertificate.countryName = certificateFromReq.countryName;
      subCertificate.signatureAlgorithm = certificateFromReq.signatureAlgorithm;
      subCertificate.isCA = true;
      subCertificate.pathLen = 0;
      const [subCertificatePem, subPrivateKeyPem] = generateCertificate(
        subCertificate,
        this._logger,
        rootPrivateKeyPem,
        rootCertificatePem,
      );
      subCertificate = await this._storeCertificateAndKey(
        subCertificate,
        subCertificatePem,
        subPrivateKeyPem,
        PemType.SubCA,
        certRequest.filePath,
      );

      // Generate leaf certificate
      let leafCertificate: Certificate = new Certificate();
      leafCertificate.serialNumber = subCertificate.serialNumber + 1;
      leafCertificate.keyLength = subCertificate.keyLength;
      leafCertificate.organizationName = subCertificate.organizationName;
      leafCertificate.commonName = certRequest.commonName;
      leafCertificate.validBefore = subCertificate.validBefore;
      leafCertificate.signedBy = subCertificate.id;
      leafCertificate.countryName = subCertificate.countryName;
      leafCertificate.signatureAlgorithm = subCertificate.signatureAlgorithm;
      leafCertificate.isCA = false;
      const [leafCertificatePem, leafPrivateKeyPem] = generateCertificate(
        leafCertificate,
        this._logger,
        subPrivateKeyPem,
        subCertificatePem,
      );
      leafCertificate = await this._storeCertificateAndKey(
        leafCertificate,
        leafCertificatePem,
        leafPrivateKeyPem,
        PemType.Leaf,
        certRequest.filePath,
      );

      responseBody = [leafCertificate, subCertificate, certificateFromReq];
    } else {
      // Generate sub CA certificate and private key singed by external CA server
      // commonName should be a valid domain name
      certificateFromReq.commonName = certRequest.commonName;
      certificateFromReq.pathLen = 0;
      const [certificatePem, privateKeyPem] =
        await this._generateSubCACertificateSignedByCAServer(
          certificateFromReq,
        );
      certificateFromReq = await this._storeCertificateAndKey(
        certificateFromReq,
        certificatePem,
        privateKeyPem,
        PemType.SubCA,
        certRequest.filePath,
      );

      // Generate leaf certificate
      let leafCertificate: Certificate = new Certificate();
      leafCertificate.serialNumber = certificateFromReq.serialNumber + 1;
      leafCertificate.keyLength = certificateFromReq.keyLength;
      leafCertificate.organizationName = certificateFromReq.organizationName;
      leafCertificate.commonName = certRequest.commonName;
      leafCertificate.validBefore = certificateFromReq.validBefore;
      leafCertificate.signedBy = certificateFromReq.id;
      leafCertificate.countryName = certificateFromReq.countryName;
      leafCertificate.signatureAlgorithm =
        certificateFromReq.signatureAlgorithm;
      leafCertificate.isCA = false;
      leafCertificate.pathLen = undefined;
      const [leafCertificatePem, leafPrivateKeyPem] = generateCertificate(
        leafCertificate,
        this._logger,
        privateKeyPem,
        certificatePem,
      );
      leafCertificate = await this._storeCertificateAndKey(
        leafCertificate,
        leafCertificatePem,
        leafPrivateKeyPem,
        PemType.Leaf,
        certRequest.filePath,
      );

      responseBody = [leafCertificate, certificateFromReq];
    }

    return responseBody;
  }

  @AsDataEndpoint(
    Namespace.RootCertificate,
    HttpMethod.Put,
    undefined,
    InstallRootCertificateSchema,
  )
  async installRootCertificate(
    request: FastifyRequest<{
      Body: InstallRootCertificateRequest;
    }>,
  ): Promise<void> {
    const installReq = request.body as InstallRootCertificateRequest;
    this._logger.info(
      `Installing ${installReq.certificateType} on charger ${installReq.stationId}`,
    );

    let rootCAPem: string;
    if (installReq.fileId) {
      rootCAPem = (
        await this._fileAccess.getFile(installReq.fileId)
      ).toString();
    } else {
      rootCAPem =
        await this._module.certificateAuthorityService.getRootCACertificateFromExternalCA(
          installReq.certificateType,
        );
    }

    // Send InstallCertificateRequest to the charger
    await this.installCertificate(
      installReq.stationId,
      installReq.tenantId,
      {
        certificateType: installReq.certificateType,
        certificate: rootCAPem,
      } as InstallCertificateRequest,
      installReq.callbackUrl,
    ).then((confirmation) => {
      if (!confirmation.success) {
        throw new Error(
          `Send InstallCertificateRequest failed: ${confirmation.payload}`,
        );
      }
      this._logger.debug('InstallCertificate confirmation sent:', confirmation);
    });
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
    this._logger.debug(`Backed up and overwrote file ${targetFilePath}`);
    return rollbackFiles;
  }

  private _updateCertificates(
    serverConfig: WebsocketServerConfig,
    serverId: string,
    tlsKey: string,
    tlsCertificateChain: string,
    subCAKey?: string,
    rootCA?: string,
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
        if (serverConfig.rootCACertificateFilePath && rootCA) {
          rollbackFiles = this._replaceFile(
            serverConfig.rootCACertificateFilePath,
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

        // Update the map which stores sub CA certs and keys for websocket server securityProfile 3.
        // This map is used when signing charging station certificates for use case A02 in OCPP 2.0.1 Part 2.
        if (serverConfig.securityProfile === 3 && subCAKey) {
          this._module.certificateAuthorityService.updateSecurityCertChainKeyMap(
            serverId,
            tlsCertificateChain,
            subCAKey,
          );
        }

        this._logger.info(
          `Updated TLS certificate for server ${serverId} successfully.`,
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
   * Generates a sub CA certificate signed by a CA server.
   *
   * @param {Certificate} certificate - The certificate information used for generating the root certificate.
   * @return {Promise<[string, string]>} An array containing the signed certificate and the private key.
   */
  private async _generateSubCACertificateSignedByCAServer(
    certificate: Certificate,
  ): Promise<[string, string]> {
    const [csrPem, privateKeyPem] = generateCSR(certificate);
    const signedCertificate =
      await this._module.certificateAuthorityService.signedSubCaCertificateByExternalCA(
        csrPem,
      );
    return [signedCertificate, privateKeyPem];
  }

  /**
   * Store certificate in file storage and db.
   * @param certificateEntity certificate to be stored in db
   * @param certPem certificate pem to be stored in file storage
   * @param keyPem private key pem to be stored in file storage
   * @param filePrefix prefix for file name to be stored in file storage
   * @param filePath file path in file storage (For directus files, it is the folder id)
   * @return certificate stored in db
   */
  private async _storeCertificateAndKey(
    certificateEntity: Certificate,
    certPem: string,
    keyPem: string,
    filePrefix: PemType,
    filePath?: string,
  ): Promise<Certificate> {
    // Store certificate and private key in file storage
    certificateEntity.privateKeyFileId = await this._fileAccess.uploadFile(
      `${filePrefix}_Key_${certificateEntity.serialNumber}.pem`,
      Buffer.from(keyPem),
      filePath,
    );
    certificateEntity.certificateFileId = await this._fileAccess.uploadFile(
      `${filePrefix}_Certificate_${certificateEntity.serialNumber}.pem`,
      Buffer.from(certPem),
      filePath,
    );
    // Store certificate in db
    const certObj = new jsrsasign.X509();
    certObj.readCertPEM(certPem);
    certificateEntity.issuerName = certObj.getIssuerString();
    return await this._module.certificateRepository.createOrUpdateCertificate(
      certificateEntity,
    );
  }
}

interface RollBackFile {
  oldFilePath: string;
  newFilePath: string;
}
