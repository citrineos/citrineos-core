// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractModuleApi, AsDataEndpoint, DEFAULT_TENANT_ID, type IFileStorage, type IMessageConfirmation, type IMessageQuerystring, IMessageQuerystringSchema, Namespace, OCPP1_6_Namespace, OCPP2_Namespace } from '@citrineos/base';
import { HttpMethod, OCPP2_0_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { Certificate, InstalledCertificate } from '@dal/layers/sequelize/index.js';
import {
  InstallRootCertificateRequest,
  InstallRootCertificateSchema,
  RegenerateExistingCertificate,
  RegenerateInstalledCertificateSchema,
  UploadExistingCertificate,
  UploadExistingCertificateSchema,
} from '@dal/interfaces/index.js';
import { generateCertificate } from '@util/index.js';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import jsrsasign from 'jsrsasign';
import moment from 'moment';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { ICertificatesModuleApi } from './interface.js';
import { CertificatesModule } from './module.js';

/**
 * Server API for the Certificates module.
 */
export class CertificatesDataApi
  extends AbstractModuleApi<CertificatesModule>
  implements ICertificatesModuleApi
{
  private readonly _fileStorage: IFileStorage;

  /**
   * Constructs a new instance of the class.
   *
   * @param {CertificatesModule} certificatesModule - The Certificates module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {IFileStorage} fileStorage - The fileStorage
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor({
    certificatesModule,
    server,
    fileStorage,
    logger,
  }: {
    certificatesModule: CertificatesModule;
    server: FastifyInstance;
    fileStorage: IFileStorage;
    logger?: Logger<ILogObj>;
  }) {
    super(certificatesModule, server, logger);
    this._fileStorage = fileStorage;
  }

  /**
   * Data Endpoint Methods
   */

  @AsDataEndpoint(
    OCPP2_Namespace.RootCertificate,
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
      `Installing ${installReq.certificateType} on charger ${installReq.ocppConnectionName}`,
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
        installReq.ocppConnectionName,
        installReq.tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP_CallAction.InstallCertificate,
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
    OCPP2_Namespace.UploadExistingCertificate,
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
      const promises: Promise<InstalledCertificate>[] = [];
      for (const identifierElement of identifier) {
        promises.push(
          this._module.installCertificateHelperService.handleUploadExistingCertificate(
            tenantId,
            identifierElement,
            uploadExistingCertificate,
            request.body.filePath,
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
          request.body.filePath,
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
    OCPP2_Namespace.RegenerateExistingCertificate,
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
    const ocppConnectionName = request.query.identifier;
    const tenantId = request.query.tenantId || DEFAULT_TENANT_ID;
    this._logger.info(
      `Regenerating existing certificate ${installedCertificateId} for charger ${ocppConnectionName}`,
    );
    const existingInstalledCertificate =
      await this._module.installedCertificateRepository.readOnlyOneByQuery(tenantId, {
        where: {
          id: installedCertificateId,
          ocppConnectionName: ocppConnectionName,
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
  protected _toDataPath(input: OCPP2_Namespace | OCPP1_6_Namespace | Namespace): string {
    const endpointPrefix = this._module.config.modules.certificates?.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
