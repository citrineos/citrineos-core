// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { RegistrationStatusEnumType, defineConfig } from "@citrineos/base";

export function createLocalConfig() {
    return defineConfig({
        env: "development",
        centralsystem: {
            host: "0.0.0.0",
            port: 8080
        },  
        modules: {
            certificates: {
                endpointPrefix: "/certificates",
                host: "localhost",
                port: 8080
            },
            configuration: {
                heartbeatInterval: 60,
                bootRetryInterval: 15,
                unknownChargerStatus: RegistrationStatusEnumType.Accepted,
                getBaseReportOnPending: true,
                bootWithRejectedVariables: true,
                autoAccept: false,
                endpointPrefix: "/configuration",
                host: "localhost",
                port: 8080
            },
            evdriver: {
                endpointPrefix: "/evdriver",
                host: "localhost",
                port: 8080
            },
            monitoring: {
                endpointPrefix: "/monitoring",
                host: "localhost",
                port: 8080
            },
            reporting: {
                endpointPrefix: "/reporting",
                host: "localhost",
                port: 8080
            },
            smartcharging: {
                endpointPrefix: "/smartcharging",
                host: "localhost",
                port: 8080
            },
            transactions: {
                endpointPrefix: "/transactions",
                host: "localhost",
                port: 8080
            },
        },
        data: {
            sequelize: {
                host: "localhost",
                port: 5432,
                database: "citrine",
                dialect: "postgres",
                username: "citrine",
                password: "citrine",
                storage: "",
                sync: true,
            }
        },
        util: {
            cache: {
                redis: {
                    host: "localhost",
                    port: 6379,
                }
            },
            messageBroker: {
                amqp: {
                    url: "amqp://guest:guest@localhost:5672",
                    exchange: "citrineos",
                }
            },
            swagger: {
                path: "/docs",
                logoPath: "/usr/server/src/assets/logo.png",
                exposeData: true,
                exposeMessage: true
            },
            networkConnection: {
                websocketServers: [{
                    id: "0",
                    securityProfile: 0,
                    pingInterval: 60,
                    host: "0.0.0.0",
                    port: 8081,
                    protocol: "ocpp2.0.1"
                }, {
                    id: "1",
                    securityProfile: 1,
                    pingInterval: 60,
                    host: "0.0.0.0",
                    port: 8082,
                    protocol: "ocpp2.0.1"
                }]
            }
        },
        logLevel: 2, // debug
        maxCallLengthSeconds: 5,
        maxCachingSeconds: 10
    });
}