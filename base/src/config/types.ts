// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { RegistrationStatusEnum } from '@interfaces/dto/types/enums.js';
import { EventGroup } from '@interfaces/messages/internal-types.js';
import { OCPP1_6 } from '@ocpp/model/index.js';
import { OCPP_CallAction, OCPPVersion, type OCPPVersionType } from '@ocpp/rpc/message.js';
import { z } from 'zod';

const CallActionSchema = z.nativeEnum(OCPP_CallAction);

export const oidcClientConfigSchema = z
  .object({
    tokenUrl: z.string(),
    clientId: z.string(),
    clientSecret: z.string(),
    audience: z.string(),
  })
  .optional();

export const OCPP_VERSION_LIST: OCPPVersionType[] = [
  OCPPVersion.OCPP2_1,
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP1_6,
] as const;

const signedMeterValuesSigningMethods = ['RSASSA-PKCS1-v1_5', 'ECDSA', 'SECP192R1'] as const;

// TODO: Refactor other objects out of system config, such as certificatesModuleInputSchema etc.
export const websocketServerInputSchema = z.object({
  id: z.string().optional(),
  host: z.string().default('localhost').optional(),
  port: z.number().int().min(1).default(8080).optional(),
  pingInterval: z.number().int().min(1).default(60).optional(),
  protocols: z.array(z.enum(OCPP_VERSION_LIST)).default(['ocpp2.0.1']).optional(),
  securityProfile: z.number().int().min(0).max(3).default(0).optional(),
  allowUnknownChargingStations: z.boolean().default(false).optional(),
  ignoreAuthenticationHeaders: z.boolean().default(false).optional(), // When true, authorization headers will be ignored and authentication will be bypassed.
  tlsKeyFilePath: z.string().optional(), // Leaf certificate's private key pem which decrypts the message from client
  tlsCertificateChainFilePath: z.string().optional(), // Certificate chain pem consist of a leaf followed by sub CAs
  mtlsCertificateAuthorityKeyFilePath: z.string().optional(), // Sub CA's private key which signs the leaf (e.g.,
  // charging station certificate and csms certificate)
  rootCACertificateFilePath: z.string().optional(), // Root CA certificate that overrides default CA certificates
  // allowed by Mozilla
  tenantId: z.number().optional(),
  // Mapping from path segments to tenant IDs.
  // Example: { "my-tenant": 1 }
  tenantPathMapping: z.record(z.string(), z.number()).optional(),
  // When true, tenant can be resolved at connection upgrade time from the request
  // (query param, path segment, or header). Defaults to false for strict per-server tenant.
  dynamicTenantResolution: z.boolean().optional().default(false),
  // Forces a set protocol to communicate on, mostly used for dev purposes
  forceProtocol: z.enum(OCPP_VERSION_LIST).optional(),
});

export const HUBJECT_DEFAULT_BASEURL = 'https://open.plugncharge-test.hubject.com';
export const HUBJECT_DEFAULT_TOKENURL =
  'https://hubject.stoplight.io/api/v1/projects/cHJqOjk0NTg5/nodes/6bb8b3bc79c2e-authorization-token';
export const HUBJECT_DEFAULT_CLIENTID = 'YOUR_CLIENT_ID';
export const HUBJECT_DEFAULT_CLIENTSECRET = 'YOUR_CLIENT_SECRET';

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
              RegistrationStatusEnum.Accepted,
              RegistrationStatusEnum.Pending,
              RegistrationStatusEnum.Rejected,
            ])
            .default(RegistrationStatusEnum.Accepted)
            .optional(), // Unknown chargers have no entry in BootConfig table
          getBaseReportOnPending: z.boolean().default(true).optional(),
          bootWithRejectedVariables: z.boolean().default(true).optional(),
          autoAccept: z.boolean().default(true).optional(), // If false, only data endpoint can update boot status to accepted
        })
        .optional(),
      ocpp2_1: z
        .object({
          unknownChargerStatus: z
            .enum([
              RegistrationStatusEnum.Accepted,
              RegistrationStatusEnum.Pending,
              RegistrationStatusEnum.Rejected,
            ])
            .default(RegistrationStatusEnum.Accepted)
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
      enableGetChargingProfilesOnStartTransaction: z.boolean().default(true).optional(),
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
        ocppRouterBaseUrl: z.string().optional(),
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
          signingMethod: z.enum(signedMeterValuesSigningMethods),
          rejectUnsupportedSignedMeterValues: z.boolean().default(false).optional(),
        })
        .optional(),
      /** Base URL for generating receipt URLs when ReceiptByCSMS is true (C21). */
      receiptBaseUrl: z.string().optional(),
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
        amqp: z
          .object({
            url: z.string(),
            exchange: z.string(),
            instanceIdentifier: z.string().optional(),
          })
          .optional(),
      })
      .refine((obj) => obj.amqp, {
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
  shutdownGracePeriodSeconds: z.number().int().min(1).default(30).optional(),
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
  notReadyThresholdSeconds: z.number().int().min(1).default(60).optional(),
});

export type SystemConfigInput = z.infer<typeof systemConfigInputSchema>;

export const websocketServerSchema = z
  .object({
    id: z.string(),
    host: z.string(),
    port: z.number().int().min(1),
    pingInterval: z.number().int().min(1),
    protocols: z.array(z.enum(OCPP_VERSION_LIST)),
    securityProfile: z.number().int().min(0).max(3),
    allowUnknownChargingStations: z.boolean(),
    ignoreAuthenticationHeaders: z.boolean().default(false).optional(),
    tlsKeyFilePath: z.string().optional(),
    tlsCertificateChainFilePath: z.string().optional(),
    mtlsCertificateAuthorityKeyFilePath: z.string().optional(),
    rootCACertificateFilePath: z.string().optional(),
    tenantId: z.number().optional(),
    tenantPathMapping: z.record(z.string(), z.number()).optional(),
    // When true, tenant can be resolved at connection upgrade time from the request
    // (query param, path segment, or header). Defaults to false for strict per-server tenant.
    dynamicTenantResolution: z.boolean().optional().default(false),
    forceProtocol: z.enum(OCPP_VERSION_LIST).optional(),
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
  })
  .refine((obj) => {
    if ((obj.tenantId !== undefined) === obj.dynamicTenantResolution) {
      return false; // Cannot have both or neither tenantId and dynamicTenantResolution
    } else {
      return true;
    }
  }, 'Invalid websocket server configuration: tenantId and dynamicTenantResolution are mutually exclusive and one must be set');

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
        enableGetChargingProfilesOnStartTransaction: z.boolean().optional(),
      }),
      configuration: z
        .object({
          heartbeatInterval: z.number().int().min(1),
          bootRetryInterval: z.number().int().min(1),
          ocpp2_0_1: z
            .object({
              unknownChargerStatus: z.enum([
                RegistrationStatusEnum.Accepted,
                RegistrationStatusEnum.Pending,
                RegistrationStatusEnum.Rejected,
              ]), // Unknown chargers have no entry in BootConfig table
              getBaseReportOnPending: z.boolean(),
              bootWithRejectedVariables: z.boolean(),
              /**
               * If false, only data endpoint can update boot status to accepted
               */
              autoAccept: z.boolean(),
            })
            .optional(),
          ocpp2_1: z
            .object({
              unknownChargerStatus: z.enum([
                RegistrationStatusEnum.Accepted,
                RegistrationStatusEnum.Pending,
                RegistrationStatusEnum.Rejected,
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
        .refine((obj) => obj.ocpp1_6 || obj.ocpp2_0_1 || obj.ocpp2_1, {
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
        ocppRouterBaseUrl: z.string().optional(),
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
              signingMethod: z.enum(signedMeterValuesSigningMethods),
              rejectUnsupportedSignedMeterValues: z.boolean().optional(),
            })
            .optional(),
          /** Base URL for generating receipt URLs when ReceiptByCSMS is true (C21). */
          receiptBaseUrl: z.string().optional(),
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
          amqp: z
            .object({
              url: z.string(),
              exchange: z.string(),
              instanceIdentifier: z.string().optional(),
            })
            .optional(),
        })
        .refine((obj) => obj.amqp, {
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
    shutdownGracePeriodSeconds: z.number().int().min(1).default(30),
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
    notReadyThresholdSeconds: z.number().int().min(1).default(60),
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
