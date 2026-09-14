// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// A tiny TTL cache for the three EXPENSIVE status sources behind GET /_mock/status:
// the combined Hasura query (station/connector/transaction), the Citrine OCPI
// reachability probe, and the EVerest-container docker check. The dashboard polls
// /status every 2s; without caching that would hammer Hasura/Citrine/docker.
//
// Discipline: serve-stale-trigger-refresh. `snapshot()` NEVER awaits — it returns
// whatever was last fetched (or `undefined` = never-probed = "unknown" to the
// client) and kicks off a background refresh only when the entry is past its TTL.
// A single `inflight` promise per source coalesces concurrent refreshes.
//
// The probes are INJECTED (createStatusCache(probes)) so the real ones live in
// control-api.ts (reusing hasuraFetch / fetch / dockerExec) and tests can pass
// fakes with zero network/docker. There are no timers here — refresh is lazy —
// so nothing keeps the vitest process alive.
// ============================================================================

/** Result of the one combined Hasura query. `ok:false` => Hasura unreachable / GraphQL errors. */
export interface HasuraStatus {
  ok: boolean;
  station: { id: number; name: string; isOnline: boolean } | null;
  connector: { id: number; status: string } | null;
  transaction: {
    transactionId: string;
    chargingState: string | null;
    totalKwh: number | null;
  } | null;
}

/** Citrine OCPI reachability. `up` means any HTTP response came back (even 401). */
export interface OcpiProbe {
  up: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
}

/** EVerest car-sim container reachability. `unavailable` = docker itself is not usable (missing/timed out). */
export interface EverestProbe {
  state: 'up' | 'down' | 'unavailable';
  detail: string | null;
}

export interface StatusProbes {
  hasura(): Promise<HasuraStatus>;
  ocpi(): Promise<OcpiProbe>;
  everest(): Promise<EverestProbe>;
}

/** A snapshot value of `undefined` means "never successfully probed" -> render as unknown. */
export interface StatusSnapshot {
  hasura: HasuraStatus | undefined;
  ocpi: OcpiProbe | undefined;
  everest: EverestProbe | undefined;
  /** true while ANY source is mid-first-fetch or last-errored — surfaced as `degraded`. */
  stale: boolean;
}

export interface StatusCache {
  /** Sync: return the current values and trigger background refresh of any stale source. */
  snapshot(): StatusSnapshot;
  /** Await a forced refresh of every source (bounded by the probe timeouts). Used by ?fresh=1 + tests. */
  refreshAll(): Promise<void>;
}

interface Entry<T> {
  value: T | undefined;
  fetchedAt: number; // ms epoch of last SUCCESS
  attemptedAt: number; // ms epoch of last completed attempt (success or failure)
  error: string | null;
  inflight: Promise<void> | null;
}

interface Source<T> {
  entry: Entry<T>;
  run: () => Promise<T>;
  /** ms until the value is considered stale, given the freshly-resolved value. */
  ttlFor: (value: T) => number;
  /** ms until retry after a thrown error (probes normally resolve a state instead of throwing). */
  ttlErr: number;
}

function newEntry<T>(): Entry<T> {
  return { value: undefined, fetchedAt: 0, attemptedAt: 0, error: null, inflight: null };
}

function due<T>(s: Source<T>, now: number): boolean {
  const e = s.entry;
  if (e.value === undefined && e.error === null) return true; // never attempted
  const ttl = e.error !== null ? s.ttlErr : s.ttlFor(e.value as T);
  return now - e.attemptedAt >= ttl;
}

function kick<T>(s: Source<T>): Promise<void> {
  const e = s.entry;
  if (e.inflight) return e.inflight;
  e.inflight = s
    .run()
    .then((v) => {
      e.value = v;
      e.fetchedAt = Date.now();
      e.error = null;
    })
    .catch((err: unknown) => {
      e.error = err instanceof Error ? err.message : String(err);
    })
    .finally(() => {
      e.attemptedAt = Date.now();
      e.inflight = null;
    });
  return e.inflight;
}

export function createStatusCache(probes: StatusProbes): StatusCache {
  const hasura: Source<HasuraStatus> = {
    entry: newEntry(),
    run: probes.hasura,
    ttlFor: () => 5_000, // 5s whether up or down — connectivity can flip fast
    ttlErr: 5_000,
  };
  const ocpi: Source<OcpiProbe> = {
    entry: newEntry(),
    run: probes.ocpi,
    ttlFor: (v) => (v.up ? 10_000 : 5_000),
    ttlErr: 5_000,
  };
  const everest: Source<EverestProbe> = {
    entry: newEntry(),
    run: probes.everest,
    ttlFor: (v) => (v.state === 'unavailable' ? 60_000 : 30_000), // docker spawns are costly
    ttlErr: 60_000,
  };
  const sources: Source<unknown>[] = [
    hasura as Source<unknown>,
    ocpi as Source<unknown>,
    everest as Source<unknown>,
  ];

  return {
    snapshot(): StatusSnapshot {
      const now = Date.now();
      let stale = false;
      for (const s of sources) {
        if (due(s, now)) {
          void kick(s); // fire-and-forget; errors are captured on the entry
        }
        // "degraded" = we have no data or a source is erroring — NOT merely a background
        // refresh in progress over a still-valid cached value (that would flicker).
        if (s.entry.value === undefined || s.entry.error !== null) stale = true;
      }
      return {
        hasura: hasura.entry.value,
        ocpi: ocpi.entry.value,
        everest: everest.entry.value,
        stale,
      };
    },
    async refreshAll(): Promise<void> {
      await Promise.all(sources.map((s) => kick(s)));
    },
  };
}
