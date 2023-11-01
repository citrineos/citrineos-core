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

import { z } from "zod";
import { RegistrationStatusEnumType } from "../ocpp/model/enums";

export const systemConfigSchema = z.object({
    env: z.enum(["development", "production"]),
    provisioning: z.object({
        heartbeatInterval: z.number().int().positive().default(60),
        bootRetryInterval: z.number().int().positive().default(10),
        unknownChargerStatus: z.enum([RegistrationStatusEnumType.Accepted, RegistrationStatusEnumType.Pending, RegistrationStatusEnumType.Rejected]).default(RegistrationStatusEnumType.Accepted), // Unknown chargers have no entry in BootConfig table
        getBaseReportOnPending: z.boolean().default(true),
        bootWithRejectedVariables: z.boolean().default(true),
        api: z.object({
            endpointPrefix: z.string(),
            port: z.number().int().positive().default(8081),
        }),
    }),
    authorization: z.object({
        api: z.object({
            endpointPrefix: z.string(),
            port: z.number().int().positive().default(8082),
        }),
    }),
    availability: z.object({
        api: z.object({
            endpointPrefix: z.string(),
            port: z.number().int().positive().default(8083),
        }),
    }),
    transaction: z.object({
        api: z.object({
            endpointPrefix: z.string(),
            port: z.number().int().positive().default(8084),
        }),
    }),
    monitoring: z.object({
        api: z.object({
            endpointPrefix: z.string(),
            port: z.number().int().positive().default(8085),
        }),
    }),
    data: z.object({
        sequelize: z.object({
            host: z.string().default('localhost'),
            port: z.number().int().positive().default(5432),
            database: z.string().default('csms'),
            dialect: z.any().default('sqlite'),
            username: z.string().default(''),
            password: z.string().default(''),
            storage: z.string().default('csms.sqlite'),
            sync: z.boolean().default(false),
        })
    }),
    util: z.object({
        redis: z.object({
            host: z.string().default('localhost'),
            port: z.number().int().positive().default(6379),
        }),
        pubsub: z.object({
            topicPrefix: z.string().default('ocpp'),
            topicName: z.string().default(''),
            servicePath: z.string().default(''),
        }).optional(),
        kafka: z.object({
            topicPrefix: z.string().default('ocpp'),
            topicName: z.string().default(''),
            brokers: z.array(z.string()),
            sasl: z.object({
                mechanism: z.string(),
                username: z.string(),
                password: z.string()
            })
        }).optional(),
        amqp: z.object({
            url: z.string(),
            exchange: z.string(),
        }).optional()
    }),
    server: z.object({
        logLevel: z.number().min(0).max(6).default(0),
        host: z.string().default("localhost"),
        port: z.number().int().positive().default(8081),
        swagger: z.object({
            enabled: z.boolean().default(true),
            path: z.string().default('/docs'),
            exposeData: z.boolean().default(true),
            exposeMessage: z.boolean().default(true),
        })
    }),
    websocketServer: z.object({
        webProtocol: z.enum(['http', 'https']).default('http'),
        httpsCertificateFilepath: z.string().optional(),
        port: z.number().int().positive().default(8080),
        host: z.string().default('localhost'),
        protocol: z.string().default('ocpp2.0.1'),
        pingInterval: z.number().int().positive().default(60),
        maxCallLengthSeconds: z.number().int().positive().default(5)
    }),
});

export type SystemConfig = z.infer<typeof systemConfigSchema>;
export type RequiredConfig = Optional<SystemConfig, KeysWithFallbackValue>;

type KeysWithFallbackValue = "provisioning" | "authorization" | "availability" | "transaction" | "monitoring" | "data" | "util" | "server";
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;