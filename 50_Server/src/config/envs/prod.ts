import { RegistrationStatusEnumType, defineConfig } from "@citrineos/base";

export function createProdConfig() {
    return defineConfig({
        env: "production",
        provisioning: {
            heartbeatInterval: 60,
            bootRetryInterval: 5,
            unknownChargerStatus: RegistrationStatusEnumType.Pending,
            getBaseReportOnPending: true,
            bootWithRejectedVariables: true,
            autoAccept: true,
            api: {
                endpointPrefix: "/provisioning",
                port: 8081
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
            tlsFlag: false,
            host: "localhost",
            port: 8080,
            protocol: "ocpp2.0.1",
            pingInterval: 60,
            maxCallLengthSeconds: 5,
            maxCachingSeconds: 10
        }
    });
}