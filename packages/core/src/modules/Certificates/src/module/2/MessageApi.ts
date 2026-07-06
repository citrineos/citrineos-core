// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { CallAction, IMessageConfirmation, OCPP2_request_types } from '@citrineos/base';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  DEFAULT_TENANT_ID,
  getOcpp2Schema,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { DeleteCertificateAttempt } from '@dal/index.js';
import { packageGroupCall } from '@util/index.js';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { ICertificatesModuleApi } from '../interface.js';
import { CertificatesModule } from '../module.js';

/**
 * Server API for the Certificates module.
 */

const DEFAULT_VERSION = OCPPVersion.OCPP2_0_1;

export class CertificatesOcpp2Api
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
  constructor({
    certificatesModule,
    server,
    logger,
  }: {
    certificatesModule: CertificatesModule;
    server: FastifyInstance;
    logger?: Logger<ILogObj>;
  }) {
    super(certificatesModule, server, logger);
  }

  /**
   * This API serves both OCPP 2.0.1 and 2.1 from a single instance; each
   * message endpoint is registered once per version with the version threaded
   * into schema selection, the route path, and the handler.
   */
  protected get supportedVersions(): OCPPVersion[] {
    return [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1];
  }

  /**
   * Interface implementation
   */

  @AsMessageEndpoint(
    OCPP_CallAction.CertificateSigned,
    (_instance: CertificatesOcpp2Api, version) =>
      getOcpp2Schema(
        (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
        'CertificateSignedRequestSchema',
      ),
  )
  certificateSigned(
    identifier: string[],
    request: OCPP2_request_types.CertificateSignedRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.CertificateSigned,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP_CallAction.InstallCertificate,
    (_instance: CertificatesOcpp2Api, version) =>
      getOcpp2Schema(
        (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
        'InstallCertificateRequestSchema',
      ),
  )
  installCertificate(
    identifier: string[],
    request: OCPP2_request_types.InstallCertificateRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map(async (ocppConnectionName) => {
      await this._module.installCertificateHelperService.prepareToInstallCertificate(
        tenantId,
        ocppConnectionName,
        request.certificate,
        request.certificateType,
      );
      return this._module.sendCall(
        ocppConnectionName,
        tenantId,
        version,
        OCPP_CallAction.InstallCertificate,
        request,
        callbackUrl,
      );
    });
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP_CallAction.GetInstalledCertificateIds,
    (_instance: CertificatesOcpp2Api, version) =>
      getOcpp2Schema(
        (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
        'GetInstalledCertificateIdsRequestSchema',
      ),
  )
  getInstalledCertificateIds(
    identifier: string[],
    request: OCPP2_request_types.GetInstalledCertificateIdsRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.GetInstalledCertificateIds,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP_CallAction.DeleteCertificate,
    (_instance: CertificatesOcpp2Api, version) =>
      getOcpp2Schema(
        (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
        'DeleteCertificateRequestSchema',
      ),
  )
  deleteCertificate(
    identifier: string[],
    request: OCPP2_request_types.DeleteCertificateRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map(async (ocppConnectionName) => {
      const certificateHashData = request.certificateHashData;
      const existingPendingDeleteCertificateAttempt =
        await this._module.deleteCertificateAttemptRepository.readOnlyOneByQuery(tenantId, {
          where: {
            ocppConnectionName,
            hashAlgorithm: certificateHashData.hashAlgorithm,
            issuerNameHash: certificateHashData.issuerNameHash,
            issuerKeyHash: certificateHashData.issuerKeyHash,
            serialNumber: certificateHashData.serialNumber,
            status: null,
          },
        });
      if (!existingPendingDeleteCertificateAttempt) {
        const deleteCertificateAttempt = new DeleteCertificateAttempt();
        deleteCertificateAttempt.ocppConnectionName = ocppConnectionName;
        deleteCertificateAttempt.hashAlgorithm = certificateHashData.hashAlgorithm;
        deleteCertificateAttempt.issuerNameHash = certificateHashData.issuerNameHash;
        deleteCertificateAttempt.issuerKeyHash = certificateHashData.issuerKeyHash;
        deleteCertificateAttempt.serialNumber = certificateHashData.serialNumber;
        await deleteCertificateAttempt.save();
      }
      return this._module.sendCall(
        ocppConnectionName,
        tenantId,
        version,
        OCPP_CallAction.DeleteCertificate,
        request,
        callbackUrl,
      );
    });
    return Promise.all(results);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction, version?: OCPPVersion | null): string {
    const endpointPrefix = this._module.config.modules.certificates?.endpointPrefix;
    return super._toMessagePath(input, version, endpointPrefix);
  }
}
