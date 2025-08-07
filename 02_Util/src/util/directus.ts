// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { BootstrapConfig, ConfigStore, SystemConfig } from '@citrineos/base';
import { sequelize } from '@citrineos/data';
import {
  authentication,
  createDirectus,
  createFlow,
  createOperation,
  DirectusFlow,
  DirectusOperation,
  readAssetBlob,
  readFlows,
  rest,
  RestClient,
  staticToken,
  updateFlow,
  updateOperation,
  uploadFiles,
} from '@directus/sdk';
import { RouteOptions } from 'fastify';
import { JSONSchemaFaker } from 'json-schema-faker';
import { ILogObj, Logger } from 'tslog';

interface Schema {
  // No custom collections needed
}

export class DirectusUtil implements ConfigStore {
  protected readonly _logger: Logger<ILogObj>;
  private readonly _client: RestClient<Schema>;
  private readonly _configFileName: string;
  private readonly _configDir?: string;

  constructor(
    config: BootstrapConfig['fileAccess']['directus'],
    configFileName: string,
    configDir?: string,
    logger?: Logger<ILogObj>,
  ) {
    // config = config;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    let client;
    if (config!.token) {
      // Auth with static token
      client = createDirectus(`http://${config!.host}:${config!.port}`)
        .with(staticToken(config!.token))
        .with(rest());
    } else if (config!.username && config!.password) {
      // Auth with username and password
      client = createDirectus<Schema>(`http://${config!.host}:${config!.port}`)
        .with(authentication())
        .with(rest());
      this._logger.info(`Logging into Directus as ${config!.username}`);
      client
        .login(config!.username, config!.password)
        .then()
        .catch((error) => {
          this._logger.error('DirectusUtil could not perform client login', error);
        });
    } else {
      // No auth
      client = createDirectus<Schema>(`http://${config!.host}:${config!.port}`).with(rest());
    }
    this._client = client;
    this._configFileName = configFileName;
    this._configDir = configDir;
  }

  async fetchConfig(): Promise<SystemConfig | null> {
    const configString = await this.getFile(this._configFileName);
    if (!configString) return null;
    return JSON.parse(configString) as SystemConfig;
  }

  async saveConfig(config: SystemConfig): Promise<void> {
    try {
      const fileId = await this.saveFile(
        this._configFileName,
        Buffer.from(JSON.stringify(config, null, 2)),
        this._configDir,
      );
      this._logger.debug(`File saved: ${fileId}`);
    } catch (error) {
      this._logger.error(`Error saving file: ${error}`);
    }
  }

  public async addDirectusMessageApiFlowsFastifyRouteHook(
    routeOptions: RouteOptions,
    schemas: Record<string, unknown>,
  ) {
    const messagePath = routeOptions.url; // 'Url' here means the route specified when the endpoint was added to the fastify server, such as '/ocpp/configuration/reset'
    if (messagePath.split('/')[1] === 'ocpp') {
      // Message API check: relies on implementation of _toMessagePath in AbstractModuleApi which prefixes url with '/ocpp/'
      this._logger.info(`Adding Directus Message API flow for ${messagePath}`);
      // Parse action from url: relies on implementation of _toMessagePath in AbstractModuleApi which puts CallAction in final path part
      const lowercaseAction: string = messagePath.split('/').pop() as string;
      const action = lowercaseAction.charAt(0).toUpperCase() + lowercaseAction.slice(1);
      // _addMessageRoute in AbstractModuleApi adds the bodySchema specified in the @MessageEndpoint decorator to the fastify route schema
      // These body schemas are the ones generated directly from the specification using the json-schema-processor in 00_Base
      const bodySchema: any = routeOptions.schema?.body;
      if (bodySchema && bodySchema.$ref && schemas[bodySchema.$ref]) {
        await this.addDirectusFlowForAction(
          action,
          messagePath,
          schemas[bodySchema.$ref] as object,
        );
      }
    }
  }

  public async getFile(id: string): Promise<string | undefined> {
    try {
      const result = await this._client.request(readAssetBlob(id));
      return String(result.text());
    } catch (error) {
      this._logger.error(`Get file ${id} failed: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  public async saveFile(fileName: string, content: Buffer, filePath?: string): Promise<string> {
    let fileType: string | undefined;
    if (fileName.lastIndexOf('.') > -1 && fileName.lastIndexOf('.') < fileName.length - 1) {
      fileType = fileName.substring(fileName.lastIndexOf('.'));
    }
    const formData = new FormData();
    if (fileType) {
      formData.append('type', fileType);
    }
    if (filePath) {
      formData.append('folder', filePath);
    }
    formData.append('file', new Blob([new Uint8Array(content)]), fileName);
    try {
      const file = await this._client.request(uploadFiles(formData));
      return file['id'];
    } catch (error) {
      this._logger.error('Upload file failed: ', error);
      throw new Error(`Upload file ${fileName} failed.`);
    }
  }

  private async addDirectusFlowForAction(action: string, messagePath: string, bodySchema: object) {
    JSONSchemaFaker.option({
      useExamplesValue: true,
      useDefaultValue: true,
      requiredOnly: true,
      pruneProperties: ['customData'],
    });
    const bodyData = JSONSchemaFaker.generate(bodySchema);
    const flowOptions = {
      collections: [sequelize.ChargingStation.getTableName()],
      async: true,
      location: 'item',
      requireConfirmation: true,
      confirmationDescription: 'Are you sure you want to execute this flow?',
      fields: [
        {
          field: 'citrineUrl',
          type: 'string',
          name: 'CitrineOS URL',
          meta: {
            interface: 'select-dropdown',
            note: 'The URL of the CitrineOS server. For example: http://localhost:8080/.',
            width: 'full',
            required: true,
            options: {
              placeholder: 'e.g. http://localhost:8080/',
              trim: true,
              iconLeft: 'web_asset',
              choices: [
                {
                  text: 'Localhost (localhost:8080)',
                  value: 'http://localhost:8080',
                },
                {
                  text: 'Docker (citrine:8080)',
                  value: 'http://citrine:8080',
                },
                {
                  text: 'Docker Hybrid (host.docker.internal:8080)',
                  value: 'http://host.docker.internal:8080',
                },
              ],
              allowOther: true,
            },
          },
        },
        {
          field: 'tenantId',
          type: 'string',
          name: 'Tenant ID',
          meta: {
            interface: 'select-dropdown',
            note: 'The tenant identifier of the charging station. To be removed in future releases.',
            width: 'full',
            required: true,
            options: {
              placeholder: 'e.g. T01',
              trim: true,
              choices: [
                {
                  text: 'Default Tenant (T01)',
                  value: 'T01',
                },
              ],
              allowOther: true,
            },
          },
        },
        {
          field: 'payload',
          type: 'json',
          name: 'Payload',
          meta: {
            interface: 'input-code',
            note: 'The payload to be sent in the call to CitrineOS.',
            width: 'full',
            required: true,
            options: {
              lineWrapping: true,
              language: 'JSON',
              template: JSON.stringify(bodyData, null, 2),
            },
          },
        },
      ],
    };

    const flow: Partial<DirectusFlow<Schema>> = {
      name: action,
      color: '#2ECDA7',
      description: action,
      status: 'active',
      trigger: 'manual',
      accountability: 'all',
      options: flowOptions,
    };

    const notificationOperation: Partial<DirectusOperation<Schema>> = {
      name: 'Send Status Notification',
      key: 'send_status_notification',
      type: 'notification',
      position_x: 20,
      position_y: 17,
      options: {
        recipient: '{{$accountability.user}}',
        subject: `${action} - Success: {{$last.data.success}}`,
        message: '{{$last.data.payload}}',
      },
    };

    const webhookOperation: Partial<DirectusOperation<Schema>> = {
      name: 'CitrineOS Webhook',
      key: 'citrine_webhook',
      type: 'request',
      position_x: 40,
      position_y: 1,
      options: {
        url: `{{$trigger.body.citrineUrl}}${messagePath}?identifier={{$last.id}}&tenantId={{$trigger.body.tenantId}}`,
        method: 'POST',
        body: '{{$trigger.body.payload}}',
      },
    };

    const readOperation: Partial<DirectusOperation<Schema>> = {
      name: 'Read Charging Station  Data',
      key: 'charging_station_read',
      type: 'item-read',
      position_x: 20,
      position_y: 1,
      options: {
        collection: sequelize.ChargingStation.getTableName(),
        key: '{{$last.body.keys[0]}}',
      },
    };

    let errorLogVerb = 'reading';
    try {
      const readFlowsResponse = await this._client.request(
        readFlows({
          filter: { name: { _eq: action } },
          fields: ['id', 'name'],
        }),
      );

      if (readFlowsResponse.length > 0) {
        errorLogVerb = 'updating';
        this._logger.info('Flow already exists in Directus for ', action, '. Updating Flow.');

        const existingFlow = readFlowsResponse[0];
        await this.updateMessageApiFlow(
          existingFlow.id,
          flow,
          notificationOperation,
          webhookOperation,
          readOperation,
        );
        this._logger.info(`Successfully updated Directus Flow for ${action}`);
      } else {
        errorLogVerb = 'creating';

        await this.createMessageApiFlow(
          flow,
          notificationOperation,
          webhookOperation,
          readOperation,
        );
        this._logger.info(`Successfully created Directus Flow for ${action}`);
      }
    } catch (error) {
      this._logger.error(`Error ${errorLogVerb} Directus Flow: ${JSON.stringify(error)}`);
    }
  }

  private async createMessageApiFlow(
    flow: Partial<DirectusFlow<Schema>>,
    notificationOperation: Partial<DirectusOperation<Schema>>,
    webhookOperation: Partial<DirectusOperation<Schema>>,
    readOperation: Partial<DirectusOperation<Schema>>,
  ): Promise<void> {
    // Create flow
    const flowCreationResponse = await this._client.request(createFlow(flow));

    // Create notification operation
    notificationOperation.flow = flowCreationResponse.id;
    const notificationOperationCreationResponse = await this._client.request(
      createOperation(notificationOperation),
    );

    // Create webhook operation
    webhookOperation.flow = flowCreationResponse.id;
    webhookOperation.resolve = notificationOperationCreationResponse.id;
    const webhookOperationCreationResponse = await this._client.request(
      createOperation(webhookOperation),
    );

    // Create read operation
    readOperation.flow = flowCreationResponse.id;
    readOperation.resolve = webhookOperationCreationResponse.id;
    const readOperationCreationResponse = await this._client.request(
      createOperation(readOperation),
    );

    // Update flow with operations
    await this._client.request(
      updateFlow(flowCreationResponse.id, {
        operation: readOperationCreationResponse.id,
      }),
    );
  }

  private async updateMessageApiFlow(
    flowId: string,
    updatedFlow: Partial<DirectusFlow<Schema>>,
    notificationOperation: Partial<DirectusOperation<Schema>>,
    webhookOperation: Partial<DirectusOperation<Schema>>,
    readOperation: Partial<DirectusOperation<Schema>>,
  ): Promise<void> {
    // Update flow
    const flowUpdateResponse = await this._client.request(updateFlow(flowId, updatedFlow));

    // Update read operation
    const readOperationUpdateResponse = await this._client.request(
      updateOperation(flowUpdateResponse.operation as string, readOperation),
    );

    // Update webhook operation
    const webhookOperationUpdateResponse = await this._client.request(
      updateOperation(readOperationUpdateResponse.resolve, webhookOperation),
    );

    // Update notification operation
    await this._client.request(
      updateOperation(webhookOperationUpdateResponse.resolve, notificationOperation),
    );
  }
}
