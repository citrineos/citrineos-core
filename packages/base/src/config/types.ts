// config/schema.ts
import {
  OCPP1_6,
  OCPP_VERSION_LIST,
  RegistrationStatusEnum,
  signedMeterValuesSigningMethods,
} from '@citrineos/types';
import { z } from 'zod';

// ─── Websocket server (loaded from file, defined here for schema completeness) ───

export const websocketServerSchema = z
  .object({
    id: z.string(),
    host: z.string(),
    port: z.number().int().min(1),
    pingInterval: z.number().int().min(1).default(60),
    protocols: z.array(z.enum(OCPP_VERSION_LIST)),
    securityProfile: z.number().int().min(0).max(3),
    allowUnknownChargingStations: z.boolean().default(false),
    ignoreAuthenticationHeaders: z.boolean().default(false),
    tlsKeyFilePath: z.string().optional(),
    tlsCertificateChainFilePath: z.string().optional(),
    mtlsCertificateAuthorityKeyFilePath: z.string().optional(),
    rootCACertificateFilePath: z.string().optional(),
    tenantId: z.number().int().positive().optional(),
    dynamicTenantResolution: z.boolean().default(false),
    forceProtocol: z.enum(OCPP_VERSION_LIST).optional(),
  })
  .refine(
    (o) => {
      switch (o.securityProfile) {
        case 0:
        case 1:
          return true;
        case 2:
          return !!(o.tlsKeyFilePath && o.tlsCertificateChainFilePath);
        case 3:
          return !!(
            o.tlsKeyFilePath &&
            o.tlsCertificateChainFilePath &&
            o.mtlsCertificateAuthorityKeyFilePath
          );
        default:
          return false;
      }
    },
    { message: 'TLS/mTLS files required for the chosen securityProfile' },
  )
  .refine((o) => (o.tenantId !== undefined) !== o.dynamicTenantResolution, {
    message: 'Exactly one of tenantId or dynamicTenantResolution must be set',
  });

export type WebsocketServerConfig = z.infer<typeof websocketServerSchema>;

// ─── Main static config ───

export const configSchema = z.object({
  env: z.enum(['development', 'production']).default('development'),

  // Websocket servers this pod hosts. Loaded from a mounted file, not env vars.
  websocketServers: z
    .array(websocketServerSchema)
    .refine((arr) => new Set(arr.map((s) => s.id)).size === arr.length, {
      message: 'Websocket server ids must be unique',
    }),

  database: z.object({
    host: z.string().default('localhost'),
    port: z.number().int().positive().default(5432),
    database: z.string().default('citrine'),
    dialect: z.string().default('postgres'),
    username: z.string().default('citrine'),
    password: z.string().default('citrine'),
    pool: z
      .object({
        max: z.number().int().positive().optional(),
        min: z.number().int().nonnegative().optional(),
        acquire: z.number().int().positive().optional(),
        idle: z.number().int().positive().optional(),
      })
      .optional(),
    sync: z.boolean().default(false),
    alter: z.boolean().default(false),
    force: z.boolean().default(false),
    maxRetries: z.number().int().positive().default(3),
    retryDelay: z.number().int().positive().default(1000),
    ssl: z
      .object({
        require: z.boolean().optional(),
        rejectUnauthorized: z.boolean().optional(),
        ca: z.string().optional(),
      })
      .optional(),
  }),

  cache: z
    .discriminatedUnion('type', [
      z.object({ type: z.literal('memory') }),
      z.object({
        type: z.literal('redis'),
        url: z.string().refine((v) => v.startsWith('redis://') || v.startsWith('rediss://'), {
          message: 'Redis URL must start with redis:// or rediss://',
        }),
      }),
    ])
    .default({ type: 'memory' }),

  messageBroker: z.object({
    amqp: z.object({
      url: z.string().default('amqp://guest:guest@localhost:5672'),
      exchange: z.string().default('citrineos'),
      instanceIdentifier: z.string().optional(),
      maxReconnectDelaySeconds: z.number().int().min(1).default(30),
    }),
  }),

  fileAccess: z
    .object({
      type: z.enum(['local', 's3', 'gcp']).default('local'),
      local: z.object({ defaultFilePath: z.string().default('data') }).optional(),
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
      gcp: z
        .object({
          projectId: z.string(),
          credentials: z.record(z.string(), z.unknown()).optional(),
        })
        .optional(),
    })
    .refine((o) => (o.type === 'local' ? !!o.local : o.type === 's3' ? !!o.s3 : !!o.gcp), {
      message: 'Config for the selected fileAccess.type must be provided',
    })
    .default({ type: 'local', local: { defaultFilePath: 'data' } }),

  auth: z
    .object({
      oidc: z
        .object({
          jwksUri: z.string(),
          issuer: z.string(),
          audience: z.string(),
          cacheTimeSeconds: z.number().int().min(1).optional(),
          rateLimit: z.boolean().default(true),
        })
        .optional(),
      localBypass: z.boolean().default(false),
    })
    .refine((o) => o.oidc || o.localBypass, {
      message: 'Either oidc config or localBypass must be enabled',
    }),
  oidcClient: z
    .object({
      tokenUrl: z.string(),
      clientId: z.string(),
      clientSecret: z.string(),
      audience: z.string(),
    })
    .optional(),

  integrations: z.object({
    v2gCA: z
      .object({
        name: z.literal('hubject'),
        hubject: z.object({
          baseUrl: z.string(),
          tokenUrl: z.string(),
          clientId: z.string(),
          clientSecret: z.string(),
        }),
      })
      .optional(),
    chargingStationCA: z
      .object({
        name: z.literal('acme'),
        acme: z.object({
          env: z.enum(['staging', 'production']),
          accountKeyFilePath: z.string(),
          email: z.string().email(),
        }),
      })
      .optional(),
  }),

  rbac: z
    .object({
      rulesDir: z.string().optional(),
      rulesFileName: z.string().optional(),
    })
    .optional(),

  swagger: z
    .object({
      path: z.string().default('/docs'),
      logoPath: z.string(),
      exposeData: z.boolean().default(false),
      exposeMessage: z.boolean().default(false),
    })
    .optional(),

  // ─── Tunables ───

  logLevel: z.number().int().min(0).max(6).default(2),

  timeouts: z
    .object({
      maxCallLengthSeconds: z.number().int().min(1).default(30),
      maxCachingSeconds: z.number().int().min(1).default(300),
      shutdownGracePeriodSeconds: z.number().int().min(1).default(30),
      realTimeAuthDefaultTimeoutSeconds: z.number().int().min(1).default(15),
      notReadyThresholdSeconds: z.number().int().min(1).default(60),
    })
    .refine((t) => t.maxCachingSeconds >= t.maxCallLengthSeconds, {
      message: 'maxCachingSeconds cannot be less than maxCallLengthSeconds',
    }),

  ocpp: z
    .object({
      heartbeatInterval: z.number().int().min(1).default(60),
      bootRetryInterval: z.number().int().min(1).default(30),

      v1_6: z
        .object({
          unknownChargerStatus: z
            .enum([
              OCPP1_6.BootNotificationResponseStatus.Accepted,
              OCPP1_6.BootNotificationResponseStatus.Pending,
              OCPP1_6.BootNotificationResponseStatus.Rejected,
            ])
            .default(OCPP1_6.BootNotificationResponseStatus.Pending),
        })
        .optional(),

      v2_0_1: z
        .object({
          unknownChargerStatus: z
            .enum([
              RegistrationStatusEnum.Accepted,
              RegistrationStatusEnum.Pending,
              RegistrationStatusEnum.Rejected,
            ])
            .default(RegistrationStatusEnum.Pending),
          getBaseReportOnPending: z.boolean().default(true),
          bootWithRejectedVariables: z.boolean().default(false),
          autoAccept: z.boolean().default(false),
        })
        .optional(),

      v2_1: z
        .object({
          unknownChargerStatus: z
            .enum([
              RegistrationStatusEnum.Accepted,
              RegistrationStatusEnum.Pending,
              RegistrationStatusEnum.Rejected,
            ])
            .default(RegistrationStatusEnum.Pending),
          getBaseReportOnPending: z.boolean().default(true),
          bootWithRejectedVariables: z.boolean().default(false),
          autoAccept: z.boolean().default(false),
        })
        .optional(),
    })
    .refine((o) => o.v1_6 || o.v2_0_1 || o.v2_1, {
      message: 'At least one OCPP protocol version must be configured',
    }),

  transactions: z
    .object({
      costUpdatedInterval: z.number().int().min(1).optional(),
      sendCostUpdatedOnMeterValue: z.boolean().optional(),
      receiptBaseUrl: z.string().url().optional(),
      signedMeterValues: z
        .object({
          publicKeyFileId: z.string(),
          signingMethod: z.enum(signedMeterValuesSigningMethods),
          rejectUnsupportedSignedMeterValues: z.boolean().default(false),
        })
        .optional(),
    })
    .refine(
      (o) =>
        !(o.costUpdatedInterval && o.sendCostUpdatedOnMeterValue) &&
        (o.costUpdatedInterval || o.sendCostUpdatedOnMeterValue),
      {
        message:
          'Exactly one of transactions.costUpdatedInterval or transactions.sendCostUpdatedOnMeterValue must be set',
      },
    ),

  evdriver: z
    .object({
      enableGetChargingProfilesOnStartTransaction: z.boolean().default(false),
    })
    .default({
      enableGetChargingProfilesOnStartTransaction: false,
    }),

  telemetry: z
    .object({
      consent: z.boolean().optional(),
    })
    .default({}),
});

export type Config = z.infer<typeof configSchema>;
