/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { AbstractModuleApi, AsMessageEndpoint, CallAction, CertificateSignedRequest, CertificateSignedRequestSchema, DeleteCertificateRequest, DeleteCertificateRequestSchema, GetInstalledCertificateIdsRequest, GetInstalledCertificateIdsRequestSchema, IMessageConfirmation, InstallCertificateRequest, InstallCertificateRequestSchema, Namespace } from '@citrineos/base';
import { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { ICertificatesModuleApi } from './interface';
import { CertificatesModule } from './module';

/**
 * Server API for the Certificates module.
 */
export class CertificatesModuleApi extends AbstractModuleApi<CertificatesModule> implements ICertificatesModuleApi {

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