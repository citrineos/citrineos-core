// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ICache, ICentralSystem, IMessageHandler, IMessageSender, IModule, IModuleApi, SystemConfig } from '@citrineos/base';
import { MonitoringModule, MonitoringModuleApi } from '@citrineos/monitoring';
import { CentralSystemImpl, DirectusUtil, MemoryCache, RabbitMqReceiver, RabbitMqSender, initSwagger } from '@citrineos/util';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import Ajv from "ajv";
import addFormats from "ajv-formats"
import fastify, { FastifyInstance } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { systemConfig } from './config';
import { ConfigurationModule, ConfigurationModuleApi } from '@citrineos/configuration';
import { TransactionsModule, TransactionsModuleApi } from '@citrineos/transactions';
import { CertificatesModule, CertificatesModuleApi } from '@citrineos/certificates';
import { EVDriverModule, EVDriverModuleApi } from '@citrineos/evdriver';
import { ReportingModule, ReportingModuleApi } from '@citrineos/reporting';
import { SmartChargingModule, SmartChargingModuleApi } from '@citrineos/smartcharging';
import { sequelize } from '@citrineos/data';

class CitrineOSServer {

    /**
     * Fields
     */
    private _config: SystemConfig;
    private _modules: Array<IModule>;
    private _apis: Array<IModuleApi>;
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
            minLevel: systemConfig.logLevel,
            hideLogPositionForProduction: systemConfig.env === "production",
            //Disable colors for cloud deployment as some cloude logging environments such as cloudwatch can not interpret colors
            stylePrettyLogs: process.env.DEPLOYMENT_TARGET != "cloud"

        });

        // Set cache implementation
        this._cache = cache || new MemoryCache();

        // Initialize Swagger if enabled
        if (this._config.util.swagger) {
            initSwagger(this._config, this._server);
        }

        if (this._config.util.directus?.generateFlows) {
            const directusUtil = new DirectusUtil(this._config, this._logger);
            this._server.addHook("onRoute", directusUtil.addDirectusMessageApiFlowsFastifyRouteHook.bind(directusUtil));
        }

        // Register AJV for schema validation
        this._server.setValidatorCompiler(({ schema, method, url, httpPart }) => {
            return this._ajv.compile(schema);
        });

        // Force sync database
        sequelize.DefaultSequelizeInstance.getInstance(this._config, this._logger, true);

        this._centralSystem = new CentralSystemImpl(this._config, this._cache, undefined, undefined, this._logger, ajv);

        // Initialize modules & APIs
        // Always initialize APIs after SwaggerUI
        const configurationModule = new ConfigurationModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
        const evdriverModule = new EVDriverModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
        const monitoringModule = new MonitoringModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
        const reportingModule = new ReportingModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
        const transactionsModule = new TransactionsModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger);
        this._modules = [
            configurationModule,
            evdriverModule,
            monitoringModule,
            reportingModule,
            transactionsModule
        ]
        this._apis = [
            new ConfigurationModuleApi(configurationModule, this._server, this._logger),
            new EVDriverModuleApi(evdriverModule, this._server, this._logger),
            new MonitoringModuleApi(monitoringModule, this._server, this._logger),
            new ReportingModuleApi(reportingModule, this._server, this._logger),
            new TransactionsModuleApi(transactionsModule, this._server, this._logger),
        ];
        if (this._config.modules.certificates) {
            const certificatesModule = new CertificatesModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger)
            this._modules.push(certificatesModule);
            this._apis.push(new CertificatesModuleApi(certificatesModule, this._server, this._logger));
        }
        if (this._config.modules.smartcharging) {
            const smartchargingModule = new SmartChargingModule(this._config, this._cache, this._createSender(), this._createHandler(), this._logger)
            this._modules.push(smartchargingModule);
            this._apis.push(new SmartChargingModuleApi(smartchargingModule, this._server, this._logger));
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

        // Shut down all modules and central system
        this._modules.forEach(module => {
            module.shutdown();
        });
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
                port: this._config.centralSystem.port,
                host: this._config.centralSystem.host
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

new CitrineOSServer(systemConfig).run().catch(error => {
    console.error(error);
    process.exit(1);
});