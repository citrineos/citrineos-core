import { RegistrationStatusEnumType, defineConfig } from "@citrineos/base";

export function createLocalConfig() {
    return defineConfig({
        env: "development",
        provisioning: {
            heartbeatInterval: 60,
            bootRetryInterval: 15,
            unknownChargerStatus: RegistrationStatusEnumType.Accepted,
            getBaseReportOnPending: true,
            bootWithRejectedVariables: true,
            api: {
                endpointPrefix: "/provisioning",
                port: 8081
            }
        },
        availability: {
            api: {
                endpointPrefix: "/availability",
                port: 8081
            }
        },
        authorization: {
            api: {
                endpointPrefix: "/authorization",
                port: 8081
            }
        },
        transaction: {
            api: {
                endpointPrefix: "/transaction",
                port: 8081
            }
        },
        monitoring: {
            api: {
                endpointPrefix: "/monitoring",
                port: 8081
            }
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
            redis: {
                host: "localhost",
                port: 6379,
            },
            pubsub: {
                topicPrefix: "ocpp",
                topicName: "citrineos",
                servicePath: "path/to/service/file.json",
            },
            amqp: {
                url: "amqp://guest:guest@localhost:5672",
                exchange: "citrineos",
            }
        },
        server: {
            logLevel: 3,
            host: "localhost",
            port: 8081,
            swagger: {
                enabled: true,
                path: "/docs",
                exposeData: true,
                exposeMessage: true
            }
        },
        websocketServer: {
            webProtocol: "http",
            host: "localhost",
            port: 8080,
            protocol: "ocpp2.0.1",
            pingInterval: 60,
            maxCallLengthSeconds: 5
        }
    });
}