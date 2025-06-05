// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModuleApi,
  AsMessageEndpoint,
  CallAction,
  DEFAULT_TENANT_ID,
  IMessageConfirmation,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { ICertificatesModuleApi } from '../interface';
import { CertificatesModule } from '../module';

/**
 * Server API for the Certificates module.
 */
export class CertificatesOcpp201Api
  extends AbstractModuleApi<CertificatesModule>
  implements ICertificatesModuleApi
{
  /**
   * Constructs a new instance of the class.
   *
   * @param {CertificatesModule} certificatesModule - The Certificates module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor(
    certificatesModule: CertificatesModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(certificatesModule, server, OCPPVersion.OCPP2_0_1, logger);
  }

  /**
   * Interface implementation
   */

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.CertificateSigned,
    OCPP2_0_1.CertificateSignedRequestSchema,
  )
  certificateSigned(
    identifier: string[],
    request: OCPP2_0_1.CertificateSignedRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.CertificateSigned,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.InstallCertificate,
    OCPP2_0_1.InstallCertificateRequestSchema,
  )
  installCertificate(
    identifier: string[],
    request: OCPP2_0_1.InstallCertificateRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.InstallCertificate,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetInstalledCertificateIds,
    OCPP2_0_1.GetInstalledCertificateIdsRequestSchema,
  )
  getInstalledCertificateIds(
    identifier: string[],
    request: OCPP2_0_1.GetInstalledCertificateIdsRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetInstalledCertificateIds,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.DeleteCertificate,
    OCPP2_0_1.DeleteCertificateRequestSchema,
  )
  deleteCertificate(
    identifier: string[],
    request: OCPP2_0_1.DeleteCertificateRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.DeleteCertificate,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = this._module.config.modules.certificates?.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }
}
