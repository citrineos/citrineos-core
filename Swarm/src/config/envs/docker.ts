import { RegistrationStatusEnumType, defineConfig } from "@citrineos/base";

export function createDockerConfig() {
    return defineConfig({
        env: "development",
        modules: {
            certificates: {
                endpointPrefix: "/certificates",
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
                port: 8080
            },
            evdriver: {
                endpointPrefix: "/evdriver",
                port: 8080
            },
            monitoring: {
                endpointPrefix: "/monitoring",
                port: 8080
            },
            reporting: {
                endpointPrefix: "/reporting",
                port: 8080
            },
            smartcharging: {
                endpointPrefix: "/smartcharging",
                port: 8080
            },
            transactions: {
                endpointPrefix: "/transactions",
                port: 8080
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
            }
        },
        server: {
            logLevel: 2, // debug
            host: "0.0.0.0",
            port: 8080,
            swagger: {
                path: "/docs",
                exposeData: true,
                exposeMessage: true
            }
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