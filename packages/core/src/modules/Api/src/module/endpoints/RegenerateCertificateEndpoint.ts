// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type IFileStorage,
  type IMessageQuerystring,
  type IEndpointDefinition,
  AbstractEndpoint,
  DEFAULT_TENANT_ID,
  IMessageQuerystringSchema,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { RegenerateExistingCertificate } from '@dal/interfaces/index.js';
import { RegenerateInstalledCertificateSchema } from '@dal/interfaces/index.js';
import type { IInstalledCertificateRepository } from '@dal/interfaces/repositories.js';
import { Certificate, InstalledCertificate } from '@dal/layers/sequelize/index.js';
import type { InstallCertificateHelperService } from '@modules/Certificates/src/module/installCertificateHelperService.js';
import { generateCertificate } from '@util/index.js';
import type { FastifyRequest } from 'fastify';
import jsrsasign from 'jsrsasign';
import moment from 'moment';

interface RegenerateCertificateEndpointDependencies extends AbstractEndpointDependencies {
  fileStorage: IFileStorage;
  installedCertificateRepository: IInstalledCertificateRepository;
  installCertificateHelperService: InstallCertificateHelperService;
}

type RegenerateCertificateEndpointRoute = {
  Body: RegenerateExistingCertificate;
  Querystring: IMessageQuerystring;
};

export class RegenerateCertificateEndpoint extends AbstractEndpoint<RegenerateCertificateEndpointRoute> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Post,
    path: '/regenerateCertificate',
    querySchema: IMessageQuerystringSchema,
    bodySchema: RegenerateInstalledCertificateSchema,
  };

  private readonly _fileStorage: IFileStorage;
  private readonly _installedCertificateRepository: IInstalledCertificateRepository;
  private readonly _installCertificateHelperService: InstallCertificateHelperService;

  constructor({
    logger,
    fileStorage,
    installedCertificateRepository,
    installCertificateHelperService,
  }: RegenerateCertificateEndpointDependencies) {
    super(logger);
    this._fileStorage = fileStorage;
    this._installedCertificateRepository = installedCertificateRepository;
    this._installCertificateHelperService = installCertificateHelperService;
  }

  async handle(
    request: FastifyRequest<RegenerateCertificateEndpointRoute>,
  ): Promise<InstalledCertificate> {
    const installedCertificateId = request.body.installedCertificateId;
    const validBeforeParam = request.body.validBefore;
    const ocppConnectionName = request.query.identifier;
    const tenantId = request.query.tenantId || DEFAULT_TENANT_ID;
    this._logger.info(
      `Regenerating existing certificate ${installedCertificateId} for charger ${ocppConnectionName}`,
    );
    const existingInstalledCertificate =
      await this._installedCertificateRepository.readOnlyOneByQuery(tenantId, {
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
      this._installCertificateHelperService.getCertificateHash(newCertificatePem);
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
}
