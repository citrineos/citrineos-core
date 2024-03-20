// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SystemConfig } from "@citrineos/base";
import { DirectusFlow, DirectusOperation, RestClient, createDirectus, createFlow, createOperation, readFlows, rest, updateFlow, updateOperation } from "@directus/sdk";
import { RouteOptions } from "fastify";
import { JSONSchemaFaker } from "json-schema-faker";
import { Logger, ILogObj } from "tslog";

interface Schema {
    // No custom collections needed
}

export class DirectusUtil {

    protected readonly _config: SystemConfig;
    protected readonly _logger: Logger<ILogObj>;
    private readonly client: RestClient<Schema>;

    constructor(config: SystemConfig, logger?: Logger<ILogObj>) {
        this._config = config;
        this._logger = logger ? logger.getSubLogger({ name: this.constructor.name }) : new Logger<ILogObj>({ name: this.constructor.name });
        this.client = createDirectus<Schema>(`http://${this._config.util.directus?.host}:${this._config.util.directus?.port}`).with(rest());
    }

    public addDirectusMessageApiFlowsFastifyRouteHook(routeOptions: RouteOptions) {
        if (routeOptions.url.split("/")[1] == "ocpp") { // Message API check
            // Parse action from url
            const lowercaseAction: string = routeOptions.url.split("/").pop() as string;
            const action = lowercaseAction.charAt(0).toUpperCase() + lowercaseAction.slice(1)
            // Parse message path from url
            const messagePath = "/" + routeOptions.url.split("/").slice(1).join("/");

            const bodySchema = routeOptions.schema!.body as object;
            this.addDirectusFlowForAction(action, messagePath, bodySchema);
        }
    }

    private async addDirectusFlowForAction(action: string, messagePath: string, bodySchema: object) {
        JSONSchemaFaker.option({ useExamplesValue: true, useDefaultValue: true, requiredOnly: true, pruneProperties: ["customData"] });
        const bodyData = JSONSchemaFaker.generate(bodySchema);
        const flowOptions = {
            collections: [
                "Locations"
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
                url: `{{$trigger.body.citrineUrl}}${messagePath}?identifier={{$last.station_id}}&tenantId={{$trigger.body.tenantId}}`,
                method: "POST",
                body: "{{$trigger.body.payload}}"
            }
        };

        const readOperation: Partial<DirectusOperation<Schema>> = {
            name: "Read Location Data",
            key: "location_read",
            type: "item-read",
            position_x: 20,
            position_y: 1,
            options: {
                collection: "Locations",
                key: "{{$last.body.keys[0]}}"
            }
        }

        const readFlowsResponse = await this.client.request(readFlows({ filter: { name: { _eq: action } }, fields: ["id", "name"] }));

        if (readFlowsResponse.length > 0) {
            this._logger.info("Flow already exists in Directus for ", action, ". Updating Flow.");
            const existingFlow = readFlowsResponse[0];
            this.updateMessageApiFlow(existingFlow.id, flow, notificationOperation, webhookOperation, readOperation);
        } else {
            this.createMessageApiFlow(flow, notificationOperation, webhookOperation, readOperation);
        }
        this._logger.info("Successfully created Directus Flow for ", action);
    }

    private async createMessageApiFlow(flow: Partial<DirectusFlow<Schema>>, notificationOperation: Partial<DirectusOperation<Schema>>, webhookOperation: Partial<DirectusOperation<Schema>>, readOperation: Partial<DirectusOperation<Schema>>): Promise<void> {
        // Create flow
        const flowCreationResponse = await this.client.request(createFlow(flow));

        // Create notification operation
        notificationOperation.flow = flowCreationResponse.id;
        const notificationOperationCreationResponse = await this.client.request(createOperation(notificationOperation));

        // Create webhook operation
        webhookOperation.flow = flowCreationResponse.id;
        webhookOperation.resolve = notificationOperationCreationResponse.id
        const webhookOperationCreationResponse = await this.client.request(createOperation(webhookOperation));

        // Create read operation
        readOperation.flow = flowCreationResponse.id;
        readOperation.resolve = webhookOperationCreationResponse.id;
        const readOperationCreationResponse = await this.client.request(createOperation(readOperation));

        // Update flow with operations
        this.client.request(updateFlow(flowCreationResponse.id, {
            operation: readOperationCreationResponse.id
        }));
    }

    private async updateMessageApiFlow(flowId: string, updatedFlow: Partial<DirectusFlow<Schema>>, notificationOperation: Partial<DirectusOperation<Schema>>, webhookOperation: Partial<DirectusOperation<Schema>>, readOperation: Partial<DirectusOperation<Schema>>): Promise<void> {
        // Update flow
        const flowUpdateResponse = await this.client.request(updateFlow(flowId, updatedFlow));

        // Update read operation
        const readOperationUpdateResponse = await this.client.request(updateOperation(flowUpdateResponse.operation as string, readOperation));

        // Update webhook operation
        const webhookOperationUpdateResponse = await this.client.request(updateOperation(readOperationUpdateResponse.resolve, webhookOperation));

        // Update notification operation
        this.client.request(updateOperation(webhookOperationUpdateResponse.resolve, notificationOperation));
    }
}