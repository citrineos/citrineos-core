// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type IEndpointDefinition,
  type IFileStorage,
  type IMessageConfirmation,
  type IOcppSender,
  AbstractEndpoint,
} from '@citrineos/base';
import { EventGroup, HttpMethod, OCPP2_0_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { InstallRootCertificateRequest } from '@dal/interfaces/index.js';
import { InstallRootCertificateSchema } from '@dal/interfaces/index.js';
import type { CertificateAuthorityService } from '@util/index.js';
import type { FastifyRequest } from 'fastify';

interface InstallRootCertificateEndpointDependencies extends AbstractEndpointDependencies {
  fileStorage: IFileStorage;
  ocppSender: IOcppSender;
  certificateAuthorityService: CertificateAuthorityService;
}

type InstallRootCertificateRoute = { Body: InstallRootCertificateRequest };

export class InstallRootCertificateEndpoint extends AbstractEndpoint<InstallRootCertificateRoute> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Post,
    path: '/installRootCertificate',
    bodySchema: InstallRootCertificateSchema,
  };

  private readonly _fileStorage: IFileStorage;
  private readonly _ocppSender: IOcppSender;
  private readonly _certificateAuthorityService: CertificateAuthorityService;

  constructor({
    logger,
    fileStorage,
    ocppSender,
    certificateAuthorityService,
  }: InstallRootCertificateEndpointDependencies) {
    super(logger);
    this._fileStorage = fileStorage;
    this._ocppSender = ocppSender;
    this._certificateAuthorityService = certificateAuthorityService;
  }

  async handle(
    request: FastifyRequest<InstallRootCertificateRoute>,
  ): Promise<IMessageConfirmation> {
    const installReq = request.body;
    this._logger.info(
      `Installing ${installReq.certificateType} on charger ${installReq.ocppConnectionName}`,
    );

    let rootCAPem: string;
    if (installReq.fileId) {
      rootCAPem = (await this._fileStorage.getFile(installReq.fileId))!.toString();
    } else {
      rootCAPem = await this._certificateAuthorityService.getRootCACertificateFromExternalCA(
        installReq.certificateType,
      );
    }

    const confirmation = await this._ocppSender.sendCall({
      ocppConnectionName: installReq.ocppConnectionName,
      tenantId: installReq.tenantId,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.InstallCertificate,
      eventGroup: EventGroup.Api,
      payload: {
        certificateType: installReq.certificateType,
        certificate: rootCAPem,
      } as OCPP2_0_1.InstallCertificateRequest,
      callbackUrl: installReq.callbackUrl,
    });

    if (!confirmation.success) {
      throw new Error(`Send InstallCertificateRequest failed: ${confirmation.payload}`);
    }
    this._logger.debug('InstallCertificate confirmation sent:', confirmation);

    return {
      success: true,
      payload: `InstallCertificate accepted for delivery to ${installReq.ocppConnectionName}; the station's InstallCertificateResponse is handled asynchronously and is not reflected here`,
    };
  }
}
