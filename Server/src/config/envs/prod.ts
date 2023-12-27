import { RegistrationStatusEnumType, defineConfig } from "@citrineos/base";

export function createProdConfig() {
    return defineConfig({
        env: "production",
        modules: {
            certificates: {
            },
            configuration: {
                bootRetryInterval: 5,
                unknownChargerStatus: RegistrationStatusEnumType.Pending,
                autoAccept: true,
            },
            evdriver: {
            },
            monitoring: {
            },
            reporting: {
            },
            smartcharging: {
            },
            transactions: {
            },
        },
        data: {
            sequelize: {
            }
        },
        util: {
            cache: {
                redis: {
                }
            },
            messageBroker: {
                amqp: {
                    url: "amqp://guest:guest@localhost:5672",
                    exchange: "citrineos",
                }
            }
        },
        server: {
            logLevel: 3,
            host: "localhost",
            swagger: {
                path: "/docs",
                exposeData: true,
                exposeMessage: true
            }
        },
        websocketServer: {
        }
    });
}