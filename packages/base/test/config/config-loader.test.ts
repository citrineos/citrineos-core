// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ConfigLoader } from '@config/config-loader.js';
import type { IFileStorage } from '@interfaces/files/file-storage.js';
import { OCPPVersion, type WebsocketServerConfig } from '@citrineos/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Clears the process-wide websocket servers config between cases. Reaching into the
 * private static keeps the reset out of ConfigLoader's public API — production code has
 * no reason to drop the config it just read.
 */
function resetWebsocketServersConfig(): void {
  (
    ConfigLoader as unknown as { websocketServers: WebsocketServerConfig[] | undefined }
  ).websocketServers = undefined;
}

function mockFileStorage(): IFileStorage {
  return {
    saveFile: vi.fn() as IFileStorage['saveFile'],
    getFile: vi.fn() as IFileStorage['getFile'],
    exists: vi.fn() as IFileStorage['exists'],
    createDirectory: vi.fn() as IFileStorage['createDirectory'],
    deleteFile: vi.fn() as IFileStorage['deleteFile'],
  };
}

/** A minimal server that satisfies every refinement on websocketServerSchema. */
function server(overrides: Partial<WebsocketServerConfig> = {}): Record<string, unknown> {
  return {
    id: 'ws-1',
    host: '0.0.0.0',
    port: 8081,
    protocols: [OCPPVersion.OCPP2_0_1],
    securityProfile: 1,
    tenantId: 1,
    ...overrides,
  };
}

describe('ConfigLoader', () => {
  let envSnapshot: NodeJS.ProcessEnv;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    envSnapshot = { ...process.env };
    for (const key of Object.keys(process.env)) {
      if (key.toLowerCase().startsWith('citrineos')) {
        delete process.env[key];
      }
    }
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    // The loader logs a debug line for every value that is not valid JSON.
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    resetWebsocketServersConfig();
  });

  afterEach(() => {
    process.env = envSnapshot;
    vi.restoreAllMocks();
    resetWebsocketServersConfig();
  });

  /** The messages the loader pushed to console.error, flattened to one string per call. */
  function loggedErrors(): string[] {
    return errorSpy.mock.calls.map((call) => String(call[0]));
  }

  describe('loadConfig', () => {
    it('returns a fully defaulted config when no prefixed variables are set', async () => {
      const config = await ConfigLoader.loadConfig();

      expect(config.env).toBe('development');
      expect(config.host).toBe('0.0.0.0');
      expect(config.port).toBe(8080);
      expect(config.database.host).toBe('localhost');
      expect(config.websocketServerConfigFile).toBe('websocket-servers.json');
      expect(loggedErrors()).toEqual([]);
    });

    it('ignores variables without the prefix', async () => {
      process.env.PORT = '1234';
      process.env.HOST = 'ignored.example.com';

      const config = await ConfigLoader.loadConfig();

      expect(config.port).toBe(8080);
      expect(config.host).toBe('0.0.0.0');
    });

    it('ignores variables set to an empty string, keeping the default', async () => {
      process.env.CITRINEOS_PORT = '';

      const config = await ConfigLoader.loadConfig();

      expect(config.port).toBe(8080);
      expect(loggedErrors()).toEqual([]);
    });

    it('parses JSON values so numbers and booleans keep their type', async () => {
      process.env.CITRINEOS_PORT = '9000';
      process.env.CITRINEOS_DATABASE_SYNC = 'true';

      const config = await ConfigLoader.loadConfig();

      expect(config.port).toBe(9000);
      expect(config.database.sync).toBe(true);
    });

    it('falls back to the raw string when a value is not valid JSON', async () => {
      process.env.CITRINEOS_HOST = '1.2.3.4';

      const config = await ConfigLoader.loadConfig();

      expect(config.host).toBe('1.2.3.4');
    });

    it('matches leaf keys case-insensitively against their camelCase schema key', async () => {
      process.env.CITRINEOS_LOGLEVEL = '5';

      const config = await ConfigLoader.loadConfig();

      expect(config.logLevel).toBe(5);
    });

    it('descends into nested objects', async () => {
      process.env.CITRINEOS_DATABASE_HOST = 'db.example.com';
      process.env.CITRINEOS_TIMEOUTS_MAXCALLLENGTHSECONDS = '10';

      const config = await ConfigLoader.loadConfig();

      expect(config.database.host).toBe('db.example.com');
      expect(config.timeouts.maxCallLengthSeconds).toBe(10);
    });

    it('assigns a whole subtree from a JSON object', async () => {
      process.env.CITRINEOS_DATABASE = '{"host":"json.example.com","port":6000}';

      const config = await ConfigLoader.loadConfig();

      expect(config.database.host).toBe('json.example.com');
      expect(config.database.port).toBe(6000);
      // Defaults still fill in the keys the JSON omitted.
      expect(config.database.dialect).toBe('postgres');
    });

    it('resolves a subtree named by its camelCase key, so the subtree defaults apply', async () => {
      process.env.CITRINEOS_INTEGRATIONS_CHARGINGSTATIONCA = '{}';

      const config = await ConfigLoader.loadConfig();

      expect(config.integrations.chargingStationCA).toEqual({
        name: 'acme',
        acme: {
          env: 'staging',
          accountKeyFilePath: 'certificates/acme_account_key.pem',
          email: 'test@citrineos.com',
        },
      });
    });

    it('reports an unknown top-level field instead of silently dropping it', async () => {
      process.env.CITRINEOS_NOTATHING = '1';

      const config = await ConfigLoader.loadConfig();

      expect(loggedErrors()).toEqual([
        "Environment variable 'CITRINEOS_NOTATHING' refers to unknown configuration field 'notathing'.",
      ]);
      expect(config).not.toHaveProperty('notathing');
    });

    it('reports a misspelled trailing segment rather than letting Zod strip it unnoticed', async () => {
      process.env.CITRINEOS_DATABASE_HSOT = 'typo.example.com';

      const config = await ConfigLoader.loadConfig();

      expect(loggedErrors()).toEqual([
        "Environment variable 'CITRINEOS_DATABASE_HSOT' refers to unknown configuration field 'hsot'.",
      ]);
      expect(config.database).not.toHaveProperty('hsot');
      expect(config.database.host).toBe('localhost');
    });

    it('reports a segment that continues past a leaf field', async () => {
      process.env.CITRINEOS_PORT_EXTRA = '1';

      const config = await ConfigLoader.loadConfig();

      expect(loggedErrors()).toEqual([
        "Environment variable 'CITRINEOS_PORT_EXTRA' refers to unknown configuration field 'extra'.",
      ]);
      expect(config.port).toBe(8080);
    });

    it('rejecting one variable leaves the rest of the config intact', async () => {
      process.env.CITRINEOS_DATABASE_HSOT = 'typo.example.com';
      process.env.CITRINEOS_PORT = '9000';

      const config = await ConfigLoader.loadConfig();

      expect(config.port).toBe(9000);
      expect(loggedErrors()).toHaveLength(1);
    });

    it('reports a segment whose parent has already been set to a non-object', async () => {
      // Insertion order decides which variable is seen first, so set the scalar first.
      process.env.CITRINEOS_DATABASE = '5';
      process.env.CITRINEOS_DATABASE_HOST = 'db.example.com';

      await expect(ConfigLoader.loadConfig()).rejects.toThrow();

      expect(loggedErrors()).toEqual([
        "Environment variable 'CITRINEOS_DATABASE_HOST' refers to configuration segment 'database', but its current value is not an object.",
      ]);
    });

    it('ignores prefixed variables that are deliberately outside the schema', async () => {
      process.env.CITRINEOS_USE_DRIZZLE = 'true';

      const config = await ConfigLoader.loadConfig();

      expect(loggedErrors()).toEqual([]);
      expect(config).not.toHaveProperty('use');
    });

    it('surfaces schema violations as a rejection', async () => {
      process.env.CITRINEOS_PORT = '-1';

      await expect(ConfigLoader.loadConfig()).rejects.toThrow();
    });
  });

  describe('loadWebsocketServersConfig', () => {
    it('reads, validates and applies defaults to the file contents', async () => {
      const fileStorage = mockFileStorage();
      vi.mocked(fileStorage.getFile).mockResolvedValue(JSON.stringify([server()]));

      const servers = await ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json');

      expect(fileStorage.getFile).toHaveBeenCalledWith('ws.json');
      expect(servers).toHaveLength(1);
      expect(servers[0].id).toBe('ws-1');
      expect(servers[0].pingInterval).toBe(60);
      expect(servers[0].allowUnknownChargingStations).toBe(false);
      expect(servers[0].dynamicTenantResolution).toBe(false);
    });

    it('reads the file once and hands every caller the same array', async () => {
      const fileStorage = mockFileStorage();
      vi.mocked(fileStorage.getFile).mockResolvedValue(JSON.stringify([server()]));

      const first = await ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json');
      const second = await ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json');

      expect(fileStorage.getFile).toHaveBeenCalledTimes(1);
      // Identity, not equality: a copy here is what let the container's value and the
      // network connection's copy drift apart.
      expect(second).toBe(first);
    });

    it('throws naming the file when it is missing', async () => {
      const fileStorage = mockFileStorage();
      vi.mocked(fileStorage.getFile).mockResolvedValue(undefined);

      await expect(
        ConfigLoader.loadWebsocketServersConfig(fileStorage, 'missing.json'),
      ).rejects.toThrow('Websocket servers config file not found: missing.json');
    });

    it('throws when the file is not valid JSON', async () => {
      const fileStorage = mockFileStorage();
      vi.mocked(fileStorage.getFile).mockResolvedValue('not json');

      await expect(
        ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json'),
      ).rejects.toThrow();
    });

    it('throws when a server fails schema validation', async () => {
      const fileStorage = mockFileStorage();
      // securityProfile 2 requires TLS key and certificate chain paths.
      vi.mocked(fileStorage.getFile).mockResolvedValue(
        JSON.stringify([server({ securityProfile: 2 })]),
      );

      await expect(
        ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json'),
      ).rejects.toThrow();
    });

    it('throws when two servers share an id', async () => {
      const fileStorage = mockFileStorage();
      vi.mocked(fileStorage.getFile).mockResolvedValue(
        JSON.stringify([server(), server({ port: 8082 })]),
      );

      await expect(
        ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json'),
      ).rejects.toThrow();
    });

    it('does not cache a failed read, so a later call retries the file', async () => {
      const fileStorage = mockFileStorage();
      vi.mocked(fileStorage.getFile).mockResolvedValueOnce(undefined);

      await expect(
        ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json'),
      ).rejects.toThrow();

      vi.mocked(fileStorage.getFile).mockResolvedValue(JSON.stringify([server()]));
      const servers = await ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json');

      expect(servers).toHaveLength(1);
      expect(fileStorage.getFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveWebsocketServersConfig', () => {
    it('writes the validated config to the given file', async () => {
      const fileStorage = mockFileStorage();

      await ConfigLoader.saveWebsocketServersConfig(fileStorage, 'ws.json', [
        server() as unknown as WebsocketServerConfig,
      ]);

      expect(fileStorage.saveFile).toHaveBeenCalledTimes(1);
      const [fileName, content] = vi.mocked(fileStorage.saveFile).mock.calls[0];
      expect(fileName).toBe('ws.json');
      const written = JSON.parse((content as Buffer).toString());
      expect(written).toHaveLength(1);
      expect(written[0].id).toBe('ws-1');
      // Written back with the schema defaults resolved, not as it came in.
      expect(written[0].pingInterval).toBe(60);
    });

    it('updates the array earlier callers are holding', async () => {
      const fileStorage = mockFileStorage();
      vi.mocked(fileStorage.getFile).mockResolvedValue(JSON.stringify([server()]));

      const held = await ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json');
      expect(held[0].tlsKeyFilePath).toBeUndefined();

      await ConfigLoader.saveWebsocketServersConfig(fileStorage, 'ws.json', [
        server({
          securityProfile: 2,
          tlsKeyFilePath: 'key.pem',
          tlsCertificateChainFilePath: 'chain.pem',
        }) as unknown as WebsocketServerConfig,
      ]);

      // This is the guarantee the refactor rests on: no consumer keeps a stale snapshot.
      expect(held).toHaveLength(1);
      expect(held[0].tlsKeyFilePath).toBe('key.pem');
      expect(held[0].securityProfile).toBe(2);
      expect(await ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json')).toBe(held);
    });

    it('reflects a removed server in the array earlier callers are holding', async () => {
      const fileStorage = mockFileStorage();
      vi.mocked(fileStorage.getFile).mockResolvedValue(
        JSON.stringify([server(), server({ id: 'ws-2', port: 8082 })]),
      );

      const held = await ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json');
      expect(held).toHaveLength(2);

      await ConfigLoader.saveWebsocketServersConfig(fileStorage, 'ws.json', [
        server() as unknown as WebsocketServerConfig,
      ]);

      expect(held).toHaveLength(1);
      expect(held[0].id).toBe('ws-1');
    });

    it('writes nothing and leaves the shared array untouched when validation fails', async () => {
      const fileStorage = mockFileStorage();
      vi.mocked(fileStorage.getFile).mockResolvedValue(JSON.stringify([server()]));

      const held = await ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json');

      await expect(
        ConfigLoader.saveWebsocketServersConfig(fileStorage, 'ws.json', [
          // securityProfile 3 without the mTLS key path.
          server({ securityProfile: 3 }) as unknown as WebsocketServerConfig,
        ]),
      ).rejects.toThrow();

      expect(fileStorage.saveFile).not.toHaveBeenCalled();
      expect(held).toHaveLength(1);
      expect(held[0].securityProfile).toBe(1);
    });

    it('seeds the config when saved before anything read the file', async () => {
      const fileStorage = mockFileStorage();

      await ConfigLoader.saveWebsocketServersConfig(fileStorage, 'ws.json', [
        server({ id: 'ws-saved' }) as unknown as WebsocketServerConfig,
      ]);

      const servers = await ConfigLoader.loadWebsocketServersConfig(fileStorage, 'ws.json');

      expect(servers[0].id).toBe('ws-saved');
      expect(fileStorage.getFile).not.toHaveBeenCalled();
    });
  });
});
