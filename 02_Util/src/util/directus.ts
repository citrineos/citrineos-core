// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IFileAccess, SystemConfig } from "@citrineos/base";
import { sequelize } from "@citrineos/data";
import { authentication, DirectusFlow, DirectusOperation, RestClient, createDirectus, createFlow, createOperation, readFlows, rest, staticToken, updateFlow, updateOperation, readAssetArrayBuffer } from "@directus/sdk";
import { RouteOptions } from "fastify";
import { JSONSchemaFaker } from "json-schema-faker";
import { Logger, ILogObj } from "tslog";

export interface Schema {
    // No custom collections needed
}

export class DirectusUtil implements IFileAccess {

    protected readonly _config: SystemConfig;
    protected readonly _logger: Logger<ILogObj>;
    private readonly _client: RestClient<Schema>;

    constructor(config: SystemConfig, logger?: Logger<ILogObj>) {
        this._config = config;
        this._logger = logger ? logger.getSubLogger({ name: this.constructor.name }) : new Logger<ILogObj>({ name: this.constructor.name });
        let client;
        if (this._config.util.directus?.token) { // Auth with static token
            client = createDirectus(`http://${this._config.util.directus?.host}:${this._config.util.directus?.port}`)
                .with(staticToken(this._config.util.directus?.token)).with(rest());
        } else if (this._config.util.directus?.username && this._config.util.directus?.password) { // Auth with username and password
            client = createDirectus<Schema>(`http://${this._config.util.directus?.host}:${this._config.util.directus?.port}`)
                .with(authentication()).with(rest());
            this._logger.info(`Logging into Directus as ${this._config.util.directus.username}`);
            client.login(this._config.util.directus.username, this._config.util.directus.password);
        } else { // No auth
            client = createDirectus<Schema>(`http://${this._config.util.directus?.host}:${this._config.util.directus?.port}`)
                .with(rest());
        }
        this._client = client;
    }

    public addDirectusMessageApiFlowsFastifyRouteHook(routeOptions: RouteOptions) {
        const messagePath = routeOptions.url // 'Url' here means the route specified when the endpoint was added to the fastify server, such as '/ocpp/configuration/reset'
        if (messagePath.split("/")[1] == "ocpp") { // Message API check: relies on implementation of _toMessagePath in AbstractModuleApi which prefixes url with '/ocpp/'
            this._logger.info(`Adding Directus Message API flow for ${messagePath}`);
            // Parse action from url: relies on implementation of _toMessagePath in AbstractModuleApi which puts CallAction in final path part
            const lowercaseAction: string = messagePath.split("/").pop() as string;
            const action = lowercaseAction.charAt(0).toUpperCase() + lowercaseAction.slice(1)
            // _addMessageRoute in AbstractModuleApi adds the bodySchema specified in the @MessageEndpoint decorator to the fastify route schema
            // These body schemas are the ones generated directly from the specification using the json-schema-processor in 00_Base
            const bodySchema = routeOptions.schema!.body as object;
            this.addDirectusFlowForAction(action, messagePath, bodySchema);
        }
    }

    public async getFile(id: string): Promise<Buffer> {
        this._logger.info(`Get file ${id}`);
        try {
            const result = await this._client.request(readAssetArrayBuffer(id));
            return Buffer.from(result);
        } catch (error) {
            this._logger.error('Get file failed: ', error);
            throw new Error(`Get file ${id} failed`)
        }
    }

    public async uploadFile(filePath: string, content: Buffer): Promise<string> {
        // TODO: implement the logic
        throw new Error("Not yet implemented.")
    }

    private async addDirectusFlowForAction(action: string, messagePath: string, bodySchema: object) {
        JSONSchemaFaker.option({ useExamplesValue: true, useDefaultValue: true, requiredOnly: true, pruneProperties: ["customData"] });
        const bodyData = JSONSchemaFaker.generate(bodySchema);
        const flowOptions = {
            collections: [
                sequelize.ChargingStation.getTableName()
            ],
            async: true,
            location: "item",
            requireConfirmation: true,
            confirmationDescription: "Are you sure you want to execute this flow?",
            fields: [
                {
                    field: "citrineUrl",
                    type: "string",
                    name: "CitrineOS URL",
                    meta: {
                        interface: "select-dropdown",
                        note: "The URL of the CitrineOS server. For example: http://localhost:8080/.",
                        width: "full",
                        required: true,
                        options: {
                            placeholder: "e.g. http://localhost:8080/",
                            trim: true,
                            iconLeft: "web_asset",
                            choices: [
                                {
                                    text: "Localhost (localhost:8080)",
                                    value: "http://localhost:8080"
                                },
                                {
                                    text: "Docker (citrine:8080)",
                                    value: "http://citrine:8080"
                                },
                                {
                                    text: "Docker Hybrid (host.docker.internal:8080)",
                                    value: "http://host.docker.internal:8080"
                                }
                            ],
                            allowOther: true
                        }
                    }
                },
                {
                    field: "tenantId",
                    type: "string",
                    name: "Tenant ID",
                    meta: {
                        interface: "select-dropdown",
                        note: "The tenant identifier of the charging station. To be removed in future releases.",
                        width: "full",
                        required: true,
                        options: {
                            placeholder: "e.g. T01",
                            trim: true,
                            choices: [
                                {
                                    text: "Default Tenant (T01)",
                                    value: "T01"
                                }
                            ],
                            allowOther: true
                        }
                    }
                },
                {
                    field: "payload",
                    type: "json",
                    name: "Payload",
                    meta: {
                        interface: "input-code",
                        note: "The payload to be sent in the call to CitrineOS.",
                        width: "full",
                        required: true,
                        options: {
                            lineWrapping: true,
                            language: "JSON",
                            template: JSON.stringify(bodyData, null, 2)
                        }
                    }
                }
            ]
        };

        const flow: Partial<DirectusFlow<Schema>> = {
            name: action,
            color: "#2ECDA7",
            description: action,
            status: "active",
            trigger: "manual",
            accountability: "all",
            options: flowOptions
        };

        const notificationOperation: Partial<DirectusOperation<Schema>> = {
            name: "Send Status Notification",
            key: "send_status_notification",
            type: "notification",
            position_x: 20,
            position_y: 17,
            options: {
                recipient: "{{$accountability.user}}",
                subject: `${action} - Success: {{$last.data.success}}`,
                message: "{{$last.data.payload}}"
            }
        };

        const webhookOperation: Partial<DirectusOperation<Schema>> = {
            name: "CitrineOS Webhook",
            key: "citrine_webhook",
            type: "request",
            position_x: 40,
            position_y: 1,
            options: {
                url: `{{$trigger.body.citrineUrl}}${messagePath}?identifier={{$last.id}}&tenantId={{$trigger.body.tenantId}}`,
                method: "POST",
                body: "{{$trigger.body.payload}}"
            }
        };

        const readOperation: Partial<DirectusOperation<Schema>> = {
            name: "Read Charging Station Data",
            key: "charging_station_read",
            type: "item-read",
            position_x: 20,
            position_y: 1,
            options: {
                collection: sequelize.ChargingStation.getTableName(),
                key: "{{$last.body.keys[0]}}"
            }
        }

        let errorLogVerb = "reading";
        try {
            const readFlowsResponse = await this._client.request(readFlows({ filter: { name: { _eq: action } }, fields: ["id", "name"] }));

            if (readFlowsResponse.length > 0) {
                errorLogVerb = "updating";
                this._logger.info("Flow already exists in Directus for ", action, ". Updating Flow.");
                
                const existingFlow = readFlowsResponse[0];
                this.updateMessageApiFlow(existingFlow.id, flow, notificationOperation, webhookOperation, readOperation);
                this._logger.info(`Successfully updated Directus Flow for ${action}`);
            } else {
                errorLogVerb = "creating";
                
                this.createMessageApiFlow(flow, notificationOperation, webhookOperation, readOperation);
                this._logger.info(`Successfully created Directus Flow for ${action}`);
            }
        } catch (error) {
            this._logger.error(`Error ${errorLogVerb} Directus Flow: ${JSON.stringify(error)}`);
        }
    }

    private async createMessageApiFlow(flow: Partial<DirectusFlow<Schema>>, notificationOperation: Partial<DirectusOperation<Schema>>, webhookOperation: Partial<DirectusOperation<Schema>>, readOperation: Partial<DirectusOperation<Schema>>): Promise<void> {
        // Create flow
        const flowCreationResponse = await this._client.request(createFlow(flow));

        // Create notification operation
        notificationOperation.flow = flowCreationResponse.id;
        const notificationOperationCreationResponse = await this._client.request(createOperation(notificationOperation));

        // Create webhook operation
        webhookOperation.flow = flowCreationResponse.id;
        webhookOperation.resolve = notificationOperationCreationResponse.id
        const webhookOperationCreationResponse = await this._client.request(createOperation(webhookOperation));

        // Create read operation
        readOperation.flow = flowCreationResponse.id;
        readOperation.resolve = webhookOperationCreationResponse.id;
        const readOperationCreationResponse = await this._client.request(createOperation(readOperation));

        // Update flow with operations
        this._client.request(updateFlow(flowCreationResponse.id, {
            operation: readOperationCreationResponse.id
        }));
    }

    private async updateMessageApiFlow(flowId: string, updatedFlow: Partial<DirectusFlow<Schema>>, notificationOperation: Partial<DirectusOperation<Schema>>, webhookOperation: Partial<DirectusOperation<Schema>>, readOperation: Partial<DirectusOperation<Schema>>): Promise<void> {
        // Update flow
        const flowUpdateResponse = await this._client.request(updateFlow(flowId, updatedFlow));

        // Update read operation
        const readOperationUpdateResponse = await this._client.request(updateOperation(flowUpdateResponse.operation as string, readOperation));

        // Update webhook operation
        const webhookOperationUpdateResponse = await this._client.request(updateOperation(readOperationUpdateResponse.resolve, webhookOperation));

        // Update notification operation
        this._client.request(updateOperation(webhookOperationUpdateResponse.resolve, notificationOperation));
    }
}