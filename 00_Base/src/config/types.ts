// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { z } from "zod";
import { RegistrationStatusEnumType } from "../ocpp/model/enums";
import { EventGroup } from "..";

export const systemConfigInputSchema = z.object({
    env: z.enum(["development", "production"]),
    modules: z.object({
        certificates: z.object({
            endpointPrefix: z.string().default(EventGroup.Certificates).optional(),
            host: z.string().default("localhost").optional(),
            port: z.number().int().positive().default(8081).optional(),
        }).optional(),
        configuration: z.object({
            heartbeatInterval: z.number().int().positive().default(60).optional(),
            bootRetryInterval: z.number().int().positive().default(10).optional(),
            unknownChargerStatus: z.enum([RegistrationStatusEnumType.Accepted, RegistrationStatusEnumType.Pending, RegistrationStatusEnumType.Rejected]).default(RegistrationStatusEnumType.Accepted).optional(), // Unknown chargers have no entry in BootConfig table
            getBaseReportOnPending: z.boolean().default(true).optional(),
            bootWithRejectedVariables: z.boolean().default(true).optional(),
            autoAccept: z.boolean().default(true).optional(), // If false, only data endpoint can update boot status to accepted
            endpointPrefix: z.string().default(EventGroup.Configuration).optional(),
            host: z.string().default("localhost").optional(),
            port: z.number().int().positive().default(8081).optional(),
        }), // Configuration module is required
        evdriver: z.object({
            endpointPrefix: z.string().default(EventGroup.EVDriver).optional(),
            host: z.string().default("localhost").optional(),
            port: z.number().int().positive().default(8081).optional(),
        }),
        monitoring: z.object({
            endpointPrefix: z.string().default(EventGroup.Monitoring).optional(),
            host: z.string().default("localhost").optional(),
            port: z.number().int().positive().default(8081).optional(),
        }),
        reporting: z.object({
            endpointPrefix: z.string().default(EventGroup.Reporting).optional(),
            host: z.string().default("localhost").optional(),
            port: z.number().int().positive().default(8081).optional(),
        }),
        smartcharging: z.object({
            endpointPrefix: z.string().default(EventGroup.SmartCharging).optional(),
            host: z.string().default("localhost").optional(),
            port: z.number().int().positive().default(8081).optional(),
        }).optional(),
        transactions: z.object({
            endpointPrefix: z.string().default(EventGroup.Transactions).optional(),
            host: z.string().default("localhost").optional(),
            port: z.number().int().positive().default(8081).optional(),
        }), // Transactions module is required
    }),
    data: z.object({
        sequelize: z.object({
            host: z.string().default('localhost').optional(),
            port: z.number().int().positive().default(5432).optional(),
            database: z.string().default('csms').optional(),
            dialect: z.any().default('sqlite').optional(),
            username: z.string().optional(), 
            password: z.string().optional(), 
            storage: z.string().default('csms.sqlite').optional(),
            sync: z.boolean().default(false).optional(),
        }),
    }),
    util: z.object({
        cache: z.object({
            memory: z.boolean().optional(),
            redis: z.object({
                host: z.string().default('localhost').optional(),
                port: z.number().int().positive().default(6379).optional(),
            }).optional(),
        }).refine(obj => obj.memory || obj.redis, {
            message: 'A cache implementation must be set'
        }),
        messageBroker: z.object({
            pubsub: z.object({
                topicPrefix: z.string().default('ocpp').optional(),
                topicName: z.string().optional(),
                servicePath: z.string().optional(),
            }).optional(),
            kafka: z.object({
                topicPrefix: z.string().optional(),
                topicName: z.string().optional(),
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
            }).optional(),
        }).refine(obj => obj.pubsub || obj.kafka || obj.amqp, {
            message: 'A message broker implementation must be set'
        })
    }),
    server: z.object({
        logLevel: z.number().min(0).max(6).default(0).optional(),
        host: z.string().default("localhost").optional(),
        port: z.number().int().positive().default(8081).optional(),
        swagger: z.object({
            path: z.string().default('/docs').optional(),
            exposeData: z.boolean().default(true).optional(),
            exposeMessage: z.boolean().default(true).optional(),
        }).optional(),
    }),
    websocket: z.object({
        pingInterval: z.number().int().positive().default(60).optional(),
        maxCallLengthSeconds: z.number().int().positive().default(5).optional(),
        maxCachingSeconds: z.number().int().positive().default(10).optional()
    }),
    websocketSecurity: z.object({
        // TODO: Add support for each websocketServer/tenant to have its own certificates
        // Such as when different tenants use different certificate roots for additional security
        tlsKeysFilepath: z.string().optional(),
        tlsCertificateChainFilepath: z.string().optional(),
        mtlsCertificateAuthorityRootsFilepath: z.string().optional(),
        mtlsCertificateAuthorityKeysFilepath: z.string().optional()
    }).optional(),
    websocketServer: z.array(z.object({ 
        // This allows multiple servers, ideally for different security profile levels
        // TODO: Add support for tenant ids on server level for tenant-specific behavior
        securityProfile: z.number().int().min(0).max(3).default(0).optional(),
        port: z.number().int().positive().default(8080).optional(),
        host: z.string().default('localhost').optional(),
        protocol: z.string().default('ocpp2.0.1').optional(),
    }))
});

export type SystemConfigInput = z.infer<typeof systemConfigInputSchema>;

export const systemConfigSchema = z.object({
    env: z.enum(["development", "production"]),
    modules: z.object({
        certificates: z.object({
            endpointPrefix: z.string(),
            host: z.string().optional(),
            port: z.number().int().positive().optional(),
        }).optional(),
        evdriver: z.object({
            endpointPrefix: z.string(),
            host: z.string().optional(),
            port: z.number().int().positive().optional(),
        }),
        configuration: z.object({
            heartbeatInterval: z.number().int().positive(),
            bootRetryInterval: z.number().int().positive(),
            unknownChargerStatus: z.enum([RegistrationStatusEnumType.Accepted, RegistrationStatusEnumType.Pending, RegistrationStatusEnumType.Rejected]), // Unknown chargers have no entry in BootConfig table
            getBaseReportOnPending: z.boolean(),
            bootWithRejectedVariables: z.boolean(),
            /**
             * If false, only data endpoint can update boot status to accepted
             */
            autoAccept: z.boolean(), 
            endpointPrefix: z.string(),
            host: z.string().optional(),
            port: z.number().int().positive().optional(),
        }), // Configuration module is required
        monitoring: z.object({
            endpointPrefix: z.string(),
            host: z.string().optional(),
            port: z.number().int().positive().optional(),
        }),
        reporting: z.object({
            endpointPrefix: z.string(),
            host: z.string().optional(),
            port: z.number().int().positive().optional(),
        }),
        smartcharging: z.object({
            endpointPrefix: z.string(),
            host: z.string().optional(),
            port: z.number().int().positive().optional(),
        }).optional(),
        transactions: z.object({
            endpointPrefix: z.string(),
            host: z.string().optional(),
            port: z.number().int().positive().optional(),
        }), // Transactions module is required
    }),
    data: z.object({
        sequelize: z.object({
            host: z.string(),
            port: z.number().int().positive(),
            database: z.string(),
            dialect: z.any(),
            username: z.string(),
            password: z.string(),
            storage: z.string(),
            sync: z.boolean(),
        }),
    }),
    util: z.object({
        cache: z.object({
            memory: z.boolean().optional(),
            redis: z.object({
                host: z.string(),
                port: z.number().int().positive(),
            }).optional(),
        }).refine(obj => obj.memory || obj.redis, {
            message: 'A cache implementation must be set'
        }),
        messageBroker: z.object({
            pubsub: z.object({
                topicPrefix: z.string(),
                topicName: z.string().optional(),
                servicePath: z.string().optional(),
            }).optional(),
            kafka: z.object({
                topicPrefix: z.string().optional(),
                topicName: z.string().optional(),
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
            }).optional(),
        }).refine(obj => obj.pubsub || obj.kafka || obj.amqp, {
            message: 'A message broker implementation must be set'
        })
    }),
    server: z.object({
        logLevel: z.number().min(0).max(6),
        host: z.string(),
        port: z.number().int().positive(),
        swagger: z.object({
            path: z.string(),
            exposeData: z.boolean(),
            exposeMessage: z.boolean(),
        }).optional(),
    }),
    websocket: z.object({
        pingInterval: z.number().int().positive(),
        maxCallLengthSeconds: z.number().int().positive(),
        maxCachingSeconds: z.number().int().positive()
    }).refine(websocketServer => websocketServer.maxCachingSeconds >= websocketServer.maxCallLengthSeconds, {
        message: 'maxCachingSeconds cannot be less than maxCallLengthSeconds'
    }),
    websocketSecurity: z.object({
        // TODO: Add support for each websocketServer/tenant to have its own certificates
        // Such as when different tenants use different certificate roots for additional security
        tlsKeysFilepath: z.string().optional(),
        tlsCertificateChainFilepath: z.string().optional(),
        mtlsCertificateAuthorityRootsFilepath: z.string().optional(),
        mtlsCertificateAuthorityKeysFilepath: z.string().optional()
    }).optional(),
    websocketServer: z.array(z.object({ 
        // This allows multiple servers, ideally for different security profile levels
        // TODO: Add support for tenant ids on server level for tenant-specific behavior
        securityProfile: z.number().int().min(0).max(3),
        port: z.number().int().positive(),
        host: z.string(),
        protocol: z.string(),
    })).refine(websocketServers => checkForHostPortDuplicates(websocketServers), {
        message: 'host and port must be unique'
    })
}).refine((data) => {
    const wsSecurity = data.websocketSecurity;

    const requiresTls = data.websocketServer.some(server => server.securityProfile >= 2);
    const tlsFieldsFilled = wsSecurity?.tlsKeysFilepath && wsSecurity?.tlsCertificateChainFilepath;

    const requiresMtls = data.websocketServer.some(server => server.securityProfile >= 3);
    const mtlsFieldsFilled = wsSecurity?.mtlsCertificateAuthorityRootsFilepath && wsSecurity?.mtlsCertificateAuthorityKeysFilepath;

    if (requiresTls && !tlsFieldsFilled) {
        return false;
    }

    if (requiresMtls && !mtlsFieldsFilled) {
        return false;
    }

    return true;
}, {
    message: "TLS and/or mTLS fields must be filled based on the security profile of the websocket server."
});

export type SystemConfig = z.infer<typeof systemConfigSchema>;

function checkForHostPortDuplicates(websocketServers: { port: number; host: string;}[]): unknown {
    const uniqueCombinations = new Set<string>();
    for (const item of websocketServers) {
      const combo = `${item.host}:${item.port}`;
  
      if (uniqueCombinations.has(combo)) {
        return false; // Duplicate found
      }
  
      uniqueCombinations.add(combo);
    }
  
    return true;
}