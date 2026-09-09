// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// The single in-memory Store injected everywhere: a bounded exchange ring
// buffer (recorder), the DomainState (registration + object maps + pending
// commands), a findings list, and the waitForReceived waiter registry that
// backs every async test assertion. Also exports `matchesFilter`, the one
// predicate used by query(), waitForReceived(), and the FaultEngine.
// ============================================================================
import type {
  DomainState,
  Exchange,
  ExchangeFilter,
  Finding,
  MockConfig,
  RegistrationState,
  Store,
} from './types.js';
import { exchangeId, nextSeq } from './ids.js';

const RING_CAP = 10_000;

// ---------------------------------------------------------------------------
// Filter matcher — the single predicate shared by query / waiter / faults.
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Does `target` contain, at this exact shape, everything in `needle`? */
function matchesSubset(target: unknown, needle: unknown): boolean {
  if (isObject(needle)) {
    if (!isObject(target)) return false;
    return Object.entries(needle).every(([k, v]) => k in target && matchesSubset(target[k], v));
  }
  if (Array.isArray(needle)) {
    if (!Array.isArray(target)) return false;
    return needle.every((n) => target.some((t) => matchesSubset(t, n)));
  }
  return target === needle;
}

/** Deep "matches anywhere": the needle shape appears at any nested position. */
export function deepContains(target: unknown, needle: unknown): boolean {
  if (matchesSubset(target, needle)) return true;
  if (Array.isArray(target)) return target.some((t) => deepContains(t, needle));
  if (isObject(target)) return Object.values(target).some((v) => deepContains(v, needle));
  return false;
}

/** True when `ex` satisfies every constraint present on `f`. */
export function matchesFilter(ex: Exchange, f: ExchangeFilter): boolean {
  if (f.direction && ex.direction !== f.direction) return false;
  if (f.module && ex.module !== f.module) return false;
  if (f.operation && ex.operation !== f.operation) return false;
  if (f.method && (ex.request.method ?? '').toUpperCase() !== f.method.toUpperCase()) return false;
  if (f.minSeq != null && ex.seq < f.minSeq) return false;
  if (f.httpStatus != null && ex.response.httpStatus !== f.httpStatus) return false;
  if (f.ocpiStatusCode != null && ex.response.ocpiStatusCode !== f.ocpiStatusCode) return false;
  if (f.validationOk != null && ex.validation.ok !== f.validationOk) return false;
  if (f.pathMatches) {
    let re: RegExp | undefined;
    try {
      re = new RegExp(f.pathMatches);
    } catch {
      return false;
    }
    if (!re.test(ex.request.path) && !re.test(ex.request.url)) return false;
  }
  if (f.from) {
    if (f.from.cc && ex.request.ocpi.from?.cc !== f.from.cc) return false;
    if (f.from.party && ex.request.ocpi.from?.party !== f.from.party) return false;
  }
  if (f.to) {
    if (f.to.cc && ex.request.ocpi.to?.cc !== f.to.cc) return false;
    if (f.to.party && ex.request.ocpi.to?.party !== f.to.party) return false;
  }
  if (f.bodyMatch != null) {
    if (
      !deepContains(ex.request.body, f.bodyMatch) &&
      !deepContains(ex.response.body, f.bodyMatch)
    ) {
      return false;
    }
  }
  return true;
}

/** Best-effort description of why `ex` did NOT match `f` (for timeout debugging). */
function whyNotMatch(ex: Exchange, f: ExchangeFilter): string[] {
  const reasons: string[] = [];
  if (f.direction && ex.direction !== f.direction) reasons.push(`direction=${ex.direction}`);
  if (f.module && ex.module !== f.module) reasons.push(`module=${String(ex.module)}`);
  if (f.operation && ex.operation !== f.operation) reasons.push(`operation=${ex.operation}`);
  if (f.method && (ex.request.method ?? '').toUpperCase() !== f.method.toUpperCase()) {
    reasons.push(`method=${ex.request.method}`);
  }
  if (f.pathMatches) reasons.push(`path=${ex.request.path}`);
  if (f.from?.party && ex.request.ocpi.from?.party !== f.from.party) {
    reasons.push(`from.party=${ex.request.ocpi.from?.party ?? '-'}`);
  }
  if (f.to?.party && ex.request.ocpi.to?.party !== f.to.party) {
    reasons.push(`to.party=${ex.request.ocpi.to?.party ?? '-'}`);
  }
  return reasons;
}

// ---------------------------------------------------------------------------
// Domain seed
// ---------------------------------------------------------------------------

function seedRegistration(cfg: MockConfig): RegistrationState {
  return {
    status: 'registered',
    tokenWeAccept: cfg.bootstrapTokenWeAccept,
    tokenWePresent: cfg.bootstrapTokenWePresent,
    cpoEndpoints: [],
  };
}

function seedDomain(cfg: MockConfig): DomainState {
  return {
    registration: seedRegistration(cfg),
    locations: new Map(),
    sessions: new Map(),
    cdrs: new Map(),
    tariffs: new Map(),
    tokens: new Map(),
    authorizations: new Map(),
    commands: new Map(),
  };
}

// ---------------------------------------------------------------------------
// Waiter registry
// ---------------------------------------------------------------------------

interface Waiter {
  filter: ExchangeFilter;
  resolve: (ex: Exchange) => void;
  reject: (err: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

class MemoryStore implements Store {
  domain: DomainState;
  findings: Finding[] = [];

  private readonly cfg: MockConfig;
  private buffer: Exchange[] = [];
  private readonly index = new Map<string, Exchange>();
  private waiters: Waiter[] = [];

  constructor(cfg: MockConfig) {
    this.cfg = cfg;
    this.domain = seedDomain(cfg);
  }

  open(
    partial: Partial<Exchange> & Pick<Exchange, 'direction' | 'module' | 'operation'>,
  ): Exchange {
    const seq = nextSeq();
    const id = partial.id ?? exchangeId(seq);
    const receivedAt = new Date().toISOString();
    return {
      seq,
      id,
      direction: partial.direction,
      module: partial.module,
      operation: partial.operation,
      request: partial.request ?? {
        method: '',
        url: '',
        path: '',
        query: {},
        headers: {},
        rawBody: '',
        body: undefined,
        ocpi: {},
      },
      response: partial.response ?? { httpStatus: 0, headers: {}, body: undefined },
      validation: partial.validation ?? { ok: true },
      findings: partial.findings ?? [],
      timing: partial.timing ?? { receivedAt },
      fault: partial.fault,
      flowId: partial.flowId,
      scenario: partial.scenario,
    };
  }

  record(x: Exchange): Exchange {
    if (!this.index.has(x.id)) {
      this.buffer.push(x);
      this.index.set(x.id, x);
      if (this.buffer.length > RING_CAP) {
        const evicted = this.buffer.shift();
        if (evicted) this.index.delete(evicted.id);
      }
    }
    this.wakeWaiters(x);
    return x;
  }

  query(f: ExchangeFilter): Exchange[] {
    const matched = this.buffer.filter((ex) => matchesFilter(ex, f)).sort((a, b) => a.seq - b.seq);
    const offset = f.offset ?? 0;
    const limit = f.limit ?? matched.length;
    return matched.slice(offset, offset + limit);
  }

  get(id: string): Exchange | undefined {
    return this.index.get(id);
  }

  // Cheap accessors so callers that only need the size / newest seq don't pay a
  // full filter+sort of the ring buffer (which query({}) does). The buffer is
  // append-only in seq order (RING_CAP evicts from the front), so the last entry
  // always holds the max seq.
  count(): number {
    return this.buffer.length;
  }

  maxSeq(): number {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1].seq : 0;
  }

  waitForReceived(f: ExchangeFilter, timeoutMs: number): Promise<Exchange> {
    return new Promise<Exchange>((resolve, reject) => {
      // Catch already-arrived traffic first (cursor = f.minSeq, inclusive).
      const existing = this.buffer
        .filter((ex) => matchesFilter(ex, f))
        .sort((a, b) => a.seq - b.seq);
      if (existing.length > 0) {
        resolve(existing[0]);
        return;
      }
      const waiter: Waiter = {
        filter: f,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.waiters = this.waiters.filter((w) => w !== waiter);
          const err = new Error(
            `waitForReceived timed out after ${timeoutMs}ms (filter ${JSON.stringify(f)})`,
          ) as Error & { nearMisses?: unknown; filter?: ExchangeFilter };
          err.nearMisses = this.computeNearMisses(f);
          err.filter = f;
          reject(err);
        }, timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  addFinding(f: Finding): void {
    this.findings.push(f);
  }

  reset(opts?: { keepRegistration?: boolean }): void {
    const keptRegistration = this.domain.registration;
    this.buffer = [];
    this.index.clear();
    for (const w of this.waiters) {
      clearTimeout(w.timer);
      w.reject(new Error('store reset'));
    }
    this.waiters = [];
    this.findings = [];
    this.domain = seedDomain(this.cfg);
    if (opts?.keepRegistration) {
      this.domain.registration = keptRegistration;
    }
  }

  // ---- internals ----

  private wakeWaiters(x: Exchange): void {
    if (this.waiters.length === 0) return;
    const remaining: Waiter[] = [];
    for (const w of this.waiters) {
      if (matchesFilter(x, w.filter)) {
        clearTimeout(w.timer);
        w.resolve(x);
      } else {
        remaining.push(w);
      }
    }
    this.waiters = remaining;
  }

  private computeNearMisses(f: ExchangeFilter): unknown[] {
    return this.buffer
      .filter((ex) => !f.direction || ex.direction === f.direction)
      .slice(-5)
      .map((ex) => ({
        id: ex.id,
        seq: ex.seq,
        direction: ex.direction,
        module: ex.module,
        operation: ex.operation,
        method: ex.request.method,
        path: ex.request.path,
        from: ex.request.ocpi.from,
        to: ex.request.ocpi.to,
        differsBy: whyNotMatch(ex, f),
      }));
  }
}

export function createStore(cfg: MockConfig): Store {
  return new MemoryStore(cfg);
}
