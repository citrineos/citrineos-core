// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  type IFileStorage,
  type IMessageConfirmation,
  type IOcppSender,
  AbstractEndpoint,
} from '@citrineos/base';
import {
  EventGroup,
  HttpMethod,
  OCPP_CallAction,
  OCPP_2_VER_LIST,
  type OCPP2_request_types,
} from '@citrineos/types';
import type { ILocationRepository } from '@citrineos/dal';
import type { InstallRootCertificateRequest } from '@citrineos/dal';
import { InstallRootCertificateSchema } from '@citrineos/dal';
import { type CertificateAuthorityService } from '@services/index.js';
import { resolveStationProtocol } from '@util/index.js';
import type { FastifyRequest } from 'fastify';

interface InstallRootCertificateEndpointDependencies extends AbstractEndpointDependencies {
  fileStorage: IFileStorage;
  ocppSender: IOcppSender;
  certificateAuthorityService: CertificateAuthorityService;
  locationRepository: ILocationRepository;
}

type InstallRootCertificateRoute = { Body: InstallRootCertificateRequest };

export class InstallRootCertificateEndpoint extends AbstractEndpoint<InstallRootCertificateRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Put,
    path: '/installRootCertificate',
    bodySchema: InstallRootCertificateSchema,
  };

  private readonly _fileStorage: IFileStorage;
  private readonly _ocppSender: IOcppSender;
  private readonly _certificateAuthorityService: CertificateAuthorityService;
  private readonly _locationRepository: ILocationRepository;

  constructor({
    logger,
    fileStorage,
    ocppSender,
    certificateAuthorityService,
    locationRepository,
  }: InstallRootCertificateEndpointDependencies) {
    super(logger);
    this._fileStorage = fileStorage;
    this._ocppSender = ocppSender;
    this._certificateAuthorityService = certificateAuthorityService;
    this._locationRepository = locationRepository;
  }

  async handle(
    request: FastifyRequest<InstallRootCertificateRoute>,
  ): Promise<IMessageConfirmation> {
    const installReq = request.body;
    this._logger.info(
      `Installing ${installReq.certificateType} on charger ${installReq.ocppConnectionName}`,
    );

    const resolution = await resolveStationProtocol(
      this._locationRepository.readChargingStationByStationId,
      installReq.tenantId,
      installReq.ocppConnectionName,
      OCPP_2_VER_LIST,
    );
    if (!resolution.supported) {
      return { success: false, payload: resolution.reason };
    }

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
      protocol: resolution.protocol,
      action: OCPP_CallAction.InstallCertificate,
      eventGroup: EventGroup.Certificates,
      payload: {
        certificateType: installReq.certificateType,
        certificate: rootCAPem,
      } as OCPP2_request_types.InstallCertificateRequest,
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
