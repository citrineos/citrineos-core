// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { EventGroup } from '../interfaces/messages/index.js';
import { OCPP1_6, OCPP2_0_1 } from '../ocpp/model/index.js';
import { OCPP_CallAction } from '../ocpp/rpc/message.js';

const CallActionSchema = z.nativeEnum(OCPP_CallAction);

export const oidcClientConfigSchema = z
  .object({
    tokenUrl: z.string(),
    clientId: z.string(),
    clientSecret: z.string(),
    audience: z.string(),
  })
  .optional();

const OCPP_VERSION_LIST: string[] = ['ocpp1.6', 'ocpp2.0.1', 'ocpp2.1'] as const;

// TODO: Refactor other objects out of system config, such as certificatesModuleInputSchema etc.
export const websocketServerInputSchema = z.object({
  id: z.string().optional(),
  host: z.string().default('localhost').optional(),
  port: z.number().int().min(1).default(8080).optional(),
  pingInterval: z.number().int().min(1).default(60).optional(),
  protocol: z.enum(OCPP_VERSION_LIST).default('ocpp2.0.1').optional(),
  securityProfile: z.number().int().min(0).max(3).default(0).optional(),
  allowUnknownChargingStations: z.boolean().default(false).optional(),
  tlsKeyFilePath: z.string().optional(), // Leaf certificate's private key pem which decrypts the message from client
  tlsCertificateChainFilePath: z.string().optional(), // Certificate chain pem consist of a leaf followed by sub CAs
  mtlsCertificateAuthorityKeyFilePath: z.string().optional(), // Sub CA's private key which signs the leaf (e.g.,
  // charging station certificate and csms certificate)
  rootCACertificateFilePath: z.string().optional(), // Root CA certificate that overrides default CA certificates
  // allowed by Mozilla
  tenantId: z.number(),
});

export const HUBJECT_DEFAULT_BASEURL = 'https://open.plugncharge-test.hubject.com';
export const HUBJECT_DEFAULT_TOKENURL =
  'https://hubject.stoplight.io/api/v1/projects/cHJqOjk0NTg5/nodes/6bb8b3bc79c2e-authorization-token';
export const HUBJECT_DEFAULT_CLIENTID = 'YOUR_CLIENT_ID';
export const HUBJECT_DEFAULT_CLIENTSECRET = 'YOUR_CLIENT_SECRET';
export const HUBJECT_DEFAULT_AUTH_TOKEN =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkJ3eEV0TkFGUnpSM3JlNVF2elM2QyJ9.eyJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vcm9sZSI6WyJBRE1JTiIsIk9FTSIsIkNQTyIsIk1PX0hVQkpFQ1RfUEtJIl0sImh0dHBzOi8vZXUucGx1Z25jaGFyZ2UtdGVzdC5odWJqZWN0LmNvbS9wY2lkIjpbIkhVQiIsImh1YiJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vZW1haWQiOlsiREVIVUIiLCJFTVA3NyJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vY2xpZW50X25hbWUiOlsiSHViamVjdCJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vZGFzaDIwIjpbInRydWUiXSwiaHR0cHM6Ly9ldS5wbHVnbmNoYXJnZS10ZXN0Lmh1YmplY3QuY29tL2NsaWVudF9hcHAiOiJPcGVuIFRlc3QgRW52aXJvbm1lbnQiLCJpc3MiOiJodHRwczovL2F1dGguZXUucGx1Z25jaGFyZ2UuaHViamVjdC5jb20vIiwic3ViIjoibzU3UWF3cTFvbms3VWtacmhGbUVxalNPTXFkaDM0UmdAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vZXUucGx1Z25jaGFyZ2UtdGVzdC5odWJqZWN0LmNvbSIsImlhdCI6MTc3MDcwMTgxMSwiZXhwIjoxNzcwNzg4MjExLCJzY29wZSI6InJjcHNlcnZpY2UgcGNwc2VydmljZSBjY3BzZXJ2aWNlIGNwc2VydmljZSBwa2lnYXRld2F5IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXpwIjoibzU3UWF3cTFvbms3VWtacmhGbUVxalNPTXFkaDM0UmciLCJwZXJtaXNzaW9ucyI6WyJyY3BzZXJ2aWNlIiwicGNwc2VydmljZSIsImNjcHNlcnZpY2UiLCJjcHNlcnZpY2UiLCJwa2lnYXRld2F5Il19.qpkB0reRKznCNXnbxCs0WMPCZx2ezo3Uv7vb0FW0qtMFHLF88IjzA0TUn4azD3zwjIG0N6rnTws4kzKkzwC-_XejCF-RvTEWKM4iUisdbl3Hz8nov0QmAME9U7BYJ52BHaQxP0S6o89qWRgtkzB63XRbbI_Z1fAh9Pzz-eVJePgD2GANNb8JqCzlV0vgyZU3jvdmVvJDYMyqyGe_lLlU5E0ocUntAWaP_TyrmRqctb5VB82WEdwdsRB5Wusqc5C0rLUwsySOff5gcDg5LXtGwUZtsA7TTtVQSqhQ1HrPVYhlKl-s5TZ-v7uho8wCnaCoJt6GPvZzKqHJHydBMlWDWg';

export const systemConfigInputSchema = z.object({
  env: z.enum(['development', 'production']),
  centralSystem: z.object({
    host: z.string().default('localhost').optional(),
    port: z.number().int().min(1).default(8081).optional(),
  }),
  modules: z.object({
    certificates: z
      .object({
        endpointPrefix: z.string().default(EventGroup.Certificates).optional(),
        host: z.string().default('localhost').optional(),
        port: z.number().int().min(1).default(8081).optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      })
      .optional(),
    configuration: z.object({
      heartbeatInterval: z.number().int().min(1).default(60).optional(),
      bootRetryInterval: z.number().int().min(1).default(10).optional(),
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
      port: z.number().int().min(1).default(8081).optional(),
    }),
    evdriver: z.object({
      endpointPrefix: z.string().default(EventGroup.EVDriver).optional(),
      host: z.string().default('localhost').optional(),
      port: z.number().int().min(1).default(8081).optional(),
      requests: z.array(CallActionSchema),
      responses: z.array(CallActionSchema),
    }),
    monitoring: z.object({
      endpointPrefix: z.string().default(EventGroup.Monitoring).optional(),
      host: z.string().default('localhost').optional(),
      port: z.number().int().min(1).default(8081).optional(),
      requests: z.array(CallActionSchema),
      responses: z.array(CallActionSchema),
    }),
    reporting: z.object({
      endpointPrefix: z.string().default(EventGroup.Reporting).optional(),
      host: z.string().default('localhost').optional(),
      port: z.number().int().min(1).default(8081).optional(),
      requests: z.array(CallActionSchema),
      responses: z.array(CallActionSchema),
    }),
    smartcharging: z
      .object({
        endpointPrefix: z.string().default(EventGroup.SmartCharging).optional(),
        host: z.string().default('localhost').optional(),
        port: z.number().int().min(1).default(8081).optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      })
      .optional(),
    tenant: z
      .object({
        endpointPrefix: z.string().default(EventGroup.Tenant).optional(),
        host: z.string().default('localhost').optional(),
        port: z.number().int().min(1).default(8081).optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      })
      .optional(),
    transactions: z.object({
      endpointPrefix: z.string().default(EventGroup.Transactions).optional(),
      requests: z.array(CallActionSchema),
      responses: z.array(CallActionSchema),
      host: z.string().default('localhost').optional(),
      port: z.number().int().min(1).default(8081).optional(),
      costUpdatedInterval: z.number().int().min(1).default(60).optional(),
      sendCostUpdatedOnMeterValue: z.boolean().default(false).optional(),
      signedMeterValuesConfiguration: z
        .object({
          publicKeyFileId: z.string(),
          signingMethod: z.enum(['RSASSA-PKCS1-v1_5', 'ECDSA']),
        })
        .optional(),
    }),
  }),
  util: z.object({
    cache: z
      .object({
        memory: z.boolean().optional(),
        redis: z
          .union([
            z.object({
              host: z.string().default('localhost').optional(),
              port: z.number().int().min(1).default(6379).optional(),
            }),
            z.object({
              url: z.url().refine((v) => v.startsWith('redis://') || v.startsWith('rediss://'), {
                message: 'Redis URL must start with redis:// or rediss://',
              }),
            }),
          ])
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
    authProvider: z
      .object({
        oidc: z
          .object({
            jwksUri: z.string(),
            issuer: z.string(),
            audience: z.string(),
            cacheTime: z.number().int().min(1).optional(),
            rateLimit: z.boolean().default(false).optional(),
          })
          .optional(),
        localByPass: z.boolean().default(false).optional(),
      })
      .refine((obj) => obj.oidc || obj.localByPass, {
        message: 'An auth provider implementation must be set',
      }),
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
              baseUrl: z.string().default(HUBJECT_DEFAULT_BASEURL),
              tokenUrl: z.string().default(HUBJECT_DEFAULT_TOKENURL),
              clientId: z.string().default(HUBJECT_DEFAULT_CLIENTID),
              clientSecret: z.string().default(HUBJECT_DEFAULT_CLIENTSECRET),
            })
            .optional(),
        })
        .refine(
          (obj) => {
            if (obj.name === 'hubject') {
              return (
                obj.hubject &&
                obj.hubject.baseUrl &&
                obj.hubject.tokenUrl &&
                obj.hubject.clientId &&
                obj.hubject.clientSecret
              );
            } else {
              return false;
            }
          },
          {
            message: 'Hubject requires baseUrl, tokenUrl, clientId, and clientSecret',
          },
        ),
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
  maxCallLengthSeconds: z.number().int().min(1).default(20).optional(),
  maxCachingSeconds: z.number().int().min(1).default(30).optional(),
  maxReconnectDelay: z.number().int().min(1).default(30).optional(),
  ocpiServer: z.object({
    host: z.string().default('localhost').optional(),
    port: z.number().int().min(1).default(8085).optional(),
  }),
  userPreferences: z.object({
    telemetryConsent: z.boolean().default(false).optional(),
  }),
  rbacRulesFileName: z.string().default('rbac-rules.json').optional(),
  rbacRulesDir: z.string().optional(),
  realTimeAuthDefaultTimeoutSeconds: z.number().int().min(1).default(15).optional(),
});

export type SystemConfigInput = z.infer<typeof systemConfigInputSchema>;

export const websocketServerSchema = z
  .object({
    id: z.string(),
    host: z.string(),
    port: z.number().int().min(1),
    pingInterval: z.number().int().min(1),
    protocol: z.enum(OCPP_VERSION_LIST),
    securityProfile: z.number().int().min(0).max(3),
    allowUnknownChargingStations: z.boolean(),
    tlsKeyFilePath: z.string().optional(),
    tlsCertificateChainFilePath: z.string().optional(),
    mtlsCertificateAuthorityKeyFilePath: z.string().optional(),
    rootCACertificateFilePath: z.string().optional(),
    tenantId: z.number(),
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
      port: z.number().int().min(1),
    }),
    modules: z.object({
      certificates: z
        .object({
          endpointPrefix: z.string(),
          host: z.string().optional(),
          port: z.number().int().min(1).optional(),
          requests: z.array(CallActionSchema),
          responses: z.array(CallActionSchema),
        })
        .optional(),
      evdriver: z.object({
        endpointPrefix: z.string(),
        host: z.string().optional(),
        port: z.number().int().min(1).optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      }),
      configuration: z
        .object({
          heartbeatInterval: z.number().int().min(1),
          bootRetryInterval: z.number().int().min(1),
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
          port: z.number().int().min(1).optional(),
          requests: z.array(CallActionSchema),
          responses: z.array(CallActionSchema),
        })
        .refine((obj) => obj.ocpp1_6 || obj.ocpp2_0_1, {
          message: 'A protocol configuration must be set',
        }), // Configuration module is required
      monitoring: z.object({
        endpointPrefix: z.string(),
        host: z.string().optional(),
        port: z.number().int().min(1).optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      }),
      reporting: z.object({
        endpointPrefix: z.string(),
        host: z.string().optional(),
        port: z.number().int().min(1).optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      }),
      smartcharging: z
        .object({
          endpointPrefix: z.string(),
          host: z.string().optional(),
          port: z.number().int().min(1).optional(),
          requests: z.array(CallActionSchema),
          responses: z.array(CallActionSchema),
        })
        .optional(),
      tenant: z.object({
        endpointPrefix: z.string(),
        host: z.string().optional(),
        port: z.number().int().min(1).optional(),
        requests: z.array(CallActionSchema),
        responses: z.array(CallActionSchema),
      }),
      transactions: z
        .object({
          endpointPrefix: z.string(),
          host: z.string().optional(),
          port: z.number().int().min(1).optional(),
          costUpdatedInterval: z.number().int().min(1).optional(),
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
        ),
    }),
    util: z.object({
      cache: z
        .object({
          memory: z.boolean().optional(),
          redis: z
            .union([
              z.object({
                host: z.string(),
                port: z.number().int().min(1),
              }),
              z.object({
                url: z.url().refine((v) => v.startsWith('redis://') || v.startsWith('rediss://'), {
                  message: 'Redis URL must start with redis:// or rediss://',
                }),
              }),
            ])
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
      authProvider: z
        .object({
          oidc: z
            .object({
              jwksUri: z.string(),
              issuer: z.string(),
              audience: z.string(),
              cacheTime: z.number().int().min(1).optional(),
              rateLimit: z.boolean(),
            })
            .optional(),
          localByPass: z.boolean().default(false).optional(),
        })
        .refine((obj) => obj.oidc || obj.localByPass, {
          message: 'An auth provider implementation must be set',
        }),
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
                clientId: z.string(),
                clientSecret: z.string(),
              })
              .optional(),
          })
          .refine(
            (obj) => {
              if (obj.name === 'hubject') {
                return (
                  obj.hubject &&
                  obj.hubject.baseUrl &&
                  obj.hubject.tokenUrl &&
                  obj.hubject.clientId &&
                  obj.hubject.clientSecret
                );
              } else {
                return false;
              }
            },
            {
              message: 'Hubject requires baseUrl, tokenUrl, clientId, and clientSecret',
            },
          ),
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
    maxCallLengthSeconds: z.number().int().min(1),
    maxCachingSeconds: z.number().int().min(1),
    maxReconnectDelay: z.number().int().min(1).default(30),
    ocpiServer: z.object({
      host: z.string(),
      port: z.number().int().min(1),
    }),
    userPreferences: z.object({
      telemetryConsent: z.boolean().optional(),
    }),
    rbacRulesFileName: z.string().optional(),
    rbacRulesDir: z.string().optional(),
    oidcClient: oidcClientConfigSchema,
    realTimeAuthDefaultTimeoutSeconds: z.number().int().min(1).default(15),
  })
  .refine((obj) => obj.maxCachingSeconds >= obj.maxCallLengthSeconds, {
    message: 'maxCachingSeconds cannot be less than maxCallLengthSeconds',
  });

export const HttpMethodSchema = z.record(
  z.string(), // HTTP method (GET, POST, etc., or * for all methods)
  z.array(z.string()), // Array of role names required for this method
);

export const UrlPatternSchema = z.record(
  z.string(), // URL pattern (/api/users, /api/users/:id, etc.)
  HttpMethodSchema,
);

export const TenantSchema = z.record(
  z.string(), // Tenant ID
  UrlPatternSchema,
);

export const RbacRulesSchema = TenantSchema;

export type RbacRules = z.infer<typeof RbacRulesSchema>;

export type WebsocketServerConfig = z.infer<typeof websocketServerSchema>;
export type SystemConfig = z.infer<typeof systemConfigSchema>;
