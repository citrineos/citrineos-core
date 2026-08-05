// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type IMessageQuerystring,
  type IEndpointDefinition,
  AbstractEndpoint,
  DEFAULT_TENANT_ID,
  IMessageQuerystringSchema,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { UploadExistingCertificate } from '@dal/interfaces/index.js';
import { UploadExistingCertificateSchema } from '@dal/interfaces/index.js';
import type { InstalledCertificate } from '@dal/layers/sequelize/index.js';
import type { InstallCertificateHelperService } from '@modules/Certificates/src/module/installCertificateHelperService.js';
import type { FastifyRequest } from 'fastify';

interface UploadExistingCertificateEndpointDependencies extends AbstractEndpointDependencies {
  installCertificateHelperService: InstallCertificateHelperService;
}

type UploadExistingCertificateEndpointRoute = {
  Body: UploadExistingCertificate;
  Querystring: IMessageQuerystring;
};

export class UploadExistingCertificateEndpoint extends AbstractEndpoint<UploadExistingCertificateEndpointRoute> {
  static readonly route: IEndpointDefinition = {
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
