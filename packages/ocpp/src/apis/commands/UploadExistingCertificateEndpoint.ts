// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type IMessageQuerystring,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
  DEFAULT_TENANT_ID,
  IMessageQuerystringSchema,
} from '@citrineos/base';
import { type InstalledCertificateDto, HttpMethod } from '@citrineos/types';
import type { UploadExistingCertificate } from '@citrineos/dal';
import { UploadExistingCertificateSchema } from '@citrineos/dal';
import type { InstallCertificateHelperService } from '@/services/certificate/installCertificateHelperService.js';
import type { FastifyRequest } from 'fastify';

interface UploadExistingCertificateEndpointDependencies extends AbstractEndpointDependencies {
  installCertificateHelperService: InstallCertificateHelperService;
}

type UploadExistingCertificateEndpointRoute = {
  Body: UploadExistingCertificate;
  Querystring: IMessageQuerystring;
};

export class UploadExistingCertificateEndpoint extends AbstractEndpoint<UploadExistingCertificateEndpointRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Post,
    path: '/uploadExistingCertificate',
    querySchema: IMessageQuerystringSchema,
    bodySchema: UploadExistingCertificateSchema,
  };

  private readonly _installCertificateHelperService: InstallCertificateHelperService;

  constructor({
    logger,
    installCertificateHelperService,
  }: UploadExistingCertificateEndpointDependencies) {
    super(logger);
    this._installCertificateHelperService = installCertificateHelperService;
  }

  async handle(
    request: FastifyRequest<UploadExistingCertificateEndpointRoute>,
  ): Promise<InstalledCertificateDto[]> {
    const uploadExistingCertificate = request.body as UploadExistingCertificate;
    const messageQuerystring = request.query as IMessageQuerystring;
    const tenantId = messageQuerystring.tenantId || DEFAULT_TENANT_ID;
    const identifier = messageQuerystring.identifier;
    const isIdentifierList = Array.isArray(identifier);
    if (isIdentifierList) {
      const promises: Promise<InstalledCertificateDto>[] = [];
      for (const identifierElement of identifier) {
        promises.push(
          this._installCertificateHelperService.handleUploadExistingCertificate(
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
        await this._installCertificateHelperService.handleUploadExistingCertificate(
          tenantId,
          identifier,
          uploadExistingCertificate,
          request.body.filePath,
        ),
      ];
    }
  }
}
