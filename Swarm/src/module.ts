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

import { EventGroup, ICache, IMessageHandler, IMessageSender, IModule, IModuleApi, SystemConfig } from '@citrineos/base';
import { MonitoringModule, MonitoringModuleApi } from '@citrineos/monitoring';
import { MemoryCache, RabbitMqReceiver, RabbitMqSender } from '@citrineos/util';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import fastify, { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { systemConfig, eventGroup } from './config';
import { initSwagger } from './util/swagger';
import { ConfigurationModule, ConfigurationModuleApi } from '@citrineos/configuration';
import { TransactionsModule, TransactionsModuleApi } from '@citrineos/transactions';
import { CertificatesModule, CertificatesModuleApi } from '@citrineos/certificates';
import { EVDriverModule, EVDriverModuleApi } from '@citrineos/evdriver';
import { ReportingModule, ReportingModuleApi } from '@citrineos/reporting';
import { SmartChargingModule, SmartChargingModuleApi } from '@citrineos/smartcharging';

class ModuleService {

    /**
     * Fields
     */
    private _config: SystemConfig;
    private _module: IModule;
    private _api: IModuleApi;
    private _logger: Logger<ILogObj>;
    private _server: FastifyInstance;
    private _cache: ICache;
    private _host: string;
    private _port: number;

    /**
     * Constructor for the class.
     *
     * @param {FastifyInstance} server - optional Fastify server instance
     * @param {Ajv} ajv - optional Ajv JSON schema validator instance
     */
    constructor(config: SystemConfig, eventGroup: EventGroup, server?: FastifyInstance, cache?: ICache) {

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


        // Initialize module & API
        // Always initialize API after SwaggerUI
        switch (eventGroup) {
            case EventGroup.Certificates:
                if (this._config.modules.certificates) {
                    this._module = new CertificatesModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
                    this._api = new CertificatesModuleApi(this._module as CertificatesModule, this._server, this._logger);
                    // TODO: take actions to make sure module has correct subscriptions and log proof
                    this._logger.info("Certificates module started...");
                    this._host = this._config.modules.certificates.host;
                    this._port = this._config.modules.certificates.port;
                    break;
                } else throw new Error("No config for Certificates module");
            case EventGroup.Configuration:
                if (this._config.modules.configuration) {
                    this._module = new ConfigurationModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
                    this._api = new ConfigurationModuleApi(this._module as ConfigurationModule, this._server, this._logger);
                    // TODO: take actions to make sure module has correct subscriptions and log proof
                    this._logger.info("Configuration module started...");
                    this._host = this._config.modules.configuration.host;
                    this._port = this._config.modules.configuration.port;
                    break;
                } else throw new Error("No config for Configuration module");
            case EventGroup.EVDriver:
                if (this._config.modules.evdriver) {
                    this._module = new EVDriverModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
                    this._api = new EVDriverModuleApi(this._module as EVDriverModule, this._server, this._logger);
                    // TODO: take actions to make sure module has correct subscriptions and log proof
                    this._logger.info("EVDriver module started...");
                    this._host = this._config.modules.evdriver.host;
                    this._port = this._config.modules.evdriver.port;
                    break;
                } else throw new Error("No config for EVDriver module");
            case EventGroup.Monitoring:
                if (this._config.modules.monitoring) {
                    this._module = new MonitoringModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
                    this._api = new MonitoringModuleApi(this._module as MonitoringModule, this._server, this._logger);
                    // TODO: take actions to make sure module has correct subscriptions and log proof
                    this._logger.info("Monitoring module started...");
                    this._host = this._config.modules.monitoring.host;
                    this._port = this._config.modules.monitoring.port;
                    break;
                } else throw new Error("No config for Monitoring module");
            case EventGroup.Reporting:
                if (this._config.modules.reporting) {
                    this._module = new ReportingModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
                    this._api = new ReportingModuleApi(this._module as ReportingModule, this._server, this._logger);
                    // TODO: take actions to make sure module has correct subscriptions and log proof
                    this._logger.info("Reporting module started...");
                    this._host = this._config.modules.reporting.host;
                    this._port = this._config.modules.reporting.port;
                    break;
                } else throw new Error("No config for Reporting module");
            case EventGroup.SmartCharging:
                if (this._config.modules.smartcharging) {
                    this._module = new SmartChargingModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
                    this._api = new SmartChargingModuleApi(this._module as SmartChargingModule, this._server, this._logger);
                    // TODO: take actions to make sure module has correct subscriptions and log proof
                    this._logger.info("SmartCharging module started...");
                    this._host = this._config.modules.smartcharging.host;
                    this._port = this._config.modules.smartcharging.port;
                    break;
                } else throw new Error("No config for SmartCharging module");
            case EventGroup.Transactions:
                if (this._config.modules.transactions) {
                    this._module = new TransactionsModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
                    this._api = new TransactionsModuleApi(this._module as TransactionsModule, this._server, this._logger);
                    // TODO: take actions to make sure module has correct subscriptions and log proof
                    this._logger.info("Transactions module started...");
                    this._host = this._config.modules.transactions.host;
                    this._port = this._config.modules.transactions.port;
                    break;
                } else throw new Error("No config for Transactions module");
            default:
                throw new Error("Unhandled module type: " + eventGroup);
        }

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

        // Shut down all module
        this._module.shutdown();

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
                port: this._port,
                host: this._host
            }).then(address => {
                this._logger.info(`Server listening at ${address}`);
            }).catch(error => {
                this._logger.error(error);
                process.exit(1);
            });
        } catch (error) {
            return Promise.reject(error);
        }
    }
}

new ModuleService(systemConfig, eventGroup).run().catch(error => {
    console.error(error);
    process.exit(1);
});