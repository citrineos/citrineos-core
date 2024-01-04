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

import { ICache, ICentralSystem, IMessageHandler, IMessageSender, SystemConfig } from '@citrineos/base';
import { MemoryCache, RabbitMqReceiver, RabbitMqSender } from '@citrineos/util';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import Ajv from "ajv";
import addFormats from "ajv-formats"
import fastify, { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { systemConfig } from './config';
import { CentralSystemImpl } from './server/server';
import { initSwagger } from './util/swagger';

class CitrineOSServer {

    /**
     * Fields
     */
    private _config: SystemConfig;
    private _centralSystem: ICentralSystem;
    private _logger: Logger<ILogObj>;
    private _server: FastifyInstance;
    private _cache: ICache;
    private _ajv: Ajv;

    /**
     * Constructor for the class.
     *
     * @param {FastifyInstance} server - optional Fastify server instance
     * @param {Ajv} ajv - optional Ajv JSON schema validator instance
     */
    constructor(config: SystemConfig, server?: FastifyInstance, ajv?: Ajv, cache?: ICache) {

        // Set system config
        // TODO: Create and export config schemas for each util module, such as amqp, redis, kafka, etc, to avoid passing them possibly invalid configuration
        if (!config.util.messageBroker.amqp) {
            throw new Error("This server implementation requires amqp configuration for rabbitMQ.");
        }
        this._config = config;

        // Create server instance
        this._server = server || fastify().withTypeProvider<JsonSchemaToTsProvider>();

        // Add health check
        this._server.get('/health', async () => {
            return { status: 'healthy' };
        });

        // Create Ajv JSON schema validator instance
        this._ajv = ajv || new Ajv({ removeAdditional: "all", useDefaults: true, coerceTypes: "array", strict: false });
        addFormats(this._ajv, { mode: "fast", formats: ["date-time"] });

        // Initialize parent logger
        this._logger = new Logger<ILogObj>({
            name: "CitrineOS Logger",
            minLevel: systemConfig.server.logLevel,
            hideLogPositionForProduction: systemConfig.env === "production"
        });

        // Set cache implementation
        this._cache = cache || new MemoryCache();

        // Initialize Swagger if enabled
        if (this._config.server.swagger) {
            initSwagger(this._config, this._server);
        }

        // Register AJV for schema validation
        this._server.setValidatorCompiler(({ schema, method, url, httpPart }) => {
            return this._ajv.compile(schema);
        });

        this._centralSystem = new CentralSystemImpl(this._config, this._cache, undefined, undefined, this._logger, ajv);

        process.on('SIGINT', this.shutdown.bind(this));
        process.on('SIGTERM', this.shutdown.bind(this));
        process.on('SIGQUIT', this.shutdown.bind(this));
    }

    protected _createSender(): IMessageSender {
        return new RabbitMqSender(this._config, this._logger);
    }

    protected _createHandler(): IMessageHandler {
        return new RabbitMqReceiver(this._config, this._logger);
    }

    shutdown() {

        // Shut down central system
        this._centralSystem.shutdown();

        // Shutdown server
        this._server.close();

        setTimeout(() => {
            console.log("Exiting...");
            process.exit(1);
        }, 2000);
    }

    run(): Promise<void> {
        try {
            return this._server.listen({
                port: this._config.server.port,
                host: this._config.server.host
            }).then(address => {
                this._logger.info(`Server listening at ${address}`);
            }).catch(error => {
                this._logger.error(error);
                process.exit(1);
            });
            // TODO Push config to microservices
        } catch (error) {
            return Promise.reject(error);
        }
    }
}

new CitrineOSServer(systemConfig).run().catch(error => {
    console.error(error);
    process.exit(1);
});