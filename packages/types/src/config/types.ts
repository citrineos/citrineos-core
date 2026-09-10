// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { RegistrationStatusEnum } from '@interfaces/dto/types/enums.js';
import { OCPPVersion, type OCPPVersionType } from '@ocpp/rpc/message.js';
import { z } from 'zod';

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

export const signedMeterValuesSigningMethods = ['RSASSA-PKCS1-v1_5', 'ECDSA', 'SECP192R1'] as const;

export const HUBJECT_DEFAULT_BASEURL = 'https://open.plugncharge-test.hubject.com';
export const HUBJECT_DEFAULT_TOKENURL =
  'https://hubject.stoplight.io/api/v1/projects/cHJqOjk0NTg5/nodes/6bb8b3bc79c2e-authorization-token';
export const HUBJECT_DEFAULT_CLIENTID = 'YOUR_CLIENT_ID';
export const HUBJECT_DEFAULT_CLIENTSECRET = 'YOUR_CLIENT_SECRET';

export const websocketServerSchema = z
  .object({
    id: z.string(),
    host: z.string(),
    port: z.number().int().min(1),
    pingInterval: z.number().int().min(1).default(60),
    protocols: z.array(z.enum(OCPP_VERSION_LIST)),
    securityProfile: z.number().int().min(0).max(3),
    allowUnknownChargingStations: z.boolean().default(false),
    ignoreAuthenticationHeaders: z.boolean().default(false).optional(),
    tlsKeyFilePath: z.string().optional(),
    tlsCertificateChainFilePath: z.string().optional(),
    mtlsCertificateAuthorityKeyFilePath: z.string().optional(),
    rootCACertificateFilePath: z.string().optional(),
    tenantId: z.number().int().positive().optional(),
    // When true, tenant is resolved at connection upgrade time from the request path
    // segment, matched against Tenant.tenantWebsocketServerPath. Defaults to false for
    // strict per-server tenant.
    dynamicTenantResolution: z.boolean().optional().default(false),
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

// Websocket servers this pod hosts. Loaded from a mounted file, not env vars.
export const websocketServersConfigSchema = z
  .array(websocketServerSchema)
  .refine((arr) => new Set(arr.map((s) => s.id)).size === arr.length, {
    message: 'Websocket server ids must be unique',
  });

/**
 * What to strip from logs, for the redaction the logger applies to every message it writes.
 *
 * `keys`, `paths` and `patterns` are handed to tslog's masking engine, which walks each logged
 * value and censors what matches. They are additive: a value is censored if any of them matches it.
 * Configuring these needs no code change — that is the point of putting them here.
 */
export const logRedactionSchema = z
  .object({
    /**
     * Property names whose values are censored wherever they appear, at any depth. Matched
     * case-insensitively, so `password` also covers `Password`.
     */
    keys: z.array(z.string()).default(['password']),

    /**
     * Dotted paths whose value is censored, where `*` matches exactly one segment — e.g.
     * `certificate.privateKey` or `*.token`. A path must name the full depth of the value it
     * targets; use `keys` for a name that can appear anywhere.
     */
    paths: z.array(z.string()).default([]),

    /**
     * Regular expressions matched against every logged string, censoring the parts that match. Use
     * these for values recognizable by shape rather than by where they sit — a bearer token, say.
     * Each is applied globally, so every occurrence in a string is censored, not just the first.
     */
    patterns: z
      .array(
        z.string().refine(
          (source) => {
            try {
              new RegExp(source);
              return true;
            } catch {
              return false;
            }
          },
          { message: 'must be a valid regular expression' },
        ),
      )
      .default([]),

    /** What a censored value is replaced with. */
    placeholder: z.string().default('[***]'),

    /**
     * Whether to redact OCPP `KeyCode` idTokens — the PIN a driver typed at the Charging Station.
     * OCPP 2.x C04.FR.04 requires that these never appear in logging, so this defaults on; it is
     * configurable because only a deployment can decide it is running somewhere the rule is moot.
     *
     * Unlike the settings above, this one cannot be expressed as a key, path or pattern: whether an
     * `idToken` is a key code depends on its sibling `type` field, so it is applied by a rule that
     * inspects the surrounding object. See `keyCodeRedactionRule` in `@citrineos/ocpp`.
     */
    redactKeyCodes: z.boolean().default(true),
  })
  .prefault({});

/** What to strip from logs. See {@link logRedactionSchema}. */
export type LogRedactionConfig = z.infer<typeof logRedactionSchema>;

// ─── Main static config ───

export const configSchema = z.object({
  env: z.enum(['development', 'production']).default('development'),

  host: z.string().default('0.0.0.0'),
  port: z.number().int().positive().default(8080),

  database: z
    .object({
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
      schema: z.string().default('public'),
      // Verify at startup that the live schema still matches the Sequelize models
      // and refuse to start if it does not. `validateSchemaSeverity: 'warn'`
      // reports drift without blocking startup, for rolling this out onto an
      // existing deployment before switching it to a hard gate.
      validateSchema: z.boolean().default(true),
      validateSchemaSeverity: z.enum(['error', 'warn']).default('error'),
    })
    .prefault({}),

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

  messageBroker: z
    .object({
      amqp: z
        .object({
          url: z.string().default('amqp://guest:guest@localhost:5672'),
          exchange: z.string().default('citrineos'),
          instanceIdentifier: z.string().optional(),
          maxReconnectDelaySeconds: z.number().int().min(1).default(30),
        })
        .prefault({}),
    })
    .prefault({}),

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
          defaultBucketName: z.string().default('citrineos-s3-bucket'),
          credentials: z.record(z.string(), z.unknown()).optional(),
        })
        .optional(),
    })
    .refine((o) => (o.type === 'local' ? !!o.local : o.type === 's3' ? !!o.s3 : !!o.gcp), {
      message: 'Config for the selected fileAccess.type must be provided',
    })
    .default({ type: 'local', local: { defaultFilePath: 'src/assets' } }),

  websocketServerConfigFile: z.string().default('websocket-servers.json'),

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
    })
    .prefault({ localBypass: true }),
  oidcClient: z
    .object({
      tokenUrl: z.string(),
      clientId: z.string(),
      clientSecret: z.string(),
      audience: z.string(),
    })
    .optional(),

  integrations: z
    .object({
      // Opt-in, but zero-config: `v2gCA: {}` yields the Hubject test PKI.
      // From the environment: CITRINEOS_INTEGRATIONS_V2GCA='{}'
      v2gCA: z
        .object({
          name: z.literal('hubject').default('hubject'),
          hubject: z
            .object({
              baseUrl: z.string().default(HUBJECT_DEFAULT_BASEURL),
              tokenUrl: z.string().default(HUBJECT_DEFAULT_TOKENURL),
              clientId: z.string().default(HUBJECT_DEFAULT_CLIENTID),
              clientSecret: z.string().default(HUBJECT_DEFAULT_CLIENTSECRET),
            })
            .prefault({}),
        })
        .optional(),
      // Opt-in, but zero-config: `chargingStationCA: {}` yields ACME against the
      // Let's Encrypt staging directory.
      // From the environment: CITRINEOS_INTEGRATIONS_CHARGINGSTATIONCA='{}'
      chargingStationCA: z
        .object({
          name: z.literal('acme').default('acme'),
          acme: z
            .object({
              env: z.enum(['staging', 'production']).default('staging'),
              accountKeyFilePath: z.string().default('certificates/acme_account_key.pem'),
              email: z.string().email().default('test@citrineos.com'),
            })
            .prefault({}),
        })
        .optional(),
    })
    .prefault({}),

  rbac: z
    .object({
      rulesDir: z.string().optional(),
      rulesFileName: z.string().default('rbac-rules.json'),
    })
    .optional(),

  // logoPath is resolved from the process working directory, not from fileAccess.
  swagger: z
    .object({
      enabled: z.boolean().default(true),
      path: z.string().default('/docs'),
      logoPath: z.string().default('src/assets/logo.png'),
      exposeData: z.boolean().default(true),
      exposeMessage: z.boolean().default(true),
    })
    .prefault({}),

  // ─── Tunables ───

  logLevel: z.number().int().min(0).max(6).default(2),

  logRedaction: logRedactionSchema,

  timeouts: z
    .object({
      maxCallLengthSeconds: z.number().int().min(1).default(20),
      maxCachingSeconds: z.number().int().min(1).default(30),
      staleCallMaxAgeSeconds: z.number().int().min(1).optional(),
      shutdownGracePeriodSeconds: z.number().int().min(1).default(30),
      realTimeAuthDefaultTimeoutSeconds: z.number().int().min(1).default(15),
      realTimeAuthRequestTimeoutSeconds: z.number().int().min(1).default(10),
      notReadyThresholdSeconds: z.number().int().min(1).default(60),
    })
    .refine((t) => t.maxCachingSeconds >= t.maxCallLengthSeconds, {
      message: 'maxCachingSeconds cannot be less than maxCallLengthSeconds',
    })
    .prefault({}),

  ocpp: z
    .object({
      heartbeatInterval: z.number().int().min(1).default(60),
      bootRetryInterval: z.number().int().min(1).default(15),
      unknownChargerStatus: z
        .enum([
          RegistrationStatusEnum.Accepted,
          RegistrationStatusEnum.Pending,
          RegistrationStatusEnum.Rejected,
        ])
        .default(RegistrationStatusEnum.Accepted),
      getBaseReportOnPending: z.boolean().default(true),
      bootWithRejectedVariables: z.boolean().default(false),
      autoAccept: z.boolean().default(true),
    })
    .prefault({}),

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
    )
    .prefault({ costUpdatedInterval: 60 }),

  evdriver: z
    .object({
      enableGetChargingProfilesOnStartTransaction: z.boolean().default(false),
    })
    .prefault({}),
});

/** Post-parse config: every defaulted field is present. What `configSchema.parse()` returns. */
export type SystemConfig = z.infer<typeof configSchema>;

/** Pre-parse config: defaulted fields are optional. What you hand-author or merge env vars into. */
export type SystemConfigInput = z.input<typeof configSchema>;

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
