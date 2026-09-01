// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type IFileStorage,
  type IMessageQuerystring,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
  DEFAULT_TENANT_ID,
  IMessageQuerystringSchema,
} from '@citrineos/base';
import { type CertificateCreate, type InstalledCertificateDto, HttpMethod } from '@citrineos/types';
import type { RegenerateExistingCertificate } from '@citrineos/dal';
import { RegenerateInstalledCertificateSchema } from '@citrineos/dal';
import type { ICertificateRepository, IInstalledCertificateRepository } from '@citrineos/dal';
import type { InstallCertificateHelperService } from '@/services/certificate/installCertificateHelperService.js';
import { generateCertificate } from '@/services/index.js';
import type { FastifyRequest } from 'fastify';
import jsrsasign from 'jsrsasign';
import moment from 'moment';

interface RegenerateCertificateEndpointDependencies extends AbstractEndpointDependencies {
  fileStorage: IFileStorage;
  certificateRepository: ICertificateRepository;
  installedCertificateRepository: IInstalledCertificateRepository;
  installCertificateHelperService: InstallCertificateHelperService;
}

type RegenerateCertificateEndpointRoute = {
  Body: RegenerateExistingCertificate;
  Querystring: IMessageQuerystring;
};

export class RegenerateCertificateEndpoint extends AbstractEndpoint<RegenerateCertificateEndpointRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Post,
    path: '/regenerateCertificate',
    querySchema: IMessageQuerystringSchema,
    bodySchema: RegenerateInstalledCertificateSchema,
  };

  private readonly _fileStorage: IFileStorage;
  private readonly _certificateRepository: ICertificateRepository;
  private readonly _installedCertificateRepository: IInstalledCertificateRepository;
  private readonly _installCertificateHelperService: InstallCertificateHelperService;

  constructor({
    logger,
    fileStorage,
    certificateRepository,
    installedCertificateRepository,
    installCertificateHelperService,
  }: RegenerateCertificateEndpointDependencies) {
    super(logger);
    this._fileStorage = fileStorage;
    this._certificateRepository = certificateRepository;
    this._installedCertificateRepository = installedCertificateRepository;
    this._installCertificateHelperService = installCertificateHelperService;
  }

  async handle(
    request: FastifyRequest<RegenerateCertificateEndpointRoute>,
  ): Promise<InstalledCertificateDto> {
    const installedCertificateId = request.body.installedCertificateId;
    const validBeforeParam = request.body.validBefore;
    const ocppConnectionName = Array.isArray(request.query.identifier)
      ? request.query.identifier[0]
      : request.query.identifier;
    const tenantId = request.query.tenantId || DEFAULT_TENANT_ID;
    this._logger.info(
      `Regenerating existing certificate ${installedCertificateId} for charger ${ocppConnectionName}`,
    );
    const existingInstalledCertificate =
      await this._installedCertificateRepository.findByIdAndStation(
        tenantId,
        installedCertificateId,
        ocppConnectionName,
      );
    if (!existingInstalledCertificate) {
      throw new Error('Installed certificate not found');
    }
    const existingCertificateRecord =
      await this._installedCertificateRepository.getLinkedCertificate(
        tenantId,
        existingInstalledCertificate.id!,
      );
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
    const newCertificateRecord: CertificateCreate = {
      tenantId,
      serialNumber: moment().valueOf(),
      issuerName: existingSubjectString,
      organizationName: existingCertificateRecord.organizationName,
      commonName: existingCertificateRecord.commonName,
      keyLength: existingCertificateRecord.keyLength,
      validBefore: validBeforeParam,
      signatureAlgorithm: existingCertificateRecord.signatureAlgorithm,
      countryName: existingCertificateRecord.countryName,
      isCA: existingCertificateRecord.isCA,
      pathLen: existingCertificateRecord.pathLen,
      signedBy: existingCertificateRecord.id,
      certificateFileHash: existingCertificateRecord.certificateFileHash,
    };
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
    const savedCertificate = await this._certificateRepository.createCertificate(
      tenantId,
      newCertificateRecord,
    );
    return (
      (await this._installedCertificateRepository.setCertificateId(
        tenantId,
        existingInstalledCertificate.id!,
        savedCertificate.id!,
      )) ?? existingInstalledCertificate
    );
  }
}
