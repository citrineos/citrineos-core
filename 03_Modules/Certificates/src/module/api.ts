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
  GenerateCertificateChainRequest,
  GenerateCertificateChainSchema,
  TlsCertificatesRequest,
  TlsCertificateSchema,
  UpdateTlsCertificateQuerySchema,
  UpdateTlsCertificateQueryString,
  InstallRootCertificateSchema,
  InstallRootCertificateRequest,
} from '@citrineos/data';
import fs from 'fs';
import * as forge from 'node-forge';

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
    certificateFromReq.serialNumber = certRequest.serialNumber
      ? certRequest.serialNumber
      : this._generateSerialNumber();
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

    let responseBody: Certificate[];
    if (certRequest.selfSigned) {
      // Generate self-signed root CA certificate
      const [rootCertificatePem, rootPrivateKeyPem] = this._generateCertificate(
        certificateFromReq,
        true,
        1,
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
      subCertificate.serialNumber = this._generateSerialNumber();
      subCertificate.keyLength = certificateFromReq.keyLength;
      subCertificate.organizationName = certificateFromReq.organizationName;
      subCertificate.commonName = certRequest.commonName + ` ${PemType.SubCA}`;
      subCertificate.validBefore = certificateFromReq.validBefore;
      subCertificate.signedBy = certificateFromReq.id;
      const [subCertificatePem, subPrivateKeyPem] = this._generateCertificate(
        subCertificate,
        true,
        0,
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
      leafCertificate.serialNumber = this._generateSerialNumber();
      leafCertificate.keyLength = subCertificate.keyLength;
      leafCertificate.organizationName = subCertificate.organizationName;
      leafCertificate.commonName = certRequest.commonName + ` ${PemType.SubCA}`;
      leafCertificate.validBefore = subCertificate.validBefore;
      leafCertificate.signedBy = subCertificate.id;
      const [leafCertificatePem, leafPrivateKeyPem] = this._generateCertificate(
        leafCertificate,
        false,
        undefined,
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
      leafCertificate.serialNumber = this._generateSerialNumber();
      leafCertificate.keyLength = certificateFromReq.keyLength;
      leafCertificate.organizationName = certificateFromReq.organizationName;
      leafCertificate.commonName = certRequest.commonName;
      leafCertificate.validBefore = certificateFromReq.validBefore;
      leafCertificate.signedBy = certificateFromReq.id;
      const [leafCertificatePem, leafPrivateKeyPem] = this._generateCertificate(
        leafCertificate,
        false,
        undefined,
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
        if (serverConfig.securityProfile === 3) {
          this._module.certificateAuthorityService.updateSecurityCertChainKeyMap(
            serverId,
            tlsKey,
            tlsCertificateChain,
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
   * Generate certificate and its private key
   *
   * @param certificateEntity - the certificate
   * @param isCA - true if the certificate is a root or sub CA certificate
   * @param issuerKeyPem - the issuer private key
   * @param issuerCertPem - the issuer certificate
   * @param pathLenConstraint - A pathLenConstraint of zero indicates that no intermediate CA certificates may
   * follow in a valid certification path. Where it appears, the pathLenConstraint field MUST be greater than or
   * equal to zero. Where pathLenConstraint does not appear, no limit is imposed.
   * Reference: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.9
   *
   * @return generated certificate and its private key
   */
  private _generateCertificate(
    certificateEntity: Certificate,
    isCA: boolean,
    pathLenConstraint?: number,
    issuerKeyPem?: string,
    issuerCertPem?: string,
  ): [string, string] {
    this._logger.info(
      `Creating certificate ${certificateEntity}, isCA ${isCA} with issuer cert ${issuerCertPem} and issuer key ${!!issuerKeyPem}`,
    );
    // create key pair
    const keyPair = forge.pki.rsa.generateKeyPair({
      bits: certificateEntity.keyLength,
    });

    // create certificate
    const certificate = forge.pki.createCertificate();
    certificate.publicKey = keyPair.publicKey;
    certificate.serialNumber = certificateEntity.serialNumber;
    certificate.validity.notBefore = new Date();
    if (certificateEntity.validBefore) {
      certificate.validity.notAfter = new Date(
        Date.parse(certificateEntity.validBefore),
      );
    } else {
      certificate.validity.notAfter = new Date();
      certificate.validity.notAfter.setFullYear(
        certificate.validity.notAfter.getFullYear() + 1,
      );
    }

    // set subject
    const attrs = [
      {
        name: 'commonName',
        value: certificateEntity.commonName,
      },
      { name: 'organizationName', value: certificateEntity.organizationName },
    ];
    certificate.setSubject(attrs);

    // set issuer
    if (issuerCertPem) {
      certificate.setIssuer(
        forge.pki.certificateFromPem(issuerCertPem).subject.attributes,
      );
    } else {
      certificate.setIssuer(attrs);
    }

    // set extensions
    const basicConstraints: any = {
      name: 'basicConstraints',
      cA: isCA,
    };
    if (pathLenConstraint) {
      basicConstraints.pathLenConstraint = pathLenConstraint;
    }
    const extensions: any[] = [
      basicConstraints,
      {
        name: 'keyUsage',
        critical: true,
        keyCertSign: true,
        digitalSignature: true,
        crlSign: true,
        keyEncipherment: !isCA,
      },
      {
        name: 'subjectKeyIdentifier',
      },
    ];
    if (issuerCertPem) {
      const aki =
        forge.pki.certificateFromPem(
          issuerCertPem,
        ).generateSubjectKeyIdentifier;
      this._logger.debug(`aki: ${aki().getBytes()}`);
      extensions.push({
        name: 'authorityKeyIdentifier',
        keyIdentifier: forge.pki
          .certificateFromPem(issuerCertPem)
          .generateSubjectKeyIdentifier()
          .getBytes(),
      });
    }
    certificate.setExtensions(extensions);

    // sign
    if (issuerKeyPem) {
      certificate.sign(
        forge.pki.privateKeyFromPem(issuerKeyPem),
        forge.md.sha256.create(),
      );
    } else {
      certificate.sign(keyPair.privateKey, forge.md.sha256.create());
    }

    return [
      forge.pki.certificateToPem(certificate),
      forge.pki.privateKeyToPem(keyPair.privateKey),
    ];
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
    return await this._module.certificateRepository.createOrUpdateCertificate(
      certificateEntity,
    );
  }
}

interface RollBackFile {
  oldFilePath: string;
  newFilePath: string;
}
