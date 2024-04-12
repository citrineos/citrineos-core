// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
    AbstractModuleApi, AsDataEndpoint,
    AsMessageEndpoint,
    CallAction,
    CertificateSignedRequest,
    CertificateSignedRequestSchema,
    DeleteCertificateRequest,
    DeleteCertificateRequestSchema,
    GetInstalledCertificateIdsRequest,
    GetInstalledCertificateIdsRequestSchema, HttpMethod,
    IMessageConfirmation,
    InstallCertificateRequest,
    InstallCertificateRequestSchema,
    Namespace,
    WebsocketServerConfig
} from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { ICertificatesModuleApi } from './interface';
import { CertificatesModule } from './module';
import {WebsocketNetworkConnection} from "@citrineos/util";
import {
    CsmsCertificateRequest,
    CsmsCertificateSchema,
    UpdateCsmsCertificateQuerySchema,
    UpdateCsmsCertificateQueryString
} from "@citrineos/data";
import fs from "fs";

/**
 * Server API for the Certificates module.
 */
export class CertificatesModuleApi extends AbstractModuleApi<CertificatesModule> implements ICertificatesModuleApi {
    private _networkConnection: WebsocketNetworkConnection | undefined;
    private _websocketServersConfig: WebsocketServerConfig[] | undefined;

    /**
     * Constructs a new instance of the class.
     *
     * @param {CertificatesModule} CertificatesModule - The Certificates module.
     * @param {FastifyInstance} server - The Fastify server instance.
     * @param {Logger<ILogObj>} [logger] - The logger instance.
     * @param {WebsocketNetworkConnection} networkConnection - The NetworkConnection
     * @param {WebsocketServerConfig[]} websocketServersConfig - Configuration for websocket servers
     */
    constructor(CertificatesModule: CertificatesModule, server: FastifyInstance, logger?: Logger<ILogObj>,
                networkConnection?: WebsocketNetworkConnection, websocketServersConfig?: WebsocketServerConfig[]) {
        super(CertificatesModule, server, logger);
        this._networkConnection = networkConnection;
        this._websocketServersConfig = websocketServersConfig;
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
     * Data Endpoint Methods
     */

    @AsDataEndpoint(Namespace.CsmsCertificate, HttpMethod.Put, UpdateCsmsCertificateQuerySchema, CsmsCertificateSchema)
    async putCsmsCertificate(request: FastifyRequest<{
        Body: CsmsCertificateRequest,
        Querystring: UpdateCsmsCertificateQueryString
    }>): Promise<void> {
        const serverId = request.query.id as string;
        this._logger.info(`Receive update CSMS certificate request for server ${serverId}`)

        const csmsCertificateRequest = request.body as CsmsCertificateRequest;
        const serverConfig: WebsocketServerConfig | undefined = this._websocketServersConfig ?
            this._websocketServersConfig.find(config => config.id === serverId) : undefined;

        // Expect the server configuration existed and valid based on the given server id
        if (!serverConfig) {
            throw new Error(`websocketServer id ${serverId} does not exist.`)
        } else if (serverConfig && (serverConfig.securityProfile < 2)) {
            throw new Error(`websocketServer ${serverId} is not tls or mtls server.`)
        }

        if (serverConfig.tlsKeysFilepath && serverConfig.tlsCertificateChainFilepath) {
            let decodedTlsKeys: string = this._decode(csmsCertificateRequest.privateKeys);
            let decodedTlsCertificateChain: string = this._decode(csmsCertificateRequest.certificateChain);
            let decodedMtlsCertificateAuthorityRoots: string | undefined;

            let rollbackFiles: RollBackFile[] = [];

            try {
                rollbackFiles = this._replaceFile(serverConfig.tlsKeysFilepath, decodedTlsKeys, rollbackFiles);
                rollbackFiles = this._replaceFile(serverConfig.tlsCertificateChainFilepath, decodedTlsCertificateChain,
                    rollbackFiles);

                if (serverConfig.mtlsCertificateAuthorityRootsFilepath && csmsCertificateRequest.caCertificateRoots) {
                    decodedMtlsCertificateAuthorityRoots = this._decode(csmsCertificateRequest.caCertificateRoots);
                    rollbackFiles = this._replaceFile(serverConfig.mtlsCertificateAuthorityRootsFilepath,
                        decodedMtlsCertificateAuthorityRoots, rollbackFiles);
                }

                this._networkConnection?.updateCertificate(serverId, decodedTlsKeys, decodedTlsCertificateChain,
                    decodedMtlsCertificateAuthorityRoots);

                this._logger.info(`Updated CSMS certificate for server ${serverId} successfully.`)
            } catch (error) {
                this._logger.error(`Failed to update certificate for server ${serverId}: `, error);

                this._logger.info('Performing rollback...');
                for (const {oldFilePath, newFilePath} of rollbackFiles) {
                    fs.renameSync(newFilePath, oldFilePath);
                    this._logger.info(`Rolled back ${newFilePath} to ${oldFilePath}`);
                }

                throw new Error(`Update CSMS certificate for server ${serverId} failed: ${error}`);
            }
        }
    }

    private _decode(content: string): string {
        return Buffer.from(content, 'base64').toString('binary');
    }

    private _replaceFile(targetFilePath: string, newContent: string, rollbackFiles: RollBackFile[]): RollBackFile[] {
        // Back up old file
        fs.renameSync(targetFilePath, targetFilePath.concat('.backup'));
        rollbackFiles.push({oldFilePath: targetFilePath, newFilePath: targetFilePath.concat('.backup')})

        // Write new content using target path
        fs.writeFileSync(targetFilePath, newContent);

        return rollbackFiles;
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

interface RollBackFile {
    oldFilePath: string;
    newFilePath: string;
}