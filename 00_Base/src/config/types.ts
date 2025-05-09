// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { z } from 'zod';
import { OCPP2_0_1, OCPP1_6 } from '../ocpp/model';
import { EventGroup } from '..';
import { OCPP1_6_CallAction, OCPP2_0_1_CallAction } from '../ocpp/rpc/message';

const OCPP1_6_CallActionSchema = z.nativeEnum(OCPP1_6_CallAction);
const OCPP2_0_1_CallActionSchema = z.nativeEnum(OCPP2_0_1_CallAction);

const CallActionSchema = z.union([OCPP1_6_CallActionSchema, OCPP2_0_1_CallActionSchema]);

// TODO: Refactor other objects out of system config, such as certificatesModuleInputSchema etc.
export const websocketServerInputSchema = z.object({
  // TODO: Add support for tenant ids on server level for tenant-specific behavior
  id: z.string().optional(),
  host: z.string().default('localhost').optional(),
  port: z.number().int().positive().default(8080).optional(),
  pingInterval: z.number().int().positive().default(60).optional(),
  protocol: z.enum(['ocpp1.6', 'ocpp2.0.1']).default('ocpp2.0.1').optional(),
  securityProfile: z.number().int().min(0).max(3).default(0).optional(),
  allowUnknownChargingStations: z.boolean().default(false).optional(),
  tlsKeyFilePath: z.string().optional(), // Leaf certificate's private key pem which decrypts the message from client
  tlsCertificateChainFilePath: z.string().optional(), // Certificate chain pem consist of a leaf followed by sub CAs
  mtlsCertificateAuthorityKeyFilePath: z.string().optional(), // Sub CA's private key which signs the leaf (e.g.,
  // charging station certificate and csms certificate)
  rootCACertificateFilePath: z.string().optional(), // Root CA certificate that overrides default CA certificates
  // allowed by Mozilla
});

export const systemConfigInputSchema = z.object({
  env: z.enum(['development', 'production']),
  centralSystem: z.object({
    host: z.string().default('localhost').optional(),
    port: z.number().int().positive().default(8081).optional(),
  }),
  modules: z.object({
    certificates: z
      .object({
        endpointPrefix: z.string().default(EventGroup.Certificates).optional(),
        host: z.string().default('localhost').optional(),
        port: z.number().int().positive().default(8081).optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      })
      .optional(),
    configuration: z.object({
      heartbeatInterval: z.number().int().positive().default(60).optional(),
      bootRetryInterval: z.number().int().positive().default(10).optional(),
      requests: z.array(CallActionSchema),
      responses: z.array(CallActionSchema),
      ocpp2_0_1: z
        .object({
          unknownChargerStatus: z
            .enum([
              OCPP2_0_1.RegistrationStatusEnumType.Accepted,
              OCPP2_0_1.RegistrationStatusEnumType.Pending,
              OCPP2_0_1.RegistrationStatusEnumType.Rejected,
            ])
            .default(OCPP2_0_1.RegistrationStatusEnumType.Accepted)
            .optional(), // Unknown chargers have no entry in BootConfig table
          getBaseReportOnPending: z.boolean().default(true).optional(),
          bootWithRejectedVariables: z.boolean().default(true).optional(),
          autoAccept: z.boolean().default(true).optional(), // If false, only data endpoint can update boot status to accepted
        })
        .optional(),
      ocpp1_6: z
        .object({
          unknownChargerStatus: z
            .enum([
              OCPP1_6.BootNotificationResponseStatus.Accepted,
              OCPP1_6.BootNotificationResponseStatus.Pending,
              OCPP1_6.BootNotificationResponseStatus.Rejected,
            ])
            .default(OCPP1_6.BootNotificationResponseStatus.Accepted)
            .optional(), // Unknown chargers have no entry in BootConfig table
        })
        .optional(),
      endpointPrefix: z.string().default(EventGroup.Configuration).optional(),
      host: z.string().default('localhost').optional(),
      port: z.number().int().positive().default(8081).optional(),
    }),
    evdriver: z.object({
      endpointPrefix: z.string().default(EventGroup.EVDriver).optional(),
      host: z.string().default('localhost').optional(),
      port: z.number().int().positive().default(8081).optional(),
      requests: z.array(CallActionSchema),
      responses: z.array(CallActionSchema),
    }),
    monitoring: z.object({
      endpointPrefix: z.string().default(EventGroup.Monitoring).optional(),
      host: z.string().default('localhost').optional(),
      port: z.number().int().positive().default(8081).optional(),
      requests: z.array(CallActionSchema),
      responses: z.array(CallActionSchema),
    }),
    reporting: z.object({
      endpointPrefix: z.string().default(EventGroup.Reporting).optional(),
      host: z.string().default('localhost').optional(),
      port: z.number().int().positive().default(8081).optional(),
      requests: z.array(CallActionSchema),
      responses: z.array(CallActionSchema),
    }),
    smartcharging: z
      .object({
        endpointPrefix: z.string().default(EventGroup.SmartCharging).optional(),
        host: z.string().default('localhost').optional(),
        port: z.number().int().positive().default(8081).optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      })
      .optional(),
    tenant: z
      .object({
        endpointPrefix: z.string().default(EventGroup.Tenant).optional(),
        host: z.string().default('localhost').optional(),
        port: z.number().int().positive().default(8081).optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      })
      .optional(),
    transactions: z.object({
      endpointPrefix: z.string().default(EventGroup.Transactions).optional(),
      requests: z.array(CallActionSchema),
      responses: z.array(CallActionSchema),
      host: z.string().default('localhost').optional(),
      port: z.number().int().positive().default(8081).optional(),
      costUpdatedInterval: z.number().int().positive().default(60).optional(),
      sendCostUpdatedOnMeterValue: z.boolean().default(false).optional(),
      signedMeterValuesConfiguration: z
        .object({
          publicKeyFileId: z.string(),
          signingMethod: z.enum(['RSASSA-PKCS1-v1_5', 'ECDSA']),
        })
        .optional(),
    }),
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
      alter: z.boolean().default(false).optional(),
    }),
  }),
  util: z.object({
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
    messageBroker: z
      .object({
        kafka: z
          .object({
            topicPrefix: z.string().optional(),
            topicName: z.string().optional(),
            brokers: z.array(z.string()),
            sasl: z.object({
              mechanism: z.string(),
              username: z.string(),
              password: z.string(),
            }),
          })
          .optional(),
        amqp: z
          .object({
            url: z.string(),
            exchange: z.string(),
          })
          .optional(),
      })
      .refine((obj) => obj.kafka || obj.amqp, {
        message: 'A message broker implementation must be set',
      }),
    fileAccess: z
      .object({
        s3: z
          .object({
            region: z.string().optional(),
            endpoint: z.string().optional(),
            defaultBucketName: z.string().default('citrineos-s3-bucket'),
            s3ForcePathStyle: z.boolean().default(true),
            accessKeyId: z.string().optional(),
            secretAccessKey: z.string().optional(),
          })
          .optional(),
        local: z
          .object({
            defaultFilePath: z.string().default('/data'),
          })
          .optional(),
        directus: z
          .object({
            host: z.string().default('localhost').optional(),
            port: z.number().int().positive().default(8055).optional(),
            token: z.string().optional(),
            username: z.string().optional(),
            password: z.string().optional(),
            generateFlows: z.boolean().default(false).optional(),
          })
          .refine((obj) => obj.generateFlows && !obj.host, {
            message: 'Directus host must be set if generateFlows is true',
          })
          .optional(),
      })
      .refine((obj) => obj.s3 || obj.local || obj.directus, {
        message: 'A file access implementation must be set',
      })
      .refine(
        (obj) => {
          const implementations = [obj.s3, obj.local, obj.directus];
          const presentCount = implementations.filter(Boolean).length;
          return presentCount <= 1;
        },
        {
          message: 'Only one file access implementation should be set',
        },
      ),
    swagger: z
      .object({
        path: z.string().default('/docs').optional(),
        logoPath: z.string(),
        exposeData: z.boolean().default(true).optional(),
        exposeMessage: z.boolean().default(true).optional(),
      })
      .optional(),
    networkConnection: z.object({
      websocketServers: z.array(websocketServerInputSchema.optional()),
    }),
    certificateAuthority: z.object({
      v2gCA: z
        .object({
          name: z.enum(['hubject']).default('hubject'),
          hubject: z
            .object({
              baseUrl: z.string().default('https://open.plugncharge-test.hubject.com'),
              tokenUrl: z
                .string()
                .default(
                  'https://hubject.stoplight.io/api/v1/projects/cHJqOjk0NTg5/nodes/6bb8b3bc79c2e-authorization-token',
                ),
              isoVersion: z.enum(['ISO15118-2', 'ISO15118-20']).default('ISO15118-2'),
            })
            .optional(),
        })
        .refine((obj) => {
          if (obj.name === 'hubject') {
            return obj.hubject;
          } else {
            return false;
          }
        }),
      chargingStationCA: z
        .object({
          name: z.enum(['acme']).default('acme'),
          acme: z
            .object({
              env: z.enum(['staging', 'production']).default('staging'),
              accountKeyFilePath: z.string(),
              email: z.string(),
            })
            .optional(),
        })
        .refine((obj) => {
          if (obj.name === 'acme') {
            return obj.acme;
          } else {
            return false;
          }
        }),
    }),
  }),
  logLevel: z.number().min(0).max(6).default(0).optional(),
  maxCallLengthSeconds: z.number().int().positive().default(5).optional(),
  maxCachingSeconds: z.number().int().positive().default(10).optional(),
  ocpiServer: z.object({
    host: z.string().default('localhost').optional(),
    port: z.number().int().positive().default(8085).optional(),
  }),
  userPreferences: z.object({
    telemetryConsent: z.boolean().default(false).optional(),
  }),
  configFileName: z.string().default('config.json').optional(),
  configDir: z.string().optional(),
});

export type SystemConfigInput = z.infer<typeof systemConfigInputSchema>;

export const websocketServerSchema = z
  .object({
    // TODO: Add support for tenant ids on server level for tenant-specific behavior
    id: z.string(),
    host: z.string(),
    port: z.number().int().positive(),
    pingInterval: z.number().int().positive(),
    protocol: z.enum(['ocpp1.6', 'ocpp2.0.1']),
    securityProfile: z.number().int().min(0).max(3),
    allowUnknownChargingStations: z.boolean(),
    tlsKeyFilePath: z.string().optional(),
    tlsCertificateChainFilePath: z.string().optional(),
    mtlsCertificateAuthorityKeyFilePath: z.string().optional(),
    rootCACertificateFilePath: z.string().optional(),
  })
  .refine((obj) => {
    switch (obj.securityProfile) {
      case 0: // No security
      case 1: // Basic Auth
        return true;
      case 2: // Basic Auth + TLS
        return obj.tlsKeyFilePath && obj.tlsCertificateChainFilePath;
      case 3: // mTLS
        return (
          obj.tlsCertificateChainFilePath &&
          obj.tlsKeyFilePath &&
          obj.mtlsCertificateAuthorityKeyFilePath
        );
      default:
        return false;
    }
  });

export const systemConfigSchema = z
  .object({
    env: z.enum(['development', 'production']),
    centralSystem: z.object({
      host: z.string(),
      port: z.number().int().positive(),
    }),
    modules: z.object({
      certificates: z
        .object({
          endpointPrefix: z.string(),
          host: z.string().optional(),
          port: z.number().int().positive().optional(),
          requests: z.array(CallActionSchema),
          responses: z.array(CallActionSchema),
        })
        .optional(),
      evdriver: z.object({
        endpointPrefix: z.string(),
        host: z.string().optional(),
        port: z.number().int().positive().optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      }),
      configuration: z
        .object({
          heartbeatInterval: z.number().int().positive(),
          bootRetryInterval: z.number().int().positive(),
          ocpp2_0_1: z
            .object({
              unknownChargerStatus: z.enum([
                OCPP2_0_1.RegistrationStatusEnumType.Accepted,
                OCPP2_0_1.RegistrationStatusEnumType.Pending,
                OCPP2_0_1.RegistrationStatusEnumType.Rejected,
              ]), // Unknown chargers have no entry in BootConfig table
              getBaseReportOnPending: z.boolean(),
              bootWithRejectedVariables: z.boolean(),
              /**
               * If false, only data endpoint can update boot status to accepted
               */
              autoAccept: z.boolean(),
            })
            .optional(),
          ocpp1_6: z
            .object({
              unknownChargerStatus: z.enum([
                OCPP1_6.BootNotificationResponseStatus.Accepted,
                OCPP1_6.BootNotificationResponseStatus.Pending,
                OCPP1_6.BootNotificationResponseStatus.Rejected,
              ]), // Unknown chargers have no entry in BootConfig table
            })
            .optional(),
          endpointPrefix: z.string(),
          host: z.string().optional(),
          port: z.number().int().positive().optional(),
          requests: z.array(CallActionSchema),
          responses: z.array(CallActionSchema),
        })
        .refine((obj) => obj.ocpp1_6 || obj.ocpp2_0_1, {
          message: 'A protocol configuration must be set',
        }), // Configuration module is required
      monitoring: z.object({
        endpointPrefix: z.string(),
        host: z.string().optional(),
        port: z.number().int().positive().optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      }),
      reporting: z.object({
        endpointPrefix: z.string(),
        host: z.string().optional(),
        port: z.number().int().positive().optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      }),
      smartcharging: z
        .object({
          endpointPrefix: z.string(),
          host: z.string().optional(),
          port: z.number().int().positive().optional(),
          requests: z.array(CallActionSchema),
          responses: z.array(CallActionSchema),
        })
        .optional(),
      tenant: z.object({
        endpointPrefix: z.string(),
        host: z.string().optional(),
        port: z.number().int().positive().optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      }),
      transactions: z
        .object({
          endpointPrefix: z.string(),
          host: z.string().optional(),
          port: z.number().int().positive().optional(),
          costUpdatedInterval: z.number().int().positive().optional(),
          sendCostUpdatedOnMeterValue: z.boolean().optional(),
          requests: z.array(CallActionSchema),
          responses: z.array(CallActionSchema),
          signedMeterValuesConfiguration: z
            .object({
              publicKeyFileId: z.string(),
              signingMethod: z.enum(['RSASSA-PKCS1-v1_5', 'ECDSA']),
            })
            .optional(),
        })
        .refine(
          (obj) =>
            !(obj.costUpdatedInterval && obj.sendCostUpdatedOnMeterValue) &&
            (obj.costUpdatedInterval || obj.sendCostUpdatedOnMeterValue),
          {
            message:
              'Can only update cost based on the interval or in response to a transaction event /meter value' +
              ' update. Not allowed to have both costUpdatedInterval and sendCostUpdatedOnMeterValue configured',
          },
        ), // Transactions module is required
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
        alter: z.boolean().optional(),
        maxRetries: z.number().int().positive().optional(),
        retryDelay: z.number().int().positive().optional(),
      }),
    }),
    util: z.object({
      cache: z
        .object({
          memory: z.boolean().optional(),
          redis: z
            .object({
              host: z.string(),
              port: z.number().int().positive(),
            })
            .optional(),
        })
        .refine((obj) => obj.memory || obj.redis, {
          message: 'A cache implementation must be set',
        }),
      messageBroker: z
        .object({
          kafka: z
            .object({
              topicPrefix: z.string().optional(),
              topicName: z.string().optional(),
              brokers: z.array(z.string()),
              sasl: z.object({
                mechanism: z.string(),
                username: z.string(),
                password: z.string(),
              }),
            })
            .optional(),
          amqp: z
            .object({
              url: z.string(),
              exchange: z.string(),
            })
            .optional(),
        })
        .refine((obj) => obj.kafka || obj.amqp, {
          message: 'A message broker implementation must be set',
        }),
      fileAccess: z
        .object({
          s3: z
            .object({
              region: z.string().optional(),
              endpoint: z.string().optional(),
              defaultBucketName: z.string().default('citrineos-s3-bucket'),
              s3ForcePathStyle: z.boolean().default(true),
              accessKeyId: z.string().optional(),
              secretAccessKey: z.string().optional(),
            })
            .optional(),
          local: z
            .object({
              defaultFilePath: z.string().default('/data'),
            })
            .optional(),
          directus: z
            .object({
              host: z.string(),
              port: z.number().int().positive(),
              token: z.string().optional(),
              username: z.string().optional(),
              password: z.string().optional(),
              generateFlows: z.boolean(),
            })
            .optional(),
        })
        .refine((obj) => obj.s3 || obj.local || obj.directus, {
          message: 'A file access implementation must be set',
        })
        .refine(
          (obj) => {
            const implementations = [obj.s3, obj.local, obj.directus];
            const presentCount = implementations.filter(Boolean).length;
            return presentCount <= 1;
          },
          {
            message: 'Only one file access implementation should be set',
          },
        ),
      swagger: z
        .object({
          path: z.string(),
          logoPath: z.string(),
          exposeData: z.boolean(),
          exposeMessage: z.boolean(),
        })
        .optional(),
      networkConnection: z.object({
        websocketServers: z.array(websocketServerSchema).refine((array) => {
          const idsSeen = new Set<string>();
          return array.filter((obj) => {
            if (idsSeen.has(obj.id)) {
              return false;
            } else {
              idsSeen.add(obj.id);
              return true;
            }
          });
        }),
      }),
      certificateAuthority: z.object({
        v2gCA: z
          .object({
            name: z.enum(['hubject']),
            hubject: z
              .object({
                baseUrl: z.string(),
                tokenUrl: z.string(),
                isoVersion: z.enum(['ISO15118-2', 'ISO15118-20']),
              })
              .optional(),
          })
          .refine((obj) => {
            if (obj.name === 'hubject') {
              return obj.hubject;
            } else {
              return false;
            }
          }),
        chargingStationCA: z
          .object({
            name: z.enum(['acme']),
            acme: z
              .object({
                env: z.enum(['staging', 'production']),
                accountKeyFilePath: z.string(),
                email: z.string(),
              })
              .optional(),
          })
          .refine((obj) => {
            if (obj.name === 'acme') {
              return obj.acme;
            } else {
              return false;
            }
          }),
      }),
    }),
    logLevel: z.number().min(0).max(6),
    maxCallLengthSeconds: z.number().int().positive(),
    maxCachingSeconds: z.number().int().positive(),
    ocpiServer: z.object({
      host: z.string(),
      port: z.number().int().positive(),
    }),
    userPreferences: z.object({
      telemetryConsent: z.boolean().optional(),
    }),
    configFileName: z.string().default('config.json'),
    configDir: z.string().optional(),
  })
  .refine((obj) => obj.maxCachingSeconds >= obj.maxCallLengthSeconds, {
    message: 'maxCachingSeconds cannot be less than maxCallLengthSeconds',
  });

export type WebsocketServerConfig = z.infer<typeof websocketServerSchema>;
export type SystemConfig = z.infer<typeof systemConfigSchema>;
