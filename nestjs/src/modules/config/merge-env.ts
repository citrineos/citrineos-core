// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Merges environment variables into a parsed AppConfig instance.
 *
 * Mirrors the legacy `mergeConfigFromEnvVars` in
 * `base/src/config/defineConfig.ts`. Operators rely on this lever to
 * override any nested config field via `CITRINEOS_<NESTED_PATH>` without
 * editing JSON.
 *
 * Examples:
 *   CITRINEOS_UTIL_CACHE_REDIS_HOST=redis     → util.cache.redis.host
 *   CITRINEOS_CENTRAL_SYSTEM_PORT=8080        → centralSystem.port
 *   CITRINEOS_MODULES_TRANSACTIONS_COST_UPDATED_INTERVAL=30
 *                                             → modules.transactions.costUpdatedInterval
 *
 * Path resolution
 * ---------------
 * Env keys are matched against the AppConfig instance's property tree.
 * Each property name P is compared against a prefix of the remaining
 * segments by computing `camelToUpperSnake(P)` and splitting on '_'.
 * The matcher consumes as many segments as the property name occupies
 * (e.g. `centralSystem` consumes `CENTRAL` + `SYSTEM`).
 *
 * If multiple property names could match (rare — names tend to be
 * unique within an object), the **longest** match wins.
 *
 * Type coercion
 * -------------
 * The merger preserves the runtime type of the existing field:
 *   - number → parseFloat
 *   - boolean → 'true' / 'false' (case-insensitive)
 *   - other primitives → set as-is
 *   - object/array → JSON.parse the value
 *
 * Unknown / un-matchable env vars are silently skipped (matches legacy
 * — operators frequently set vars unrelated to citrineos).
 *
 * Returns the (mutated) input root for convenience.
 */

import { defaultMetadataStorage } from 'class-transformer/cjs/storage';

const DEFAULT_PREFIX = 'CITRINEOS_';

export interface MergeEnvOptions {
  /** Prefix to look for. Defaults to `CITRINEOS_`. CLI sets this via `--env-prefix=`. */
  prefix?: string;
}

export function mergeEnvIntoConfig<T extends object>(
  root: T,
  env: NodeJS.ProcessEnv,
  options: MergeEnvOptions = {},
): T {
  const prefix = (options.prefix ?? DEFAULT_PREFIX).toUpperCase();

  for (const key of Object.keys(env)) {
    if (!key.startsWith(prefix)) continue;
    // Skip BOOTSTRAP_CITRINEOS_* — those are handled separately by the
    // bootstrap phase and would otherwise hit unknown paths.
    if (key.startsWith('BOOTSTRAP_')) continue;
    const value = env[key];
    if (value === undefined) continue;

    const segments = key.slice(prefix.length).split('_').filter(Boolean);
    if (segments.length === 0) continue;
    applySegments(root, segments, value);
  }
  return root;
}

function applySegments(target: object, segments: string[], rawValue: string): void {
  let cur: Record<string, unknown> = target as Record<string, unknown>;
  let consumed = 0;

  while (consumed < segments.length) {
    const remaining = segments.slice(consumed);
    const match = findPropertyMatch(cur, remaining);
    if (!match) return; // unknown path — skip silently
    const { propertyName, length } = match;
    consumed += length;

    if (consumed === segments.length) {
      // Last segment — assign with type coercion.
      const existing = cur[propertyName];
      cur[propertyName] = coerce(existing, rawValue);
      return;
    }

    let next = cur[propertyName];
    if (next === null || next === undefined) {
      // Auto-instantiate the proper sub-class so subsequent matcher
      // descent can still see the schema-declared property names.
      // Without this, `CITRINEOS_UTIL_CACHE_REDIS_HOST` no-ops when
      // the JSON config didn't include a `redis` block.
      const ChildCtor = getChildTypeConstructor(
        (cur as { constructor?: unknown }).constructor,
        propertyName,
      );
      next = ChildCtor ? new ChildCtor() : {};
      cur[propertyName] = next;
    } else if (typeof next !== 'object' || Array.isArray(next)) {
      // Path tries to descend through a non-object value — skip.
      return;
    }
    cur = next as Record<string, unknown>;
  }
}

/** Lookup `@Type(() => Foo)` target constructor for a (parent class, property) pair. */
function getChildTypeConstructor(
  parentCtor: unknown,
  propertyName: string,
): (new () => object) | null {
  if (typeof parentCtor !== 'function') return null;
  const storage = defaultMetadataStorage as unknown as {
    _typeMetadatas?: Map<Function, Map<string, { typeFunction?: () => unknown }>>;
  };
  const meta = storage._typeMetadatas?.get(parentCtor)?.get(propertyName);
  const typeFn = meta?.typeFunction;
  if (typeof typeFn !== 'function') return null;
  const ChildCtor = typeFn() as unknown;
  return typeof ChildCtor === 'function' ? (ChildCtor as new () => object) : null;
}

interface PropertyMatch {
  propertyName: string;
  /** Number of `segments` consumed by this property. */
  length: number;
}

function findPropertyMatch(target: object, remaining: string[]): PropertyMatch | null {
  // Property names come from two sources:
  //   1. Object.keys(target) — fields actually set on the runtime instance
  //   2. class-transformer's @Type metadata — fields declared by the
  //      schema even when undefined on this instance (e.g. optional
  //      `util.cache.redis` that the JSON omitted).
  // Without (2), nested overrides like `CITRINEOS_UTIL_CACHE_REDIS_HOST`
  // would silently no-op when the parent JSON was missing the redis key.
  const candidates = new Set<string>(Object.keys(target));
  for (const m of getSchemaProperties((target as { constructor?: unknown }).constructor)) {
    candidates.add(m);
  }

  let best: PropertyMatch | null = null;
  for (const propertyName of candidates) {
    const propSegments = camelToUpperSnake(propertyName).split('_');
    if (propSegments.length > remaining.length) continue;
    let matches = true;
    for (let i = 0; i < propSegments.length; i++) {
      if (propSegments[i] !== remaining[i].toUpperCase()) {
        matches = false;
        break;
      }
    }
    if (!matches) continue;
    if (!best || propSegments.length > best.length) {
      best = { propertyName, length: propSegments.length };
    }
  }
  return best;
}

/**
 * Expose @Type-decorated property names of a class. class-transformer's
 * MetadataStorage stores these in a private map; we read it via the
 * documented `findTypeMetadata` accessor by iterating over candidate
 * property names.
 *
 * Since there's no public "get all @Type'd props" API, we cache the
 * result of a probe over the storage internals on first use.
 */
const schemaPropsCache = new WeakMap<Function, string[]>();
function getSchemaProperties(ctor: unknown): string[] {
  if (typeof ctor !== 'function') return [];
  const cached = schemaPropsCache.get(ctor);
  if (cached) return cached;
  // Reach into the private metadata map. Stable across class-transformer
  // 0.x releases — guarded so a future structural change degrades to no-op.
  const storage = defaultMetadataStorage as unknown as {
    _typeMetadatas?: Map<Function, Map<string, unknown>>;
  };
  const map = storage._typeMetadatas?.get(ctor);
  const props = map ? Array.from(map.keys()) : [];
  schemaPropsCache.set(ctor, props);
  return props;
}

/** `centralSystem` → `CENTRAL_SYSTEM`; `redis` → `REDIS`; `realTimeAuthDefaultTimeoutSeconds` → `REAL_TIME_AUTH_DEFAULT_TIMEOUT_SECONDS`. */
function camelToUpperSnake(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toUpperCase();
}

function coerce(existing: unknown, raw: string): unknown {
  if (typeof existing === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : existing;
  }
  if (typeof existing === 'boolean') {
    const lower = raw.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return existing;
  }
  if (Array.isArray(existing) || (existing !== null && typeof existing === 'object')) {
    try {
      return JSON.parse(raw);
    } catch {
      return existing;
    }
  }
  return raw;
}
