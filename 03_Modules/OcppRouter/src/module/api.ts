// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
    AbstractModuleApi,
    AsDataEndpoint,
    CallAction,
    HttpMethod,
    Namespace,
    WebsocketServerConfig
} from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IAdminApi } from './interface';
import { MessageRouterImpl } from './router';
import {
    ChargingStationKeyQuerystring,
    CsmsCertificateRequest, CsmsCertificateSchema,
    ModelKeyQuerystring,
    Subscription, UpdateCsmsCertificateQuerySchema, UpdateCsmsCertificateQueryString
} from '@citrineos/data';
import { WebsocketNetworkConnection } from "@citrineos/util";
import * as fs from "fs";

/**
 * Admin API for the OcppRouter.
 */
export class AdminApi extends AbstractModuleApi<MessageRouterImpl> implements IAdminApi {
    private _networkConnection: WebsocketNetworkConnection | undefined;
    private _websocketServersConfig: WebsocketServerConfig[] | undefined;

    /**
     * Constructs a new instance of the class.
     *
     * @param {MessageRouterImpl} ocppRouter - The OcppRouter module.
     * @param {FastifyInstance} server - The Fastify server instance.
     * @param {Logger<ILogObj>} [logger] - The logger instance.
     * @param {WebsocketNetworkConnection} networkConnection - The NetworkConnection
     * @param {WebsocketServerConfig[]} websocketServersConfig - Configuration for websocket servers
     */
    constructor(ocppRouter: MessageRouterImpl, server: FastifyInstance, logger?: Logger<ILogObj>, networkConnection?: WebsocketNetworkConnection, websocketServersConfig?: WebsocketServerConfig[]) {
        super(ocppRouter, server, logger);
        this._networkConnection = networkConnection;
        this._websocketServersConfig = websocketServersConfig;
    }

    /**
     * Data endpoints
     */

    // N.B.: When adding subscriptions, chargers may be connected to a different instance of Citrine.
    // If this is the case, new subscriptions will not take effect until the charger reconnects.
    /**
     * Creates a {@link Subscription}.
     * Will always create a new entity and return its id.
     *
     * @param {FastifyRequest<{ Body: Subscription }>} request - The request object, containing the body which is parsed as a {@link Subscription}.
     * @return {Promise<number>} The id of the created subscription.
     */
    @AsDataEndpoint(Namespace.Subscription, HttpMethod.Post)
    async postSubscription(request: FastifyRequest<{ Body: Subscription }>): Promise<number> {
        return this._module.subscriptionRepository.create(request.body as Subscription).then((subscription) => subscription?.id);
    }

    @AsDataEndpoint(Namespace.Subscription, HttpMethod.Get)
    async getSubscriptionsByChargingStation(request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>): Promise<Subscription[]> {
        return this._module.subscriptionRepository.readAllByStationId(request.query.stationId);
    }

    @AsDataEndpoint(Namespace.Subscription, HttpMethod.Delete)
    async deleteSubscriptionById(request: FastifyRequest<{ Querystring: ModelKeyQuerystring }>): Promise<boolean> {
        return this._module.subscriptionRepository.deleteByKey(request.query.id.toString()).then(() => true);
    }

    @AsDataEndpoint(Namespace.Certificate, HttpMethod.Put, UpdateCsmsCertificateQuerySchema, CsmsCertificateSchema)
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
            let decodedTlsKeys: string = this._decode(csmsCertificateRequest.privateKey);
            let decodedTlsCertificateChain: string = this._decode(csmsCertificateRequest.certificateChain);
            let decodedMtlsCertificateAuthorityRoots: string | undefined;

            let rollbackFiles: RollBackFile[] = [];

            try {
                rollbackFiles = this._replaceFile(serverConfig.tlsKeysFilepath, decodedTlsKeys, rollbackFiles);
                rollbackFiles = this._replaceFile(serverConfig.tlsCertificateChainFilepath, decodedTlsCertificateChain,
                    rollbackFiles);

                if (serverConfig.mtlsCertificateAuthorityRootsFilepath && csmsCertificateRequest.caCertificate) {
                    decodedMtlsCertificateAuthorityRoots = this._decode(csmsCertificateRequest.caCertificate);
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
        const endpointPrefix = '/ocpprouter';
        return super._toMessagePath(input, endpointPrefix);
    }

    /**
     * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
     *
     * @param {CallAction} input - The input {@link Namespace}.
     * @return {string} - The generated URL path.
     */
    protected _toDataPath(input: Namespace): string {
        const endpointPrefix = '/ocpprouter';
        return super._toDataPath(input, endpointPrefix);
    }
}

interface RollBackFile {
    oldFilePath: string;
    newFilePath: string;
}