// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractMessageEndpointDependencies,
  type IMessageConfirmation,
  type IMessageEndpointMetadata,
  type IOcppSender,
  AbstractMessageEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import {
  EventGroup,
  OCPP_CallAction,
  type OCPPVersion,
  type OCPP2_request_types,
} from '@citrineos/types';
import type { InstallCertificateHelperService } from '@modules/Certificates/installCertificateHelperService.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  installCertificateHelperService: InstallCertificateHelperService;
}

export class DeleteCertificateEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.DeleteCertificate,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Certificates,
    bodySchema: ocpp2Schema('DeleteCertificateRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _installCertificateHelperService: InstallCertificateHelperService;

  constructor({ logger, ocppSender, installCertificateHelperService }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._installCertificateHelperService = installCertificateHelperService;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.DeleteCertificateRequest,
    callbackUrl: string | undefined,
    tenantId: number | undefined,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const resolvedTenantId = tenantId ?? DEFAULT_TENANT_ID;

    return Promise.all(
      identifiers.map(async (ocppConnectionName) => {
        await this._installCertificateHelperService.prepareToDeleteCertificate(
          resolvedTenantId,
          ocppConnectionName,
          request.certificateHashData,
        );
        return this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId: resolvedTenantId,
          protocol: version,
          action: OCPP_CallAction.DeleteCertificate,
          eventGroup: EventGroup.Certificates,
          payload: request,
          callbackUrl,
        });
      }),
    );
  }
}
