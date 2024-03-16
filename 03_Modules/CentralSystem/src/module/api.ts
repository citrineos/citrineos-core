// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AbstractModuleApi, AsMessageEndpoint, CallAction, CertificateSignedRequest, CertificateSignedRequestSchema, DeleteCertificateRequest, DeleteCertificateRequestSchema, GetInstalledCertificateIdsRequest, GetInstalledCertificateIdsRequestSchema, IMessageConfirmation, InstallCertificateRequest, InstallCertificateRequestSchema, Namespace } from '@citrineos/base';
import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IAdminApi } from './interface';
import { CentralSystem } from './CentralSystem';

/**
 * Server API for the Certificates module.
 */
export class AdminApi extends AbstractModuleApi<CentralSystem> implements IAdminApi {

    /**
     * Constructs a new instance of the class.
     *
     * @param {CertificatesModule} CertificatesModule - The Certificates module.
     * @param {FastifyInstance} server - The Fastify server instance.
     * @param {Logger<ILogObj>} [logger] - The logger instance.
     */
    constructor(CertificatesModule: CertificatesModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
        super(CertificatesModule, server, logger);
    }

    /**
   * Interface implementation
   */

    @AsMessageEndpoint(CallAction.CertificateSigned, CertificateSignedRequestSchema)
    certificateSigned(identifier: string, tenantId: string, request: CertificateSignedRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.CertificateSigned, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.InstallCertificate, InstallCertificateRequestSchema)
    installCertificate(identifier: string, tenantId: string, request: InstallCertificateRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.InstallCertificate, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.GetInstalledCertificateIds, GetInstalledCertificateIdsRequestSchema)
    getInstalledCertificateIds(identifier: string, tenantId: string, request: GetInstalledCertificateIdsRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.GetInstalledCertificateIds, request, callbackUrl);
    }

    @AsMessageEndpoint(CallAction.DeleteCertificate, DeleteCertificateRequestSchema)
    deleteCertificate(identifier: string, tenantId: string, request: DeleteCertificateRequest, callbackUrl?: string): Promise<IMessageConfirmation> {
        return this._module.sendCall(identifier, tenantId, CallAction.DeleteCertificate, request, callbackUrl);
    }

    /**
    * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
    *
    * @param {CallAction} input - The input {@link CallAction}.
    * @return {string} - The generated URL path.
    */
    protected _toMessagePath(input: CallAction): string {
        const endpointPrefix = this._module.config.modules.certificates?.endpointPrefix;
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = this._module.config.modules.certificates?.endpointPrefix;
        return super._toDataPath(input, endpointPrefix);
    }
}