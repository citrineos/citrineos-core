// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { RegistrationStatusEnumType, defineConfig } from "@citrineos/base";

export function createDockerConfig() {
    return defineConfig({
        env: "development",
        modules: {
            certificates: {
                endpointPrefix: "certificates",
                host: "0.0.0.0",
                port: 8083
            },
            configuration: {
                heartbeatInterval: 60,
                bootRetryInterval: 15,
                unknownChargerStatus: RegistrationStatusEnumType.Accepted,
                getBaseReportOnPending: true,
                bootWithRejectedVariables: true,
                autoAccept: false,
                endpointPrefix: "configuration",
                host: "0.0.0.0",
                port: 8084
            },
            evdriver: {
                endpointPrefix: "evdriver",
                host: "0.0.0.0",
                port: 8085
            },
            monitoring: {
                endpointPrefix: "monitoring",
                host: "0.0.0.0",
                port: 8086
            },
            reporting: {
                endpointPrefix: "reporting",
                host: "0.0.0.0",
                port: 8087
            },
            smartcharging: {
                endpointPrefix: "smartcharging",
                host: "0.0.0.0",
                port: 8088
            },
            transactions: {
                endpointPrefix: "transactions",
                host: "0.0.0.0",
                port: 8089
            },
        },
        data: {
            sequelize: {
                host: "ocpp-db",
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
                    host: "redis",
                    port: 6379,
                }
            },
            messageBroker: {
                amqp: {
                    url: "amqp://guest:guest@amqp-broker:5672",
                    exchange: "citrineos",
                }
            },
            swagger: {
                path: "/docs",
                logoPath: "/usr/server/src/assets/logo.png",
                exposeData: true,
                exposeMessage: true
            }
        },
        server: {
            logLevel: 2, // debug
            host: "0.0.0.0",
            port: 8080
        },        
        websocket: {
            pingInterval: 60,
            maxCallLengthSeconds: 5,
            maxCachingSeconds: 10
        },
        websocketServer: [{
            securityProfile: 0,
            host: "0.0.0.0",
            port: 8081,
            protocol: "ocpp2.0.1"
        },{
            securityProfile: 1,
            host: "0.0.0.0",
            port: 8082,
            protocol: "ocpp2.0.1"
        }]
    });
}