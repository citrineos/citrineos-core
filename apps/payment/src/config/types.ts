// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

/** APP_ENV: which defaults the config starts from. */
export const AppEnv = {
  Docker: 'docker',
  Local: 'local',
} as const;
export type AppEnv = (typeof AppEnv)[keyof typeof AppEnv];

export const RuntimeEnv = {
  Development: 'development',
  Production: 'production',
} as const;
export type RuntimeEnv = (typeof RuntimeEnv)[keyof typeof RuntimeEnv];

/** How the server authenticates to Core's HTTP API. */
export const CoreAuthMode = {
  Headers: 'headers',
  LocalDev: 'localDev',
} as const;
export type CoreAuthMode = (typeof CoreAuthMode)[keyof typeof CoreAuthMode];

const port = z.number().int().min(1).max(65535);

export const PaymentConfigSchema = z.object({
  env: z.enum(RuntimeEnv),
  server: z.object({
    host: z.string().min(1),
    port,
    /** Behind a reverse proxy: take the client's address from X-Forwarded-For, for rate limits. */
    trustProxy: z.boolean().default(false),
  }),
  database: z.object({
    host: z.string().min(1),
    port,
    database: z.string().min(1),
    username: z.string().min(1),
    password: z.string(),
  }),
  logLevel: z.number().int().min(0).max(6).default(2),
  /** Where drivers reach this app; Stripe sends them back here after paying. */
  publicUrl: z.url(),
  /** The built driver frontend (`frontend/dist`); served at `publicUrl` when present. */
  frontendDir: z.string().min(1).optional(),
  /** Where Core reaches this app to report a station's answer to a remote start. */
  internalUrl: z.url(),
  /** Signs the callback URLs handed to Core, so only Core can report a remote start's result. */
  callbackSecret: z.string().min(32),
  stripe: z.object({
    apiKey: z.string().min(1),
    /** Signing secret of the Connect webhook endpoint: events on connected accounts arrive there. */
    connectWebhookSecret: z.string().min(1),
  }),
  core: z.object({
    /** Base URL of Core's HTTP API, e.g. http://localhost:8080. */
    url: z.url(),
    /** Headers sent with every request to Core, e.g. an Authorization header. */
    headers: z.record(z.string(), z.string()).default({}),
    /**
     * Headers per tenant id, used instead of `headers` for that tenant's requests. Core scopes an API
     * token to one tenant, so each tenant this app serves needs its own.
     */
    tenantHeaders: z.record(z.string(), z.record(z.string(), z.string())).default({}),
    /**
     * `headers` sends `headers`/`tenantHeaders` as configured. `localDev` instead mints a token for
     * each tenant from the /dev/token endpoint of a Core in auth mode localDev, for development.
     */
    authMode: z.enum(CoreAuthMode).default(CoreAuthMode.Headers),
    /** The roles asked for in localDev tokens. */
    localDevRoles: z.array(z.string().min(1)).min(1).default(['admin']),
  }),
  amqp: z.object({
    url: z.string().min(1),
    /** Must be the exchange Core publishes to. */
    exchange: z.string().min(1),
    queue: z.string().min(1),
  }),
  /** Who may use /api/admin. Without either, the admin API refuses every request. */
  admin: z
    .object({
      /** Platform-wide access, for operators and automation; sent as `Authorization: Bearer <key>`. */
      apiKey: z.string().min(32).optional(),
      /** Tenant-scoped access with the JWTs Core accepts in auth mode jwt. */
      jwt: z
        .object({
          jwksUri: z.url(),
          issuer: z.string().min(1),
          audience: z.string().min(1).optional(),
          rolesClaim: z.string().min(1).default('roles'),
          tenantClaim: z.string().min(1).default('tenant_id'),
          /** The role a token needs to administer its tenant's payments. */
          role: z.string().min(1).default('admin'),
        })
        .optional(),
    })
    .default({}),
  /** Requests per minute and client address to the endpoints that open Stripe sessions; 0 is no limit. */
  rateLimitPerMinute: z.number().int().min(0).default(20),
  reconciliation: z
    .object({
      /** How often stuck checkouts are looked for; 0 turns the sweep off. */
      intervalSeconds: z.number().int().min(0).default(60),
      /** How long a checkout sits in one status before the sweep acts on it. */
      staleAfterSeconds: z.number().int().min(60).default(600),
    })
    .default({ intervalSeconds: 60, staleAfterSeconds: 600 }),
  /** idTokens issued for remote starts are this prefix plus the checkout id. */
  idTokenPrefix: z
    .string()
    .regex(/^[A-Za-z0-9*\-_=:+|@.]{1,8}$/)
    .default('PAY_'),
});

export type PaymentConfigInput = z.input<typeof PaymentConfigSchema>;
export type PaymentConfig = z.output<typeof PaymentConfigSchema>;
