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
  GetCertificateIdUseEnumType,
  GetInstalledCertificateIdsRequest,
  GetInstalledCertificateIdsRequestSchema,
  HttpMethod,
  IFileAccess,
  IMessageConfirmation,
  IMessageQuerystring,
  IMessageQuerystringSchema,
  InstallCertificateRequest,
  InstallCertificateRequestSchema,
  Namespace,
  WebsocketServerConfig,
} from '@citrineos/base';
import jsrsasign from 'jsrsasign';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { ICertificatesModuleApi } from './interface';
import { CertificatesModule } from './module';
import crypto from 'crypto';
import {
  extractCertificateDetails,
  generateCertificate,
  generateCSR,
  WebsocketNetworkConnection,
} from '@citrineos/util';
import {
  Certificate,
  CountryNameEnumType,
  DeleteCertificateAttempt,
  GenerateCertificateChainRequest,
  GenerateCertificateChainSchema,
  InstallCertificateAttempt,
  InstalledCertificate,
  InstallRootCertificateRequest,
  InstallRootCertificateSchema,
  RegenerateExistingCertificate,
  RegenerateInstalledCertificateSchema,
  SignatureAlgorithmEnumType,
  TlsCertificateSchema,
  TlsCertificatesRequest,
  UpdateTlsCertificateQuerySchema,
  UpdateTlsCertificateQueryString,
  UploadExistingCertificate,
  UploadExistingCertificateSchema,
} from '@citrineos/data';
import fs from 'fs';
import moment from 'moment';

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
  async installCertificate(
    identifier: string,
    tenantId: string,
    request: InstallCertificateRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    const certificate = request.certificate;
    const hash = this.getCertificateHash(certificate);
    const existingPendingInstallCertificateAttempt =
      await this._module.installCertificateAttemptRepository.readOnlyOneByQuery(
        {
          where: {
            stationId: identifier,
            certificateType: request.certificateType,
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
        },
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
      let existingCertificate =
        await this._module.certificateRepository.readOnlyOneByQuery({
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
      installCertificateAttempt.stationId = identifier;
      installCertificateAttempt.certificateType =
        request.certificateType as unknown as GetCertificateIdUseEnumType;
      installCertificateAttempt.certificateId = existingCertificate.id;
      await installCertificateAttempt.save();
    }
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
  async deleteCertificate(
    identifier: string,
    tenantId: string,
    request: DeleteCertificateRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    const certificateHashData = request.certificateHashData;
    const existingPendingDeleteCertificateAttempt =
      await this._module.deleteCertificateAttemptRepository.readOnlyOneByQuery({
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
      deleteCertificateAttempt.hashAlgorithm =
        certificateHashData.hashAlgorithm;
      deleteCertificateAttempt.issuerNameHash =
        certificateHashData.issuerNameHash;
      deleteCertificateAttempt.issuerKeyHash =
        certificateHashData.issuerKeyHash;
      deleteCertificateAttempt.serialNumber = certificateHashData.serialNumber;
      await deleteCertificateAttempt.save();
    }
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
  ): Promise<IMessageConfirmation> {
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
    Namespace.UploadExistingCertificate,
    HttpMethod.Post,
    IMessageQuerystringSchema,
    UploadExistingCertificateSchema,
  )
  async uploadExistingCertificate(
    request: FastifyRequest<{
      Body: UploadExistingCertificate;
      Querystring: IMessageQuerystring;
    }>,
  ): Promise<InstalledCertificate> {
    const uploadExistingCertificate = request.body as UploadExistingCertificate;
    const messageQuerystring = request.query as IMessageQuerystring;
    this._logger.info(
      `Uploading existing ${uploadExistingCertificate.certificateType} certificate for charger ${messageQuerystring.identifier}`,
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

    let existingInstalledCertificate =
      await this._module.installedCertificateRepository.readOnlyOneByQuery({
        where: {
          stationId: messageQuerystring.identifier,
          certificateType: uploadExistingCertificate.certificateType,
        },
      });

    if (existingInstalledCertificate) {
      let existingCertificate: Certificate | undefined | null =
        await existingInstalledCertificate.$get('certificate');
      if (existingCertificate && existingCertificate.certificateFileId) {
        throw new Error(
          'Cannot upload exiting certificate because it already exists',
        );
      } else if (
        existingCertificate &&
        !existingCertificate.certificateFileId
      ) {
        // set file where previously undefined
        existingCertificate.certificateFileId =
          await this._fileAccess.uploadFile(
            `Existing_Key_${serialNumber}.pem`,
            Buffer.from(certificate),
            'filePath', // TODO: should we use the same folder?
          );
        await existingCertificate.save();
      } else {
        // check if certificate record exists but not tied to installed certificate
        existingCertificate =
          await this._module.certificateRepository.readOnlyOneByQuery({
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
        existingInstalledCertificate =
          await existingInstalledCertificate.save();
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
      existingInstalledCertificate.stationId = messageQuerystring.identifier;
      existingInstalledCertificate.certificateId = newCertificate.id;
      existingInstalledCertificate.certificateType =
        uploadExistingCertificate.certificateType;
      existingInstalledCertificate = await existingInstalledCertificate.save();
    }
    return existingInstalledCertificate;
  }

  /**
   * Endpoint to regenerate an existing certificate that is already installed on a given station.
   * Updates the InstalledCertificate record with the new certificate.
   *
   * @param request RegenerateInstalledCertificateSchema
   * @return Promise<InstalledCertificate> - the updated installed certificate record
   */
  @AsDataEndpoint(
    Namespace.RegenerateExistingCertificate,
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
    this._logger.info(
      `Regenerating existing certificate ${installedCertificateId} for charger ${stationId}`,
    );
    const existingInstalledCertificate =
      await this._module.installedCertificateRepository.readOnlyOneByQuery({
        where: {
          id: installedCertificateId,
          stationId: stationId,
        },
      });
    if (!existingInstalledCertificate) {
      throw new Error('Installed certificate not found');
    }
    const existingCertificateRecord =
      await existingInstalledCertificate.$get('certificate');
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
    const existingCertificateBuffer = await this._fileAccess.getFile(fileId);
    const existingPrivateKeyBuffer =
      await this._fileAccess.getFile(privateKeyFileId);
    const existingCertificateString = existingCertificateBuffer.toString();
    const existingPrivateKey = existingPrivateKeyBuffer.toString();
    const existingCertificate = new jsrsasign.X509();
    existingCertificate.readCertPEM(existingCertificateString);
    const existingSubjectString = existingCertificate.getSubjectString();
    let newCertificateRecord = new Certificate();
    newCertificateRecord.serialNumber = moment().valueOf();
    newCertificateRecord.issuerName = existingSubjectString;
    newCertificateRecord.organizationName =
      existingCertificateRecord.organizationName;
    newCertificateRecord.commonName = existingCertificateRecord.commonName;
    newCertificateRecord.keyLength = existingCertificateRecord.keyLength;
    newCertificateRecord.validBefore = validBeforeParam;
    newCertificateRecord.signatureAlgorithm =
      existingCertificateRecord.signatureAlgorithm;
    newCertificateRecord.countryName = existingCertificateRecord.countryName;
    newCertificateRecord.isCA = existingCertificateRecord.isCA;
    newCertificateRecord.pathLen = existingCertificateRecord.pathLen;
    newCertificateRecord.signedBy = existingCertificateRecord.id;
    newCertificateRecord.certificateFileHash =
      existingCertificateRecord.certificateFileHash;
    const [newCertificatePem, newPrivateKeyPem] = generateCertificate(
      newCertificateRecord,
      this._logger,
      existingPrivateKey,
      existingCertificateString,
    );
    newCertificateRecord.certificateFileHash =
      this.getCertificateHash(newCertificatePem);
    newCertificateRecord.certificateFileId = await this._fileAccess.uploadFile(
      `Regenerated_Cert_${newCertificateRecord.serialNumber}.pem`,
      Buffer.from(newCertificatePem),
    );
    newCertificateRecord.privateKeyFileId = await this._fileAccess.uploadFile(
      `Regenerated_Key_${newCertificateRecord.serialNumber}.pem`,
      Buffer.from(newPrivateKeyPem),
    );
    newCertificateRecord = await newCertificateRecord.save();
    existingInstalledCertificate.certificateId = newCertificateRecord.id;
    await existingInstalledCertificate.save();
    return existingInstalledCertificate;
  }

  private createNewCertificate = async (
    certificate: string,
    serialNumber: number | null,
    issuerName: string | null,
    organizationName: string | null,
    commonName: string | null,
    countryName: CountryNameEnumType | null,
    validBefore: Date | null,
    signatureAlgorithm: SignatureAlgorithmEnumType | null,
  ) => {
    const certificateHash = this.getCertificateHash(certificate);
    const newCertificate = new Certificate();
    newCertificate.serialNumber = serialNumber!;
    newCertificate.issuerName = issuerName!;
    newCertificate.organizationName = organizationName!;
    newCertificate.commonName = commonName!;
    newCertificate.countryName = countryName!;
    newCertificate.validBefore = validBefore?.toISOString()!;
    newCertificate.signatureAlgorithm = signatureAlgorithm!;
    newCertificate.certificateFileId = await this._fileAccess.uploadFile(
      `Existing_Cert_${serialNumber}.pem`,
      Buffer.from(certificate),
    );
    newCertificate.certificateFileHash = certificateHash;
    return await newCertificate.save();
  };

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
   * Generate a hash (fingerprint) from a certificate PEM string.
   * @param pemString The certificate PEM string.
   * @returns A SHA-256 hash of the certificate's DER encoding.
   */
  private getCertificateHash(pemString: string): string {
    try {
      const cert = new jsrsasign.X509();
      cert.readCertPEM(pemString);

      // Get the raw DER encoding of the certificate
      const derHex = cert.hex;
      const derBuffer = Buffer.from(derHex, 'hex');

      // Compute SHA-256 hash
      const hash = crypto.createHash('sha256').update(derBuffer).digest('hex');

      return hash;
    } catch (error) {
      console.error('Error generating certificate hash:', error);
      throw new Error('Invalid PEM format or unsupported certificate');
    }
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
    const certificateHash = this.getCertificateHash(certPem);
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
    certificateEntity.certificateFileHash = certificateHash;
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
