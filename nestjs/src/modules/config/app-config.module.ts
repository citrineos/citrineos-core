import { Global, Module, type Provider } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { join } from 'path';
import * as fs from 'fs';
import { AppConfig } from '@modules/config/config.schema';
import { mergeEnvIntoConfig } from '@modules/config/merge-env';
import {
  AUTH_PROVIDER_CONFIG,
  CACHE_CONFIG,
  CENTRAL_SYSTEM_CONFIG,
  CERTIFICATE_AUTHORITY_CONFIG,
  CERTIFICATES_MODULE_CONFIG,
  CONFIG_LIMITS,
  CONFIGURATION_MODULE_CONFIG,
  type ConfigLimits,
  DATABASE_CONFIG,
  EVDRIVER_MODULE_CONFIG,
  MESSAGE_BROKER_CONFIG,
  MODULES_CONFIG,
  MONITORING_MODULE_CONFIG,
  NETWORK_CONNECTION_CONFIG,
  REPORTING_MODULE_CONFIG,
  SMARTCHARGING_MODULE_CONFIG,
  SWAGGER_CONFIG,
  TELEMETRY_CONFIG,
  TENANT_MODULE_CONFIG,
  TRANSACTIONS_MODULE_CONFIG,
  UTIL_CONFIG,
} from '@modules/config/config.tokens';

export const APP_CONFIG = Symbol('APP_CONFIG');

/**
 * Builds AppConfig in two phases, mirroring legacy CitrineOS:
 *
 * 1. **Bootstrap config** — supplied entirely by env vars, used to locate the
 *    real system config and to bootstrap the Drizzle connection.
 *      - BOOTSTRAP_CITRINEOS_DATABASE_HOST / PORT / USERNAME / PASSWORD / NAME
 *      - BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE          ('local' for filesystem)
 *      - BOOTSTRAP_CITRINEOS_FILE_ACCESS_LOCAL_DEFAULT_FILE_PATH (directory)
 *      - BOOTSTRAP_CITRINEOS_CONFIG_FILENAME           (file under that directory)
 *      - APP_ENV                                       ('local' / 'development')
 *      - APP_NAME                                      (event group, e.g. 'all')
 *
 * 2. **System config** — JSON read from the file resolved in phase 1, validated
 *    against the AppConfig class, defaults filled in via class-validator.
 *
 * The legacy server uses the same envelope; matching it lets `config.json`
 * snapshots port verbatim between deployments.
 */
export function buildConfig(): AppConfig {
  const raw: Record<string, unknown> = {};

  // ─── Phase 1: bootstrap (DB + system-config file location) ─────────────────

  const dbConfig: Record<string, unknown> = {
    migrationsFolder: join(process.cwd(), 'migrations'),
  };
  if (process.env['BOOTSTRAP_CITRINEOS_DATABASE_HOST']) {
    dbConfig['host'] = process.env['BOOTSTRAP_CITRINEOS_DATABASE_HOST'];
  }
  if (process.env['BOOTSTRAP_CITRINEOS_DATABASE_PORT']) {
    dbConfig['port'] = parseInt(process.env['BOOTSTRAP_CITRINEOS_DATABASE_PORT'], 10);
  }
  if (process.env['BOOTSTRAP_CITRINEOS_DATABASE_USERNAME']) {
    dbConfig['username'] = process.env['BOOTSTRAP_CITRINEOS_DATABASE_USERNAME'];
  }
  if (process.env['BOOTSTRAP_CITRINEOS_DATABASE_PASSWORD']) {
    dbConfig['password'] = process.env['BOOTSTRAP_CITRINEOS_DATABASE_PASSWORD'];
  }
  if (process.env['BOOTSTRAP_CITRINEOS_DATABASE_NAME']) {
    dbConfig['name'] = process.env['BOOTSTRAP_CITRINEOS_DATABASE_NAME'];
  }
  raw['database'] = dbConfig;

  if (process.env['APP_ENV']) {
    raw['env'] = process.env['APP_ENV'] === 'local' ? 'development' : process.env['APP_ENV'];
  }

  // ─── Phase 2: system config from file ──────────────────────────────────────

  const fileAccessType = process.env['BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE'] ?? 'local';
  if (fileAccessType !== 'local') {
    throw new Error(
      `Unsupported BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE="${fileAccessType}" — only "local" is implemented`,
    );
  }
  const configDir = process.env['BOOTSTRAP_CITRINEOS_FILE_ACCESS_LOCAL_DEFAULT_FILE_PATH'];
  const configFilename = process.env['BOOTSTRAP_CITRINEOS_CONFIG_FILENAME'];
  if (configDir && configFilename) {
    const configPath = join(configDir, configFilename);
    try {
      const fileContent = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<
        string,
        unknown
      >;
      deepMerge(raw, fileContent);
    } catch (err) {
      throw new Error(`Failed to load system config "${configPath}": ${(err as Error).message}`);
    }
  }

  // ─── Phase 3: env-var override merge (legacy parity) ───────────────────────
  // Walks `CITRINEOS_<NESTED_PATH>` env vars and applies them to the
  // parsed instance. Mirrors `mergeConfigFromEnvVars` in
  // `base/src/config/defineConfig.ts`. CLI `--env-prefix=foo_` rewrites
  // the prefix for forks that don't want the citrineos namespace.
  const envPrefix = parseEnvPrefixArg() ?? 'CITRINEOS_';

  // ─── Validate ──────────────────────────────────────────────────────────────

  // We instantiate twice on purpose: first to materialize the typed tree
  // (so the env-merge knows which fields are number/boolean/etc. for
  // coercion), then re-instantiate AFTER the merge so re-validation runs
  // against the merged values.
  const stage1 = plainToInstance(AppConfig, raw, { exposeDefaultValues: true });
  mergeEnvIntoConfig(stage1, process.env, { prefix: envPrefix });
  const instance = plainToInstance(AppConfig, JSON.parse(JSON.stringify(stage1)), {
    exposeDefaultValues: true,
  });
  const errors = validateSync(instance, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map((e) => e.toString()).join('\n')}`,
    );
  }
  return instance;
}

/**
 * Parse `--env-prefix=FOO_` from process.argv. Mirrors the legacy CLI
 * lever that lets operators run two CitrineOS instances in the same env
 * with non-conflicting variable namespaces.
 */
function parseEnvPrefixArg(): string | null {
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--env-prefix=')) {
      const v = arg.slice('--env-prefix='.length);
      if (v.length > 0) return v.toUpperCase();
    }
  }
  return null;
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(source)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target[key] !== null &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      target[key] = value;
    }
  }
}

/**
 * Each sub-config provider derives its slice from APP_CONFIG. Consumers
 * should `@Inject` the narrowest token they need; only main.ts and the
 * env-merge bootstrap reach for APP_CONFIG itself.
 */
const slice =
  <T>(getter: (cfg: AppConfig) => T) =>
  (cfg: AppConfig): T =>
    getter(cfg);

const subConfigProviders: Provider[] = [
  // top-level
  {
    provide: CENTRAL_SYSTEM_CONFIG,
    useFactory: slice((c) => c.centralSystem),
    inject: [APP_CONFIG],
  },
  { provide: DATABASE_CONFIG, useFactory: slice((c) => c.database), inject: [APP_CONFIG] },
  { provide: MODULES_CONFIG, useFactory: slice((c) => c.modules), inject: [APP_CONFIG] },
  { provide: UTIL_CONFIG, useFactory: slice((c) => c.util), inject: [APP_CONFIG] },
  {
    provide: CONFIG_LIMITS,
    useFactory: (cfg: AppConfig): ConfigLimits => ({
      maxCachingSeconds: cfg.maxCachingSeconds ?? 30,
      maxCallLengthSeconds: cfg.maxCallLengthSeconds ?? 30,
      maxReconnectDelay: cfg.maxReconnectDelay ?? 30,
      realTimeAuthDefaultTimeoutSeconds: cfg.realTimeAuthDefaultTimeoutSeconds ?? 15,
    }),
    inject: [APP_CONFIG],
  },

  // util sub-slices
  { provide: CACHE_CONFIG, useFactory: slice((c) => c.util.cache), inject: [APP_CONFIG] },
  {
    provide: MESSAGE_BROKER_CONFIG,
    useFactory: slice((c) => c.util.messageBroker),
    inject: [APP_CONFIG],
  },
  {
    provide: AUTH_PROVIDER_CONFIG,
    useFactory: slice((c) => c.util.authProvider),
    inject: [APP_CONFIG],
  },
  { provide: SWAGGER_CONFIG, useFactory: slice((c) => c.util.swagger), inject: [APP_CONFIG] },
  {
    provide: NETWORK_CONNECTION_CONFIG,
    useFactory: slice((c) => c.util.networkConnection),
    inject: [APP_CONFIG],
  },
  {
    provide: CERTIFICATE_AUTHORITY_CONFIG,
    useFactory: slice((c) => c.util.certificateAuthority),
    inject: [APP_CONFIG],
  },
  { provide: TELEMETRY_CONFIG, useFactory: slice((c) => c.util.telemetry), inject: [APP_CONFIG] },

  // module slices — schema declares non-optional defaults for the fields
  // that are always-on (configuration/evdriver/monitoring/reporting/transactions/tenant)
  // and optional defaults for the gated ones (smartcharging/certificates).
  // class-validator/transformer instantiates them, so all are always present
  // at runtime even when the JSON omits them.
  {
    provide: CONFIGURATION_MODULE_CONFIG,
    useFactory: slice((c) => c.modules.configuration),
    inject: [APP_CONFIG],
  },
  {
    provide: EVDRIVER_MODULE_CONFIG,
    useFactory: slice((c) => c.modules.evdriver),
    inject: [APP_CONFIG],
  },
  {
    provide: MONITORING_MODULE_CONFIG,
    useFactory: slice((c) => c.modules.monitoring),
    inject: [APP_CONFIG],
  },
  {
    provide: REPORTING_MODULE_CONFIG,
    useFactory: slice((c) => c.modules.reporting),
    inject: [APP_CONFIG],
  },
  {
    provide: SMARTCHARGING_MODULE_CONFIG,
    useFactory: slice((c) => c.modules.smartcharging!),
    inject: [APP_CONFIG],
  },
  {
    provide: TRANSACTIONS_MODULE_CONFIG,
    useFactory: slice((c) => c.modules.transactions),
    inject: [APP_CONFIG],
  },
  {
    provide: CERTIFICATES_MODULE_CONFIG,
    useFactory: slice((c) => c.modules.certificates!),
    inject: [APP_CONFIG],
  },
  {
    provide: TENANT_MODULE_CONFIG,
    useFactory: slice((c) => c.modules.tenant),
    inject: [APP_CONFIG],
  },
];

const subConfigTokens = subConfigProviders.map((p) => (p as { provide: symbol }).provide);

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => buildConfig(),
    },
    ...subConfigProviders,
  ],
  exports: [APP_CONFIG, ...subConfigTokens],
})
/**
 * NestJS DI module wiring the App Config surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class AppConfigModule {}
