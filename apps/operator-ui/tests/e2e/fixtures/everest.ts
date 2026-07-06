// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { makeApiClient, type ApiClient } from './api-client';

// EVerest fixture using the citrineos-core docker-compose prototype
// (apps/ocpp-server/everest/docker-compose.yml). The fixture brings the simulator
// up, waits for cp001's OCPP BootNotification to register in citrineos-core's
// DB (visible via Hasura), and tears the stack down on dispose.
//
// The columns this fixture writes to / queries:
//   ChargingStations.id (int)             — auto-inc PK
//   ChargingStations.ocppConnectionName   — string identifier ('cp001')
//   Child tables (Evses / Connectors / StatusNotifications / OCPPMessages):
//     stationId (int)          — FK to ChargingStations.id
//     ocppConnectionName       — string identifier (trigger-populated from
//                                ocppConnectionName + tenantId)

const EVEREST_OCPP_CONNECTION_NAME = 'cp001';
// The EVerest SIL stack runs an internal MQTT broker (everest_net, not host-
// exposed); the car simulator (JsEvManager, connector 1) subscribes to command
// topics on it. We drive plug-in/charge/unplug by publishing to those topics
// via `docker exec <broker> mosquitto_pub` — the same docker-exec pattern the
// network-profile patch uses.
const EVEREST_MQTT_CONTAINER = 'everest-mqtt-server-1';
const CARSIM_CONNECTOR_ID = 1;
const CARSIM_CMD_PREFIX = `everest_external/nodered/${CARSIM_CONNECTOR_ID}/carsim/cmd`;
// Plug in (CP state A→B), block until the EVSE authorizes and raises PWM
// (`iec_wait_pwr_ready`), then draw 16 A across 3 phases and hold. The hold is
// long enough (1 h) that the test drives RemoteStart and RemoteStop well
// within it; cleanup unplugs explicitly rather than waiting it out.
const PLUGIN_CHARGE_COMMAND =
  'sleep 1;iec_wait_pwr_ready;sleep 1;draw_power_regulated 16,3;sleep 3600';
const DEFAULT_BOOT_TIMEOUT_MS = 90_000;
// Recovery after a reboot-causing Reset (which reboots the manager container)
// is slow and variable — empirically >150s in CI — so the per-test online guard
// waits well beyond the initial-boot budget. The reset describe runs under an
// extended test timeout so this guard can finish inside a single attempt.
const RECONNECT_TIMEOUT_MS = 210_000;
const POLL_INTERVAL_MS = 2_000;
// How long to wait for libocpp to materialise the device-model DB on a cold
// boot before applying the network-profile patch. The DB normally appears a
// few seconds after `compose up`; this bounds the wait so a manager that never
// boots fails fast into awaitStationOnline's diagnostics rather than hanging.
const DB_READY_TIMEOUT_MS = 60_000;

export interface EverestHandle {
  readonly ocppConnectionName: string;
  readonly id: number;
  stop(): Promise<void>;
}

interface EverestStartOptions {
  readonly bootTimeoutMs?: number;
  readonly citrineCoreServerPath?: string;
}

function defaultCorePath(): string {
  // The operator-ui repo is a sibling of citrineos-core. The Server package
  // (docker-compose.yml + everest/ subdirectory) lives at
  // citrineos-core/apps/ocpp-server. Override via CITRINE_CORE_PATH if your layout
  // differs.
  return process.env.CITRINE_CORE_PATH ?? resolve(__dirname, '..', '..', '..', '..', 'ocpp-server');
}

async function awaitStationOnline(
  api: ApiClient,
  ocppConnectionName: string,
  timeoutMs: number,
): Promise<number> {
  // citrineos-core does NOT set ChargingStations.isOnline on BootNotification
  // — that flag tracks a different administrative lifecycle. The canonical
  // signal that the OCPP layer is live is a fresh StatusNotification row.
  // We accept "station registered AND has a StatusNotification newer than
  // fixture start" as proof of liveness.
  const deadline = Date.now() + timeoutMs;
  const fixtureStart = new Date(Date.now() - 5_000).toISOString();
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      const data = await api.gql<{
        ChargingStations: { id: number; ocppConnectionName: string }[];
        StatusNotifications: {
          ocppConnectionName: string;
          timestamp: string;
        }[];
      }>(
        `query EverestProbe($name: String!, $since: timestamptz!) {
           ChargingStations(where: { ocppConnectionName: { _eq: $name } }) { id ocppConnectionName }
           StatusNotifications(
             where: { ocppConnectionName: { _eq: $name }, timestamp: { _gte: $since } }
             limit: 1
           ) { ocppConnectionName timestamp }
         }`,
        { name: ocppConnectionName, since: fixtureStart },
      );
      const station = data.ChargingStations[0];
      const hasFreshStatus = data.StatusNotifications.length > 0;
      if (station && hasFreshStatus) return station.id;
    } catch (e) {
      lastErr = e;
    }
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error(
    `EVerest station ${ocppConnectionName} did not come online within ${timeoutMs}ms` +
      (lastErr ? `; last error: ${String(lastErr)}` : ''),
  );
}

// One-shot read of citrineos-core's ChargingStations.isOnline flag for cp001.
// Returns the boolean flag, or null when the query throws (transient Hasura/
// network blip) so pollers can treat it as "unknown, keep waiting" rather than
// flipping a definite offline/online verdict on a fluke error.
async function readEverestOnline(api: ApiClient): Promise<boolean | null> {
  try {
    const data = await api.gql<{
      ChargingStations: { isOnline: boolean }[];
    }>(
      `query EverestOnlineGuard($name: String!) {
         ChargingStations(where: { ocppConnectionName: { _eq: $name } }) { isOnline }
       }`,
      { name: EVEREST_OCPP_CONNECTION_NAME },
    );
    return data.ChargingStations[0]?.isOnline ?? false;
  } catch {
    return null;
  }
}

// Per-test guard for the worker-scoped manager: a destructive command in a
// prior test (Reset Immediate reboots the manager container) drops cp001's
// OCPP link, and the station is offline for ~1 minute while it reconnects.
// Wait for `isOnline` to return true so the next test runs against a live
// station instead of a rebooting one. Returns immediately when the station
// is already connected (the common case), so undisrupted tests pay nothing.
export async function ensureEverestOnline(timeoutMs = RECONNECT_TIMEOUT_MS): Promise<void> {
  const api = await makeApiClient();
  try {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if ((await readEverestOnline(api)) === true) return;
      await delay(POLL_INTERVAL_MS);
    }
    throw new Error(
      `EVerest station ${EVEREST_OCPP_CONNECTION_NAME} did not return online within ${timeoutMs}ms`,
    );
  } finally {
    await api.dispose();
  }
}

// Spawn `docker compose` directly with the same cwd + env as the upstream
// `start-everest` npm script in apps/ocpp-server. Going through the npm script
// would require apps/ocpp-server/node_modules to have cross-env installed, but in
// the pnpm-workspace layout those deps are hoisted to the monorepo root and
// apps/ocpp-server may not have a local node_modules at all. Calling docker
// compose ourselves removes that dependency.
const EVEREST_COMPOSE_ENV: Record<string, string> = {
  OCPP_VERSION: '2.1',
  EVEREST_IMAGE_TAG: '2025.6.1-dt-esdp',
};

function runEverestCompose(everestDir: string, args: ReadonlyArray<string>): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn(
      process.platform === 'win32' ? 'docker.exe' : 'docker',
      ['compose', ...args],
      {
        cwd: everestDir,
        env: { ...process.env, ...EVEREST_COMPOSE_ENV },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      },
    );
    let stderr = '';
    proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on('error', rejectPromise);
    proc.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else
        rejectPromise(
          new Error(
            `docker compose ${args.join(' ')} (cwd=${everestDir}) exited with code ${code}\n${stderr}`,
          ),
        );
    });
  });
}

// citrineos-core's OCPP listener is on host port 8081, path `/cp001`.
// start.sh already rewrites the manager's InternalCtrlr.json on every boot to
// point NetworkConnectionProfiles at ws://host.docker.internal:8081/cp001, and
// libocpp builds the device-model SQLite DB FROM that JSON the first time it
// creates the DB. So on a cold boot the runtime URL is already correct and no
// SQLite patch is needed. We only correct the DB directly for the rare
// warm/persisted-DB case where an old wrong URL lingers from a previous boot.
//
// CRITICAL: this is gated on a `sqlite3 -readonly` probe and only ever writes
// when the DB already exists WITH the expected schema. Plain `sqlite3 <path>`
// CREATES an empty database file when the path is missing — and an empty file
// at this path makes libocpp's InitDeviceModelDb abort on its next boot with
// "Database does not support migrations yet", crash-looping the manager. The
// read-only probe never creates the file, so it cannot poison a cold boot that
// is still initialising the DB.
const CORRECT_CSMS_URL_NEEDLE = 'host.docker.internal:8081/cp001';
const EVEREST_DEVICE_MODEL_DB = '/ext/dist/share/everest/modules/OCPP201/device_model_storage.db';
const CORRECT_NETWORK_PROFILE_JSON = JSON.stringify([
  {
    configurationSlot: 1,
    connectionData: {
      messageTimeout: 30,
      ocppCsmsUrl: 'ws://host.docker.internal:8081/cp001',
      ocppInterface: 'Wired0',
      ocppTransport: 'JSON',
      ocppVersion: 'OCPP20',
      securityProfile: 1,
    },
  },
]);

// Reads the current NetworkConnectionProfiles value via `sqlite3 -readonly` so
// a missing/uninitialised DB is never created as an empty file. Returns null
// when the DB file or table isn't ready yet (cold boot still migrating) or the
// row is absent — callers treat null as "nothing to patch".
async function readEverestNetworkProfile(): Promise<string | null> {
  return new Promise((resolve) => {
    const proc = spawn(
      process.platform === 'win32' ? 'docker.exe' : 'docker',
      [
        'exec',
        'everest-manager-1',
        'sqlite3',
        '-readonly',
        EVEREST_DEVICE_MODEL_DB,
        "SELECT VALUE FROM VARIABLE_ATTRIBUTE WHERE VARIABLE_ID = (SELECT ID FROM VARIABLE WHERE NAME='NetworkConnectionProfiles');",
      ],
      { stdio: ['ignore', 'pipe', 'pipe'], shell: false },
    );
    let stdout = '';
    proc.stdout?.on('data', (c: Buffer) => (stdout += c.toString()));
    proc.on('exit', (code) => resolve(code === 0 ? stdout.trim() : null));
    proc.on('error', () => resolve(null));
  });
}

async function patchEverestNetworkProfile(): Promise<void> {
  // Wait — read-only, so we never create an empty file that would crash
  // libocpp's migration init — until libocpp has materialised the device-model
  // DB, then rewrite the network profile. The rewrite is REQUIRED on every boot,
  // not just warm/stale ones: start.sh bakes ocppVersion=OCPP21 (from
  // OCPP_VERSION=2.1) into the DB, but citrineos-core speaks OCPP 2.0.1, so the
  // profile must be downgraded to OCPP20 (and the CSMS URL pinned to
  // host:8081/cp001) before the manager can register with core. The trailing
  // `docker restart` makes libocpp reconnect with the corrected profile, which
  // also yields the fresh BootNotification/StatusNotification that
  // awaitStationOnline waits for.
  const deadline = Date.now() + DB_READY_TIMEOUT_MS;
  let current = await readEverestNetworkProfile();
  while (current === null) {
    if (Date.now() >= deadline) return; // DB never appeared — awaitStationOnline reports it
    await delay(POLL_INTERVAL_MS);
    current = await readEverestNetworkProfile();
  }
  // Already exactly the citrineos profile (warm DB patched on a prior run) —
  // skip the rewrite+restart to avoid a needless reconnect cycle.
  if (current.includes(CORRECT_CSMS_URL_NEEDLE) && current.includes('"ocppVersion":"OCPP20"')) {
    return;
  }

  const escaped = CORRECT_NETWORK_PROFILE_JSON.replace(/'/g, "''");
  const sql = `UPDATE VARIABLE_ATTRIBUTE SET VALUE='${escaped}' WHERE VARIABLE_ID = (SELECT ID FROM VARIABLE WHERE NAME='NetworkConnectionProfiles');\n`;
  // Pipe SQL via stdin to avoid shell quoting hell with the embedded JSON.
  await new Promise<void>((res, rej) => {
    const proc = spawn(
      process.platform === 'win32' ? 'docker.exe' : 'docker',
      ['exec', '-i', 'everest-manager-1', 'sqlite3', EVEREST_DEVICE_MODEL_DB],
      { stdio: ['pipe', 'pipe', 'pipe'], shell: false },
    );
    let stderr = '';
    proc.stderr?.on('data', (c: Buffer) => (stderr += c.toString()));
    proc.on('exit', (code) => {
      if (code === 0) res();
      else rej(new Error(`SQLite patch failed (code ${code}): ${stderr}`));
    });
    proc.on('error', rej);
    proc.stdin?.write(sql);
    proc.stdin?.end();
  });
  await new Promise<void>((res) => {
    const proc = spawn(
      process.platform === 'win32' ? 'docker.exe' : 'docker',
      ['restart', 'everest-manager-1'],
      { stdio: 'ignore', shell: process.platform === 'win32' },
    );
    proc.on('exit', () => res());
    proc.on('error', () => res());
  });
}

// citrineos-core only creates Evse / Connector rows from explicit OCPP
// configuration messages (GetBaseReport / NotifyReport flows), not from
// BootNotification or StatusNotification. The EVerest manager image does
// not initiate that handshake out of the box, so the Hasura tables stay
// empty and any modal that drives an EvseSelector / ConnectorSelector
// (UnlockConnector, RemoteStart, RemoteStop) cannot find selectable
// options. We therefore seed a minimal EVSE+Connector pair under the
// EVerest station so happy-path scenarios can render and submit. The
// rows are idempotent and removed by the global purge along with the
// EVerest station itself.

// Seeds an Accepted Authorization the EVerest RemoteStart can present.
//
// The token type must be `Central`, not `ISO14443`: citrineos-core validates
// the idToken format per type when the charger relays an Authorize, and an
// ISO14443 token must be 8 or 14 hex characters — a descriptive value like
// `EVEREST-CP001-AUTH` fails that check, so core answers the Authorize with a
// PropertyConstraintViolation CALLERROR and the session is deauthorized.
// `Central` (a CSMS-issued token, which is what a remote start actually is)
// only requires letters/numbers/`* - _ = : + | @ .`, so the readable value is
// accepted. The row must persist (createdAt/updatedAt set) so the lookup
// returns Accepted and the started transaction stays authorized.
//
// Idempotency: the Authorizations table has a unique INDEX on
// (idToken, idTokenType) but no matching unique CONSTRAINT, so Hasura cannot
// resolve `on_conflict: { constraint: idToken_type }` at runtime even though
// its enum lists the name. Query-then-insert keeps the helper idempotent
// without depending on a constraint Hasura cannot apply.
async function ensureEverestAuthorization(api: ApiClient): Promise<string> {
  const idToken = 'EVEREST-CP001-AUTH';
  const idTokenType = 'Central';
  const { Authorizations } = await api.gql<{
    Authorizations: { id: number }[];
  }>(
    `query EverestAuthExists($idToken: citext!, $idTokenType: String!) {
       Authorizations(
         where: { idToken: { _eq: $idToken }, idTokenType: { _eq: $idTokenType } }
         limit: 1
       ) { id }
     }`,
    { idToken, idTokenType },
  );
  if (Authorizations.length > 0) return idToken;
  const now = new Date().toISOString();
  await api
    .gql(
      `mutation InsertEverestAuth($obj: Authorizations_insert_input!) {
         insert_Authorizations_one(object: $obj) { id }
       }`,
      {
        obj: {
          idToken,
          idTokenType,
          status: 'Accepted',
          createdAt: now,
          updatedAt: now,
        },
      },
    )
    .catch(() => undefined);
  return idToken;
}

async function ensureEverestEvseAndConnector(api: ApiClient, stationId: number): Promise<void> {
  const now = new Date().toISOString();
  // Insert an EVSE if missing.
  await api
    .gql<{ insert_Evses_one: { id: number } | null }>(
      `mutation EnsureEvse($obj: Evses_insert_input!) {
         insert_Evses_one(
           object: $obj,
           on_conflict: { constraint: stationId_evseTypeId, update_columns: [updatedAt] }
         ) { id }
       }`,
      {
        obj: {
          stationId,
          ocppConnectionName: EVEREST_OCPP_CONNECTION_NAME,
          evseTypeId: 1,
          removed: false,
          createdAt: now,
          updatedAt: now,
        },
      },
    )
    .catch(() => undefined);
  // Insert a Connector if missing. evseId is the Evse row's PK; the
  // EvseSelector uses both id and evseTypeId, so we read the EVSE back to
  // get its real id.
  const { Evses } = await api.gql<{
    Evses: { id: number; evseTypeId: number }[];
  }>(
    `query LookupEvse($stationId: Int!) {
       Evses(where: { stationId: { _eq: $stationId } }) { id evseTypeId }
     }`,
    { stationId },
  );
  const evse = Evses[0];
  if (!evse) return;
  await api
    .gql(
      `mutation EnsureConnector($obj: Connectors_insert_input!) {
         insert_Connectors_one(
           object: $obj,
           on_conflict: { constraint: stationId_connectorId, update_columns: [updatedAt] }
         ) { id }
       }`,
      {
        obj: {
          evseId: evse.id,
          connectorId: 1,
          evseTypeConnectorId: 1,
          ocppConnectionName: EVEREST_OCPP_CONNECTION_NAME,
          stationId,
          createdAt: now,
          updatedAt: now,
        },
      },
    )
    .catch(() => undefined);
}

// Publishes one retained-less MQTT message to the EVerest broker by exec-ing
// mosquitto_pub inside the broker container (the broker is not host-exposed).
function mosquittoPub(topic: string, message: string): Promise<void> {
  return new Promise((res, rej) => {
    const proc = spawn(
      process.platform === 'win32' ? 'docker.exe' : 'docker',
      ['exec', EVEREST_MQTT_CONTAINER, 'mosquitto_pub', '-t', topic, '-m', message],
      { stdio: ['ignore', 'pipe', 'pipe'], shell: false },
    );
    let stderr = '';
    proc.stderr?.on('data', (c: Buffer) => (stderr += c.toString()));
    proc.on('exit', (code) => {
      if (code === 0) res();
      else rej(new Error(`mosquitto_pub ${topic} failed (code ${code}): ${stderr}`));
    });
    proc.on('error', rej);
  });
}

// Drives the car simulator to plug a vehicle into connector 1 and request
// charging. Toggling enable off→on first forces `simdata_reset_defaults`
// (executionActive=false, state=unplugged) so a clean A→B plug edge fires even
// if a prior session left the simulator mid-execution. The car then parks at
// `iec_wait_pwr_ready` until an authorization energizes the EVSE, so the caller
// has the Auth module's 120 s connection_timeout window to drive the UI
// RemoteStart that starts the transaction.
export async function simulatePlugIn(): Promise<void> {
  const enableTopic = `${CARSIM_CMD_PREFIX}/enable`;
  await mosquittoPub(enableTopic, 'false');
  await delay(2_000);
  await mosquittoPub(enableTopic, 'true');
  await delay(1_000);
  await mosquittoPub(`${CARSIM_CMD_PREFIX}/execute_charging_session`, PLUGIN_CHARGE_COMMAND);
}

// Unplugs the simulated vehicle (CP state → A), ending any session in progress.
// Used for best-effort test cleanup; replaces the running command sequence so
// it takes effect even while a charge session is active.
export async function simulateUnplug(): Promise<void> {
  await mosquittoPub(`${CARSIM_CMD_PREFIX}/modify_charging_session`, 'unplug');
}

export async function startEverest(options: EverestStartOptions = {}): Promise<EverestHandle> {
  const cwd = options.citrineCoreServerPath ?? defaultCorePath();
  const everestDir = resolve(cwd, 'everest');
  const bootTimeoutMs = options.bootTimeoutMs ?? DEFAULT_BOOT_TIMEOUT_MS;

  await runEverestCompose(everestDir, ['up', '-d']);
  await patchEverestNetworkProfile();

  const api = await makeApiClient();
  let id: number;
  try {
    id = await awaitStationOnline(api, EVEREST_OCPP_CONNECTION_NAME, bootTimeoutMs);
    await ensureEverestEvseAndConnector(api, id);
    await ensureEverestAuthorization(api);
  } finally {
    await api.dispose();
  }
  // After OCPP registration completes, citrine still has to flip the
  // ChargingStations.isOnline flag to true — that's a separate lifecycle from
  // the StatusNotification-based signal awaitStationOnline polled. The per-
  // test guard `ensureEverestOnline` checks isOnline, so pay any remaining
  // lag at worker setup once; subsequent @everest tests return from the
  // guard immediately.
  await ensureEverestOnline();

  return {
    ocppConnectionName: EVEREST_OCPP_CONNECTION_NAME,
    id,
    async stop() {
      const everestDir = resolve(cwd, 'everest');
      // `docker compose down` from the everest directory tears the
      // stack down. Wrapped in npm so we use the same toolchain shell as
      // start:everest. Errors are non-fatal so a failed teardown doesn't
      // mask test results.
      await new Promise<void>((res) => {
        const proc = spawn(
          process.platform === 'win32' ? 'docker.exe' : 'docker',
          ['compose', 'down'],
          {
            cwd: everestDir,
            stdio: 'ignore',
            shell: process.platform === 'win32',
          },
        );
        proc.on('exit', () => res());
        proc.on('error', () => res());
      });
    },
  };
}
