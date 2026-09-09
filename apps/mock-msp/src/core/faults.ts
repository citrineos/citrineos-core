// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FaultEngine (the Adversary) — a PURE matcher: decide() returns the first armed
// rule whose ExchangeFilter matches the Exchange (honoring scope guards +
// per-rule hit counters). The dispatcher (inbound) and OcpiClient (outbound)
// apply the returned FaultAction. This file also owns the body/header mutation
// helpers those two call-sites use, so all corruption logic lives in one place.
// ============================================================================
import type {
  Exchange,
  FaultAction,
  FaultDecision,
  FaultEngine,
  FaultRule,
  FaultTarget,
} from './types.js';
import { matchesFilter } from './store.js';
import { base64Encode } from './auth.js';

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

class FaultEngineImpl implements FaultEngine {
  private readonly rules = new Map<string, FaultRule>();
  private readonly hits = new Map<string, number>();

  arm(rule: FaultRule): void {
    this.rules.set(rule.id, rule);
    this.hits.set(rule.id, 0);
  }

  disarm(id: string): void {
    this.rules.delete(id);
    this.hits.delete(id);
  }

  clear(): void {
    this.rules.clear();
    this.hits.clear();
  }

  list(): FaultRule[] {
    return [...this.rules.values()];
  }

  loadScenarioFaults(rules: FaultRule[]): void {
    this.clear();
    for (const r of rules) this.arm(r);
  }

  decide(_target: FaultTarget, ex: Exchange): FaultDecision | undefined {
    // The Exchange already carries direction/module/method/path/seq, so we match
    // rule.match against it directly; _target is redundant but kept for the API.
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (!matchesFilter(ex, rule.match)) continue;

      const scope = rule.scope;
      if (scope?.afterSeq != null && ex.seq <= scope.afterSeq) continue;
      if (scope?.probability != null && Math.random() > scope.probability) continue;
      if (scope?.times != null) {
        const used = this.hits.get(rule.id) ?? 0;
        if (used >= scope.times) continue;
        this.hits.set(rule.id, used + 1);
      } else {
        this.hits.set(rule.id, (this.hits.get(rule.id) ?? 0) + 1);
      }
      return { rule, action: rule.action };
    }
    return undefined;
  }
}

export function createFaultEngine(): FaultEngine {
  return new FaultEngineImpl();
}

// ---------------------------------------------------------------------------
// Mutation helpers (shared by dispatcher + client)
// ---------------------------------------------------------------------------

export const OVERSIZE_TOKEN = 'X'.repeat(80); // > CredentialsDTO.token max (64)

function clone<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

function splitPath(path: string): string[] {
  return path.split('.').filter((p) => p.length > 0);
}

function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const key of splitPath(path)) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function deletePath(obj: unknown, path: string): void {
  const keys = splitPath(path);
  let cur: unknown = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur == null || typeof cur !== 'object') return;
    cur = (cur as Record<string, unknown>)[keys[i]];
  }
  if (cur && typeof cur === 'object' && keys.length > 0) {
    delete (cur as Record<string, unknown>)[keys[keys.length - 1]];
  }
}

function setPath(obj: unknown, path: string, value: unknown): void {
  const keys = splitPath(path);
  let cur: unknown = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur == null || typeof cur !== 'object') return;
    cur = (cur as Record<string, unknown>)[keys[i]];
  }
  if (cur && typeof cur === 'object' && keys.length > 0) {
    (cur as Record<string, unknown>)[keys[keys.length - 1]] = value;
  }
}

function wrongTypeFor(current: unknown): unknown {
  if (typeof current === 'number') return 'not-a-number';
  if (typeof current === 'string') return 12345;
  if (typeof current === 'boolean') return 'not-a-boolean';
  return 'wrong-type';
}

type Mutation = 'dropRequired' | 'wrongType' | 'injectData' | 'emptyObject' | 'notJson';

/**
 * Corrupt a JSON body per the mutation. Returns an object for structural
 * mutations, or a raw string for `notJson` (call-sites send strings verbatim).
 * Defaults target `status_code` when no targetPath is given (a required key on
 * every OCPI envelope) — pass e.g. `data.authorization_reference` to drop a
 * nested required field.
 */
export function mutateJson(body: unknown, mutation: Mutation, targetPath?: string): unknown {
  switch (mutation) {
    case 'injectData':
      return { ...(typeof body === 'object' && body !== null ? body : {}), data: {} };
    case 'emptyObject':
      return {};
    case 'notJson':
      return 'not json at all';
    case 'dropRequired': {
      const c = clone(body);
      deletePath(c, targetPath ?? 'status_code');
      return c;
    }
    case 'wrongType': {
      const c = clone(body);
      const p = targetPath ?? 'status_code';
      setPath(c, p, wrongTypeFor(getPath(c, p)));
      return c;
    }
    default:
      return body;
  }
}

/** Force an over-long token onto a credentials-shaped body (trips token max 64). */
export function oversizeTokenBody(body: unknown): unknown {
  const c = clone(body);
  if (c && typeof c === 'object') {
    const obj = c as Record<string, unknown>;
    if (obj.data && typeof obj.data === 'object') {
      (obj.data as Record<string, unknown>).token = OVERSIZE_TOKEN;
    } else if ('token' in obj) {
      obj.token = OVERSIZE_TOKEN;
    }
  }
  return c;
}

/** Delete a header case-insensitively from a canonical-cased header map. */
export function dropHeaderCI(headers: Record<string, string>, name: string): void {
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) delete headers[key];
  }
}

// ---------------------------------------------------------------------------
// Outbound application (used by OcpiClient to corrupt OUR requests to Citrine)
// ---------------------------------------------------------------------------

export interface OutboundFaultResult {
  headers: Record<string, string>;
  body: unknown;
  delayMs?: number;
  skipSend?: boolean;
}

export function applyOutboundFault(
  action: FaultAction,
  ctx: { headers: Record<string, string>; body: unknown },
): OutboundFaultResult {
  const headers = { ...ctx.headers };
  let body = ctx.body;
  switch (action.kind) {
    case 'delay':
      return { headers, body, delayMs: action.ms };
    case 'abort':
      return { headers, body, skipSend: true };
    case 'dropHeaders':
      for (const h of action.headers) dropHeaderCI(headers, h);
      return { headers, body };
    case 'unauthorized':
      headers['Authorization'] = `Token ${base64Encode(`invalid-${Date.now()}`)}`;
      return { headers, body };
    case 'malformBody':
      body = mutateJson(body, action.mutation, action.targetPath);
      return { headers, body };
    case 'oversizeToken':
      body = oversizeTokenBody(body);
      return { headers, body };
    default:
      // passthrough / httpStatus / ocpiStatus are meaningless on an outbound
      // request — leave the call untouched.
      return { headers, body };
  }
}
