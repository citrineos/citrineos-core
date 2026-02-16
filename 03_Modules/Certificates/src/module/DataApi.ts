// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractModuleApi,
  AsDataEndpoint,
  AsMessageEndpoint,
  DEFAULT_TENANT_ID,
  HttpMethod,
  type IFileStorage,
  type IMessageConfirmation,
  type IMessageQuerystring,
  IMessageQuerystringSchema,
  Namespace,
  OCPP1_6_Namespace,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPP2_0_1_Namespace,
  OCPPVersion,
  type WebsocketServerConfig,
} from '@citrineos/base';
import {
  Certificate,
  CountryNameEnumType,
  DeleteCertificateAttempt,
  GenerateCertificateChainRequest,
  GenerateCertificateChainSchema,
  InstalledCertificate,
  InstallRootCertificateRequest,
  InstallRootCertificateSchema,
  RegenerateExistingCertificate,
  RegenerateInstalledCertificateSchema,
  SignatureAlgorithmEnumType,
  TenantQuerySchema,
  type TenantQueryString,
  TlsCertificateSchema,
  TlsCertificatesRequest,
  UpdateTlsCertificateQuerySchema,
  type UpdateTlsCertificateQueryString,
  UploadExistingCertificate,
  UploadExistingCertificateSchema,
} from '@citrineos/data';
import { generateCertificate } from '@citrineos/util';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import jsrsasign from 'jsrsasign';
import moment from 'moment';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { ICertificatesModuleApi } from './interface.js';
import { CertificatesModule } from './module.js';
import { PemType } from './installCertificateHelperService.js';

/**
 * Server API for the Certificates module.
 */
export class CertificatesDataApi
  extends AbstractModuleApi<CertificatesModule>
  implements ICertificatesModuleApi
{
  private readonly _websocketServersConfig: WebsocketServerConfig[];
  private readonly _fileStorage: IFileStorage;

  /**
   * Constructs a new instance of the class.
   *
   * @param {CertificatesModule} certificatesModule - The Certificates module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {IFileStorage} fileStorage - The fileStorage
   * @param {WebsocketServerConfig[]} websocketServersConfig - Configuration for websocket servers
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor(
    certificatesModule: CertificatesModule,
    server: FastifyInstance,
    fileStorage: IFileStorage,
    websocketServersConfig: WebsocketServerConfig[],
    logger?: Logger<ILogObj>,
  ) {
    super(certificatesModule, server, OCPPVersion.OCPP2_0_1, logger);
    this._fileStorage = fileStorage;
    this._websocketServersConfig = websocketServersConfig;
  }

  /**
   * Interface implementation
   */
  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.CertificateSigned,
    OCPP2_0_1.CertificateSignedRequestSchema,
  )
  certificateSigned(
    identifier: string,
    tenantId: number,
    request: OCPP2_0_1.CertificateSignedRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.CertificateSigned,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.InstallCertificate,
    OCPP2_0_1.InstallCertificateRequestSchema,
  )
  async installCertificate(
    identifier: string,
    tenantId: number,
    request: OCPP2_0_1.InstallCertificateRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    await this._module.installCertificateHelperService.prepareToInstallCertificate(
      tenantId,
      identifier,
      request.certificate,
      request.certificateType,
    );
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.InstallCertificate,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetInstalledCertificateIds,
    OCPP2_0_1.GetInstalledCertificateIdsRequestSchema,
  )
  getInstalledCertificateIds(
    identifier: string,
    tenantId: number,
    request: OCPP2_0_1.GetInstalledCertificateIdsRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.GetInstalledCertificateIds,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.DeleteCertificate,
    OCPP2_0_1.DeleteCertificateRequestSchema,
  )
  async deleteCertificate(
    identifier: string,
    tenantId: number,
    request: OCPP2_0_1.DeleteCertificateRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    const certificateHashData = request.certificateHashData;
    const existingPendingDeleteCertificateAttempt =
      await this._module.deleteCertificateAttemptRepository.readOnlyOneByQuery(tenantId, {
        where: {
          stationId: identifier,
          hashAlgorithm: certificateHashData.hashAlgorithm,
          issuerNameHash: certificateHashData.issuerNameHash,
          issuerKeyHash: certificateHashData.issuerKeyHash,
          serialNumber: certificateHashData.serialNumber,
          status: null,
        },
      });
    if (!existingPendingDeleteCertificateAttempt) {
      const deleteCertificateAttempt = new DeleteCertificateAttempt();
      deleteCertificateAttempt.stationId = identifier;
      deleteCertificateAttempt.hashAlgorithm = certificateHashData.hashAlgorithm;
      deleteCertificateAttempt.issuerNameHash = certificateHashData.issuerNameHash;
      deleteCertificateAttempt.issuerKeyHash = certificateHashData.issuerKeyHash;
      deleteCertificateAttempt.serialNumber = certificateHashData.serialNumber;
      await deleteCertificateAttempt.save();
    }
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.DeleteCertificate,
      request,
      callbackUrl,
    );
  }

  /**
   * Data Endpoint Methods
   */
  @AsDataEndpoint(
    OCPP2_0_1_Namespace.TlsCertificates,
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
    const serverId = (request.query as UpdateTlsCertificateQueryString).id as string;
    this._logger.info(`Receive update TLS certificates request for server ${serverId}`);

    const certRequest = request.body as TlsCertificatesRequest;
    const serverConfig: WebsocketServerConfig | undefined = this._websocketServersConfig.find(
      (config) => config.id === serverId,
    );

    if (!serverConfig) {
      throw new Error(`websocketServer id ${serverId} does not exist.`);
    } else if (serverConfig && serverConfig.securityProfile < 2) {
      throw new Error(`websocketServer ${serverId} is not tls or mtls server.`);
    } else if (serverConfig.securityProfile === 3 && !certRequest.subCAKey) {
      throw new Error(`WebsocketServer ${serverId} is mtls server but subCAKey is missing.`);
    }

    const tlsKey: string = (await this._fileStorage.getFile(certRequest.privateKey))!.toString();
    let tlsCertificateChain = '';
    for (const fileId of certRequest.certificateChain) {
      tlsCertificateChain += (await this._fileStorage.getFile(fileId))!.toString();
    }
    const rootCA: string | undefined = certRequest.rootCA
      ? (await this._fileStorage.getFile(certRequest.rootCA))!.toString()
      : undefined;
    const subCAKey: string | undefined = certRequest.subCAKey
      ? (await this._fileStorage.getFile(certRequest.subCAKey))!.toString()
      : undefined;

    this._module.installCertificateHelperService.updateCertificates(
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
    OCPP2_0_1_Namespace.CertificateChain,
    HttpMethod.Post,
    TenantQuerySchema,
    GenerateCertificateChainSchema,
  )
  async generateCertificateChain(
    request: FastifyRequest<{
      Body: GenerateCertificateChainRequest;
      Querystring: TenantQueryString;
    }>,
  ): Promise<Certificate[]> {
    this._logger.info(
      `Receiving generate certificate chain request ${JSON.stringify(request.body)}`,
    );

    const tenantId = request.query.tenantId;
    const certRequest = request.body as GenerateCertificateChainRequest;

    let certificateFromReq = new Certificate();
    certificateFromReq.serialNumber = moment().valueOf();
    certificateFromReq.keyLength = certRequest.keyLength ? certRequest.keyLength : 2048;
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
      certificateFromReq =
        await this._module.installCertificateHelperService.storeCertificateAndKey(
          tenantId,
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
      subCertificate = await this._module.installCertificateHelperService.storeCertificateAndKey(
        tenantId,
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
      leafCertificate = await this._module.installCertificateHelperService.storeCertificateAndKey(
        tenantId,
        leafCertificate,
        leafCertificatePem,
        leafPrivateKeyPem,
        PemType.Leaf,
        certRequest.filePath,
      );

      responseBody = [leafCertificate, subCertificate, certificateFromReq];
    } else {
      // Generate sub CA certificate and private key signed by external CA server
      // commonName should be a valid domain name
      certificateFromReq.commonName = certRequest.commonName;
      certificateFromReq.pathLen = 0;
      const [certificatePem, privateKeyPem] =
        await this._module.installCertificateHelperService.generateSubCACertificateSignedByCAServer(
          certificateFromReq,
        );
      certificateFromReq =
        await this._module.installCertificateHelperService.storeCertificateAndKey(
          tenantId,
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
      leafCertificate.signatureAlgorithm = certificateFromReq.signatureAlgorithm;
      leafCertificate.isCA = false;
      leafCertificate.pathLen = undefined;
      const [leafCertificatePem, leafPrivateKeyPem] = generateCertificate(
        leafCertificate,
        this._logger,
        privateKeyPem,
        certificatePem,
      );
      leafCertificate = await this._module.installCertificateHelperService.storeCertificateAndKey(
        tenantId,
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
    OCPP2_0_1_Namespace.RootCertificate,
    HttpMethod.Put,
    undefined,
    InstallRootCertificateSchema,
  )
  async installRootCertificate(
    request: FastifyRequest<{
      Body: InstallRootCertificateRequest;
    }>,
  ): Promise<IMessageConfirmation> {
    const installReq = request.body as InstallRootCertificateRequest;
    this._logger.info(
      `Installing ${installReq.certificateType} on charger ${installReq.stationId}`,
    );

    let rootCAPem: string;
    if (installReq.fileId) {
      rootCAPem = (await this._fileStorage.getFile(installReq.fileId))!.toString();
    } else {
      rootCAPem = await this._module.certificateAuthorityService.getRootCACertificateFromExternalCA(
        installReq.certificateType,
      );
    }

    await this._module
      .sendCall(
        installReq.stationId,
        installReq.tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.InstallCertificate,
        {
          certificateType: installReq.certificateType,
          certificate: rootCAPem,
        } as OCPP2_0_1.InstallCertificateRequest,
        installReq.callbackUrl,
      )
      .then((confirmation) => {
        if (!confirmation.success) {
          throw new Error(`Send InstallCertificateRequest failed: ${confirmation.payload}`);
        }
        this._logger.debug('InstallCertificate confirmation sent:', confirmation);
      });

    return {
      success: true,
    };
  }

  /**
   * Endpoint to upload an existing certificate that is already installed on a given station to the CSMS
   * @param request - UploadExistingCertificateSchema
   * @return Promise<InstalledCertificate> - the installed certificate record
   */
  @AsDataEndpoint(
    OCPP2_0_1_Namespace.UploadExistingCertificate,
    HttpMethod.Post,
    IMessageQuerystringSchema,
    UploadExistingCertificateSchema,
  )
  async uploadExistingCertificate(
    request: FastifyRequest<{
      Body: UploadExistingCertificate;
      Querystring: IMessageQuerystring;
    }>,
  ): Promise<InstalledCertificate[]> {
    const uploadExistingCertificate = request.body as UploadExistingCertificate;
    const messageQuerystring = request.query as IMessageQuerystring;
    const tenantId = messageQuerystring.tenantId || DEFAULT_TENANT_ID;
    const identifier = messageQuerystring.identifier;
    const isIdentifierList = Array.isArray(identifier);
    if (isIdentifierList) {
      let promises: Promise<InstalledCertificate>[] = [];
      for (let identifierElement of identifier) {
        promises.push(
          this._module.installCertificateHelperService.handleUploadExistingCertificate(
            tenantId,
            identifierElement,
            uploadExistingCertificate,
          ),
        );
      }
      return await Promise.all(promises);
    } else {
      return [
        await this._module.installCertificateHelperService.handleUploadExistingCertificate(
          tenantId,
          identifier,
          uploadExistingCertificate,
        ),
      ];
    }
  }

  /**
   * Endpoint to regenerate an existing certificate that is already installed on a given station.
   * Updates the InstalledCertificate record with the new certificate.
   *
   * @param request RegenerateInstalledCertificateSchema
   * @return Promise<InstalledCertificate> - the updated installed certificate record
   */
  @AsDataEndpoint(
    OCPP2_0_1_Namespace.RegenerateExistingCertificate,
    HttpMethod.Post,
    IMessageQuerystringSchema,
    RegenerateInstalledCertificateSchema,
  )
  async regenerateExistingCertificate(
    request: FastifyRequest<{
      Body: RegenerateExistingCertificate;
      Querystring: IMessageQuerystring;
    }>,
  ): Promise<InstalledCertificate> {
    const installedCertificateId = request.body.installedCertificateId;
    const validBeforeParam = request.body.validBefore;
    const stationId = request.query.identifier;
    const tenantId = request.query.tenantId || DEFAULT_TENANT_ID;
    this._logger.info(
      `Regenerating existing certificate ${installedCertificateId} for charger ${stationId}`,
    );
    const existingInstalledCertificate =
      await this._module.installedCertificateRepository.readOnlyOneByQuery(tenantId, {
        where: {
          id: installedCertificateId,
          stationId: stationId,
        },
      });
    if (!existingInstalledCertificate) {
      throw new Error('Installed certificate not found');
    }
    const existingCertificateRecord = await existingInstalledCertificate.$get('certificate');
    if (!existingCertificateRecord) {
      throw new Error('Certificate not found');
    }
    const fileId = existingCertificateRecord.certificateFileId;
    if (!fileId) {
      throw new Error('Certificate file not found');
    }
    const privateKeyFileId = existingCertificateRecord.privateKeyFileId;
    if (!privateKeyFileId) {
      throw new Error('Certificate privateKeyFileId not found');
    }
    const existingCertificateBuffer = await this._fileStorage.getFile(fileId);
    const existingPrivateKeyBuffer = await this._fileStorage.getFile(privateKeyFileId);
    if (!existingCertificateBuffer || !existingPrivateKeyBuffer) {
      throw new Error('Certificate files not found');
    }
    const existingCertificateString = existingCertificateBuffer.toString();
    const existingPrivateKey = existingPrivateKeyBuffer.toString();
    const existingCertificate = new jsrsasign.X509();
    existingCertificate.readCertPEM(existingCertificateString);
    const existingSubjectString = existingCertificate.getSubjectString();
    let newCertificateRecord = new Certificate();
    newCertificateRecord.serialNumber = moment().valueOf();
    newCertificateRecord.issuerName = existingSubjectString;
    newCertificateRecord.organizationName = existingCertificateRecord.organizationName;
    newCertificateRecord.commonName = existingCertificateRecord.commonName;
    newCertificateRecord.keyLength = existingCertificateRecord.keyLength;
    newCertificateRecord.validBefore = validBeforeParam;
    newCertificateRecord.signatureAlgorithm = existingCertificateRecord.signatureAlgorithm;
    newCertificateRecord.countryName = existingCertificateRecord.countryName;
    newCertificateRecord.isCA = existingCertificateRecord.isCA;
    newCertificateRecord.pathLen = existingCertificateRecord.pathLen;
    newCertificateRecord.signedBy = existingCertificateRecord.id;
    newCertificateRecord.certificateFileHash = existingCertificateRecord.certificateFileHash;
    const [newCertificatePem, newPrivateKeyPem] = generateCertificate(
      newCertificateRecord,
      this._logger,
      existingPrivateKey,
      existingCertificateString,
    );
    newCertificateRecord.certificateFileHash =
      this._module.installCertificateHelperService.getCertificateHash(newCertificatePem);
    newCertificateRecord.certificateFileId = await this._fileStorage.saveFile(
      `Regenerated_Cert_${newCertificateRecord.serialNumber}.pem`,
      Buffer.from(newCertificatePem),
    );
    newCertificateRecord.privateKeyFileId = await this._fileStorage.saveFile(
      `Regenerated_Key_${newCertificateRecord.serialNumber}.pem`,
      Buffer.from(newPrivateKeyPem),
    );
    newCertificateRecord = await newCertificateRecord.save();
    existingInstalledCertificate.certificateId = newCertificateRecord.id;
    await existingInstalledCertificate.save();
    return existingInstalledCertificate;
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {Namespace} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace): string {
    const endpointPrefix = this._module.config.modules.certificates?.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
