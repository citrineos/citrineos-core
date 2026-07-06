// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { Token } from 'typedi';

/**
 * OCPI Configuration Schema
 * This schema defines the configuration structure specific to OCPI modules only.
 * It excludes all citrineos-core-specific settings.
 */
export const oidcConfigSchema = z
  .object({
    jwksUri: z.string(),
    issuer: z.string(),
    audience: z.string().optional(),
    cacheTime: z.number().optional(),
    rateLimit: z.boolean().optional(),
  })
  .optional();

export const ocpiConfigInputSchema = z.object({
  env: z.enum(['development', 'production']),

  // OCPI Server configuration
  ocpiServer: z.object({
    host: z.string().default('0.0.0.0').optional(),
    port: z.number().int().positive().default(8085).optional(),
  }),

  // OCPI Module configuration
  ocpiModules: z.object({
    credentials: z
      .object({
        endpointPrefix: z.string().default('/credentials').optional(),
      })
      .optional(),

    versions: z
      .object({
        endpointPrefix: z.string().default('/versions').optional(),
      })
      .optional(),

    locations: z
      .object({
        endpointPrefix: z.string().default('/locations').optional(),
      })
      .optional(),

    sessions: z
      .object({
        endpointPrefix: z.string().default('/sessions').optional(),
      })
      .optional(),

    cdrs: z
      .object({
        endpointPrefix: z.string().default('/cdrs').optional(),
      })
      .optional(),

    tokens: z
      .object({
        endpointPrefix: z.string().default('/tokens').optional(),
      })
      .optional(),

    tariffs: z
      .object({
        endpointPrefix: z.string().default('/tariffs').optional(),
      })
      .optional(),

    chargingProfiles: z
      .object({
        endpointPrefix: z.string().default('/chargingprofiles').optional(),
      })
      .optional(),

    commands: z
      .object({
        endpointPrefix: z.string().default('/commands').optional(),
      })
      .optional(),
  }),

  // Database configuration (required for OCPI data persistence)
  database: z.object({
    host: z.string().default('localhost').optional(),
    port: z.number().int().positive().default(5432).optional(),
    database: z.string().default('ocpi').optional(),
    username: z.string().default('ocpi').optional(),
    password: z.string().default('').optional(),
  }),

  // Cache configuration (required for OCPI token caching)
  cache: z
    .object({
      memory: z.boolean().optional(),
      redis: z
        .object({
          host: z.string().default('localhost').optional(),
          port: z.number().int().positive().default(6379).optional(),
        })
        .optional(),
    })
    .refine((obj) => obj.memory || obj.redis, {
      message: 'A cache implementation must be set',
    }),

  // Optional message broker for integration
  messageBroker: z
    .object({
      amqp: z
        .object({
          url: z.string(),
          exchange: z.string(),
        })
        .optional(),
      kafka: z
        .object({
          topicPrefix: z.string().optional(),
          topicName: z.string().optional(),
          brokers: z.array(z.string()),
          sasl: z
            .object({
              mechanism: z.string(),
              username: z.string(),
              password: z.string(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),

  // Optional Swagger documentation
  swagger: z
    .object({
      path: z.string().default('/docs').optional(),
      logoPath: z.string(),
      exposeData: z.boolean().default(true).optional(),
      exposeMessage: z.boolean().default(true).optional(),
    })
    .optional(),

  graphql: z.object({
    endpoint: z.string(),
    headers: z.record(z.string(), z.string()).optional(),
  }),

  commands: z.object({
    timeout: z.number().int().positive().default(30).optional(),
    ocpiBaseUrl: z.string().default('http://localhost:8085/ocpi').optional(),
    coreHeaders: z.record(z.string(), z.string()).optional(),
    ocpp1_6: z.object({
      remoteStartTransactionRequestUrl: z.string(),
      remoteStopTransactionRequestUrl: z.string(),
      unlockConnectorRequestUrl: z.string(),
    }),
    ocpp2_0_1: z.object({
      requestStartTransactionRequestUrl: z.string(),
      requestStopTransactionRequestUrl: z.string(),
      unlockConnectorRequestUrl: z.string(),
    }),
  }),

  // OCPI-specific settings
  logLevel: z.number().min(0).max(6).default(2).optional(),
  defaultPageLimit: z.number().int().positive().default(50).optional(),
  maxPageLimit: z.number().int().positive().default(1000).optional(),

  // Optional OIDC configuration
  oidc: oidcConfigSchema,
});

export type OcpiConfigInput = z.infer<typeof ocpiConfigInputSchema>;

/**
 * Processed/validated OCPI Configuration Schema
 */
export const ocpiConfigSchema = z.object({
  env: z.enum(['development', 'production']),

  ocpiServer: z.object({
    host: z.string(),
    port: z.number().int().positive(),
  }),

  ocpiModules: z.object({
    credentials: z
      .object({
        endpointPrefix: z.string(),
      })
      .optional(),

    versions: z
      .object({
        endpointPrefix: z.string(),
      })
      .optional(),

    locations: z
      .object({
        endpointPrefix: z.string(),
      })
      .optional(),

    sessions: z
      .object({
        endpointPrefix: z.string(),
      })
      .optional(),

    cdrs: z
      .object({
        endpointPrefix: z.string(),
      })
      .optional(),

    tokens: z
      .object({
        endpointPrefix: z.string(),
      })
      .optional(),

    tariffs: z
      .object({
        endpointPrefix: z.string(),
      })
      .optional(),

    chargingProfiles: z
      .object({
        endpointPrefix: z.string(),
      })
      .optional(),

    commands: z
      .object({
        endpointPrefix: z.string(),
      })
      .optional(),
  }),

  database: z.object({
    host: z.string(),
    port: z.number().int().positive(),
    database: z.string(),
    username: z.string(),
    password: z.string(),
  }),

  cache: z.object({
    memory: z.boolean().optional(),
    redis: z
      .object({
        host: z.string(),
        port: z.number().int().positive(),
      })
      .optional(),
  }),

  graphql: z.object({
    endpoint: z.string(),
    headers: z.record(z.string(), z.string()).optional(),
  }),

  messageBroker: z
    .object({
      amqp: z
        .object({
          url: z.string(),
          exchange: z.string(),
        })
        .optional(),
      kafka: z
        .object({
          topicPrefix: z.string().optional(),
          topicName: z.string().optional(),
          brokers: z.array(z.string()),
          sasl: z
            .object({
              mechanism: z.string(),
              username: z.string(),
              password: z.string(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),

  swagger: z
    .object({
      path: z.string(),
      logoPath: z.string(),
      exposeData: z.boolean(),
      exposeMessage: z.boolean(),
    })
    .optional(),

  commands: z.object({
    timeout: z.number().int().positive(),
    ocpiBaseUrl: z.string(),
    coreHeaders: z.record(z.string(), z.string()).optional(),
    ocpp1_6: z.object({
      remoteStartTransactionRequestUrl: z.string(),
      remoteStopTransactionRequestUrl: z.string(),
      unlockConnectorRequestUrl: z.string(),
    }),
    ocpp2_0_1: z.object({
      requestStartTransactionRequestUrl: z.string(),
      requestStopTransactionRequestUrl: z.string(),
      unlockConnectorRequestUrl: z.string(),
    }),
  }),

  logLevel: z.number().min(0).max(6),
  defaultPageLimit: z.number().int().positive(),
  maxPageLimit: z.number().int().positive(),
  oidc: oidcConfigSchema,
});

export type OIDCConfig = z.infer<typeof oidcConfigSchema>;
export type OcpiConfig = z.infer<typeof ocpiConfigSchema>;
export const OcpiConfigToken = new Token<OcpiConfig>('ocpi.config');
