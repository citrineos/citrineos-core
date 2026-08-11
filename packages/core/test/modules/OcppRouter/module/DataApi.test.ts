// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  BadRequestError,
  ConfigStoreFactory,
  NotFoundError,
  type ConfigStore,
  type INetworkConnection,
} from '@citrineos/base';
import { type WebsocketServerConfig } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminApi } from '@modules/OcppRouter/src/module/DataApi.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

// Prevent the AbstractModuleApi constructor from registering real routes against a fake server.
vi.spyOn(Reflect, 'getMetadata').mockReturnValue([]);

const TENANT_ID = 1;

function buildWebsocketConfig(overrides?: Partial<WebsocketServerConfig>): WebsocketServerConfig {
  return {
    id: 'server-1',
    host: '0.0.0.0',
    port: 8443,
    pingInterval: 60,
    protocols: [],
    securityProfile: 2,
    allowUnknownChargingStations: false,
    dynamicTenantResolution: false,
    ...overrides,
  } as WebsocketServerConfig;
}

function buildRequest(serverId: string | string[], body: any = {}): any {
  return {
    query: { tenantId: TENANT_ID, serverId },
    body,
  };
}

describe('AdminApi.generateCertificateChain', () => {
  const { container } = createTestContainer();
  let adminApi: AdminApi;
  let mockNetworkConnection: INetworkConnection;
  let mockServerNetworkProfileRepository: any;
  let mockInstallCertificateHelperService: any;
  let websocketServers: WebsocketServerConfig[];

  // ConfigStoreFactory is a process-wide singleton that only accepts setConfigStore()
  // once; re-registering a fresh mock object every test would silently no-op after the
  // first test. Instead, register one mock instance up front and reconfigure its
  // fetchConfig/saveConfig behavior per test.
  const mockConfigStore = {
    fetchConfig: vi.fn(),
    saveConfig: vi.fn().mockResolvedValue(undefined),
  };
  ConfigStoreFactory.setConfigStore(mockConfigStore as unknown as ConfigStore);

  beforeEach(() => {
    vi.clearAllMocks();

    websocketServers = [
      buildWebsocketConfig({ id: 'server-1' }),
      buildWebsocketConfig({ id: 'server-2' }),
    ];

    mockNetworkConnection = {
      reloadTlsCertificates: vi.fn().mockResolvedValue(undefined),
    } as any;

    mockServerNetworkProfileRepository = {
      upsertServerNetworkProfile: vi.fn().mockResolvedValue(undefined),
    };

    mockInstallCertificateHelperService = {
      generateCertificateChain: vi.fn(),
      generateStandaloneFullChain: vi.fn(),
      // Default: each requested server ends up in its own singleton group (today's
      // "independent" behavior). Tests that care about shared-chain grouping override this.
      groupServersForGeneration: vi
        .fn()
        .mockImplementation((_tenantId: number, configs: WebsocketServerConfig[]) =>
          Promise.resolve(configs.map((c) => [c])),
        ),
    };

    mockConfigStore.fetchConfig.mockResolvedValue({
      util: { networkConnection: { websocketServers } },
      maxCallLengthSeconds: 30,
    });
    mockConfigStore.saveConfig.mockResolvedValue(undefined);

    adminApi = getTestInstance(container, AdminApi, {
      router: {
        config: { util: { networkConnection: { websocketServers } }, maxCallLengthSeconds: 30 },
      } as any,
      networkConnection: mockNetworkConnection,
      server: { register: vi.fn() } as any,
      subscriptionRepository: {} as any,
      serverNetworkProfileRepository: mockServerNetworkProfileRepository,
      tenantRepository: {} as any,
      installCertificateHelperService: mockInstallCertificateHelperService,
    });
  });

  it('throws NotFoundError for an unknown serverId', async () => {
    await expect(adminApi.generateCertificateChain(buildRequest('unknown'))).rejects.toThrow(
      NotFoundError,
    );
  });

  it('throws BadRequestError for a server that is not TLS-enabled', async () => {
    websocketServers.push(buildWebsocketConfig({ id: 'plain', securityProfile: 0 }));

    await expect(adminApi.generateCertificateChain(buildRequest('plain'))).rejects.toThrow(
      BadRequestError,
    );
  });

  it('regenerates, persists, and reloads a single server', async () => {
    const certificates = [{ id: 1 }] as any;
    const filePaths = {
      tlsKeyFilePath: 'Leaf_Key_1.pem',
      tlsCertificateChainFilePath: 'Chain_1.pem',
    };
    mockInstallCertificateHelperService.generateCertificateChain.mockResolvedValue({
      certificates,
      filePaths,
    });

    const result = await adminApi.generateCertificateChain(buildRequest('server-1'));

    expect(mockInstallCertificateHelperService.generateCertificateChain).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({ id: 'server-1' }),
      expect.anything(),
    );
    expect(mockConfigStore.saveConfig).toHaveBeenCalledTimes(1);
    expect(mockServerNetworkProfileRepository.upsertServerNetworkProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'server-1', ...filePaths }),
      30,
    );
    expect(mockNetworkConnection.reloadTlsCertificates).toHaveBeenCalledWith('server-1');
    expect(result).toEqual([{ serverIds: ['server-1'], certificates }]);

    const updatedConfig = websocketServers.find((ws) => ws.id === 'server-1')!;
    expect(updatedConfig.tlsKeyFilePath).toBe('Leaf_Key_1.pem');
    expect(updatedConfig.tlsCertificateChainFilePath).toBe('Chain_1.pem');
  });

  it('resolves multiple serverIds independently when they do not share a group', async () => {
    mockInstallCertificateHelperService.generateCertificateChain
      .mockResolvedValueOnce({
        certificates: [{ id: 1 }],
        filePaths: { tlsKeyFilePath: 'a', tlsCertificateChainFilePath: 'b' },
      })
      .mockResolvedValueOnce({
        certificates: [{ id: 2 }],
        filePaths: { tlsKeyFilePath: 'c', tlsCertificateChainFilePath: 'd' },
      });

    const result = await adminApi.generateCertificateChain(buildRequest(['server-1', 'server-2']));

    expect(mockInstallCertificateHelperService.groupServersForGeneration).toHaveBeenCalledWith(
      TENANT_ID,
      [expect.objectContaining({ id: 'server-1' }), expect.objectContaining({ id: 'server-2' })],
      'Leaf',
    );
    expect(mockInstallCertificateHelperService.generateCertificateChain).toHaveBeenCalledTimes(2);
    expect(mockNetworkConnection.reloadTlsCertificates).toHaveBeenCalledWith('server-1');
    expect(mockNetworkConnection.reloadTlsCertificates).toHaveBeenCalledWith('server-2');
    expect(result).toEqual([
      { serverIds: ['server-1'], certificates: [{ id: 1 }] },
      { serverIds: ['server-2'], certificates: [{ id: 2 }] },
    ]);
  });

  it('shares a single generated chain across servers grouped together', async () => {
    mockInstallCertificateHelperService.groupServersForGeneration.mockImplementation(
      (_tenantId: number, configs: WebsocketServerConfig[]) => Promise.resolve([configs]),
    );
    const certificates = [{ id: 1 }] as any;
    const filePaths = {
      tlsKeyFilePath: 'shared-key.pem',
      tlsCertificateChainFilePath: 'shared-chain.pem',
    };
    mockInstallCertificateHelperService.generateCertificateChain.mockResolvedValue({
      certificates,
      filePaths,
    });

    const result = await adminApi.generateCertificateChain(buildRequest(['server-1', 'server-2']));

    // Only called once for the whole group, against the group's first (representative) server.
    expect(mockInstallCertificateHelperService.generateCertificateChain).toHaveBeenCalledTimes(1);
    expect(mockInstallCertificateHelperService.generateCertificateChain).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({ id: 'server-1' }),
      expect.anything(),
    );

    // But both group members get the same new file paths, get persisted, and get reloaded.
    const updatedServer1 = websocketServers.find((ws) => ws.id === 'server-1')!;
    const updatedServer2 = websocketServers.find((ws) => ws.id === 'server-2')!;
    expect(updatedServer1.tlsCertificateChainFilePath).toBe('shared-chain.pem');
    expect(updatedServer2.tlsCertificateChainFilePath).toBe('shared-chain.pem');
    expect(mockServerNetworkProfileRepository.upsertServerNetworkProfile).toHaveBeenCalledTimes(2);
    expect(mockNetworkConnection.reloadTlsCertificates).toHaveBeenCalledWith('server-1');
    expect(mockNetworkConnection.reloadTlsCertificates).toHaveBeenCalledWith('server-2');
    expect(result).toEqual([{ serverIds: ['server-1', 'server-2'], certificates }]);
  });

  it("only writes fields required for each group member's own securityProfile", async () => {
    websocketServers.push(buildWebsocketConfig({ id: 'server-3', securityProfile: 3 }));
    mockInstallCertificateHelperService.groupServersForGeneration.mockImplementation(
      (_tenantId: number, configs: WebsocketServerConfig[]) => Promise.resolve([configs]),
    );
    const filePaths = {
      tlsKeyFilePath: 'Leaf_Key_1.pem',
      tlsCertificateChainFilePath: 'Chain_1.pem',
      mtlsCertificateAuthorityKeyFilePath: 'SubCA_Key_1.pem',
      rootCACertificateFilePath: 'Root_Certificate_1.pem',
    };
    mockInstallCertificateHelperService.generateCertificateChain.mockResolvedValue({
      certificates: [{ id: 1 }],
      filePaths,
    });

    await adminApi.generateCertificateChain(buildRequest(['server-1', 'server-3']));

    // server-1 is securityProfile 2: tls fields + root cert are written, but not the subCA key.
    const profile2Config = websocketServers.find((ws) => ws.id === 'server-1')!;
    expect(profile2Config.tlsKeyFilePath).toBe('Leaf_Key_1.pem');
    expect(profile2Config.tlsCertificateChainFilePath).toBe('Chain_1.pem');
    expect(profile2Config.mtlsCertificateAuthorityKeyFilePath).toBeUndefined();
    expect(profile2Config.rootCACertificateFilePath).toBe('Root_Certificate_1.pem');

    // server-3 is securityProfile 3: all four fields are written.
    const profile3Config = websocketServers.find((ws) => ws.id === 'server-3')!;
    expect(profile3Config.tlsKeyFilePath).toBe('Leaf_Key_1.pem');
    expect(profile3Config.tlsCertificateChainFilePath).toBe('Chain_1.pem');
    expect(profile3Config.mtlsCertificateAuthorityKeyFilePath).toBe('SubCA_Key_1.pem');
    expect(profile3Config.rootCACertificateFilePath).toBe('Root_Certificate_1.pem');

    // The ServerNetworkProfile DB mirror is not filtered by securityProfile, though:
    // it should get every generated field, even for the profile-2 server whose live
    // config never received mtlsCertificateAuthorityKeyFilePath.
    expect(mockServerNetworkProfileRepository.upsertServerNetworkProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'server-1', ...filePaths }),
      30,
    );
    expect(mockServerNetworkProfileRepository.upsertServerNetworkProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'server-3', ...filePaths }),
      30,
    );
  });

  it('does not clobber an existing field the generation scope did not return (e.g. SubCAAndLeaf omitting rootCACertificateFilePath)', async () => {
    // Server already has a root cert configured from an earlier FullChain generation.
    websocketServers[0].rootCACertificateFilePath = 'Root_Certificate_existing.pem';
    // SubCAAndLeaf's result has no rootCACertificateFilePath key at all — root wasn't regenerated.
    const filePaths = {
      tlsKeyFilePath: 'Leaf_Key_2.pem',
      tlsCertificateChainFilePath: 'Chain_2.pem',
      mtlsCertificateAuthorityKeyFilePath: 'SubCA_Key_2.pem',
    };
    mockInstallCertificateHelperService.generateCertificateChain.mockResolvedValue({
      certificates: [{ id: 1 }],
      filePaths,
    });

    await adminApi.generateCertificateChain(buildRequest('server-1'));

    const updatedConfig = websocketServers.find((ws) => ws.id === 'server-1')!;
    expect(updatedConfig.tlsKeyFilePath).toBe('Leaf_Key_2.pem');
    expect(updatedConfig.tlsCertificateChainFilePath).toBe('Chain_2.pem');
    // securityProfile 2, so mtls key isn't applied to the live config either way.
    expect(updatedConfig.mtlsCertificateAuthorityKeyFilePath).toBeUndefined();
    // The existing root cert path must survive untouched, not get overwritten to undefined.
    expect(updatedConfig.rootCACertificateFilePath).toBe('Root_Certificate_existing.pem');
  });

  it('propagates a scope-specific error from the helper service without reloading', async () => {
    mockInstallCertificateHelperService.generateCertificateChain.mockRejectedValue(
      new BadRequestError('root/subCA do not exist'),
    );

    await expect(adminApi.generateCertificateChain(buildRequest('server-1'))).rejects.toThrow(
      BadRequestError,
    );
    expect(mockNetworkConnection.reloadTlsCertificates).not.toHaveBeenCalled();
  });

  describe('standalone (no serverId)', () => {
    const serverlessRequest = (body: any = {}): any => ({
      query: { tenantId: TENANT_ID },
      body,
    });

    it('generates a standalone full chain without touching config or reloading', async () => {
      const certificates = [{ id: 1 }, { id: 2 }, { id: 3 }] as any;
      const filePaths = {
        tlsKeyFilePath: 'Leaf_Key_1.pem',
        tlsCertificateChainFilePath: 'Cert_Chain_1.pem',
        mtlsCertificateAuthorityKeyFilePath: 'SubCA_Key_1.pem',
        rootCACertificateFilePath: 'Root_Certificate_1.pem',
      };
      mockInstallCertificateHelperService.generateStandaloneFullChain.mockResolvedValue({
        certificates,
        filePaths,
      });

      const result = await adminApi.generateCertificateChain(serverlessRequest());

      expect(mockInstallCertificateHelperService.generateStandaloneFullChain).toHaveBeenCalledWith(
        TENANT_ID,
        expect.anything(),
      );
      // No server-scoped work: no grouping, no per-server generation, no persist, no reload.
      expect(mockInstallCertificateHelperService.groupServersForGeneration).not.toHaveBeenCalled();
      expect(mockInstallCertificateHelperService.generateCertificateChain).not.toHaveBeenCalled();
      expect(mockConfigStore.saveConfig).not.toHaveBeenCalled();
      expect(mockServerNetworkProfileRepository.upsertServerNetworkProfile).not.toHaveBeenCalled();
      expect(mockNetworkConnection.reloadTlsCertificates).not.toHaveBeenCalled();
      // Standalone response: certificates + filePaths, no serverId.
      expect(result).toEqual({ certificates, filePaths });
    });

    it('throws BadRequestError if a non-FullChain scope is requested without a serverId', async () => {
      await expect(
        adminApi.generateCertificateChain(serverlessRequest({ generationScope: 'Leaf' })),
      ).rejects.toThrow(BadRequestError);
      expect(
        mockInstallCertificateHelperService.generateStandaloneFullChain,
      ).not.toHaveBeenCalled();
    });

    it('allows an explicit FullChain scope without a serverId', async () => {
      const filePaths = {
        tlsKeyFilePath: 'Leaf_Key_1.pem',
        tlsCertificateChainFilePath: 'Cert_Chain_1.pem',
        mtlsCertificateAuthorityKeyFilePath: 'SubCA_Key_1.pem',
        rootCACertificateFilePath: 'Root_Certificate_1.pem',
      };
      mockInstallCertificateHelperService.generateStandaloneFullChain.mockResolvedValue({
        certificates: [{ id: 1 }],
        filePaths,
      });

      const result = await adminApi.generateCertificateChain(
        serverlessRequest({ generationScope: 'FullChain' }),
      );

      expect(mockInstallCertificateHelperService.generateStandaloneFullChain).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toEqual({ certificates: [{ id: 1 }], filePaths });
    });
  });
});

describe('AdminApi websocket tenant path mapping', () => {
  const { container } = createTestContainer();
  let adminApi: AdminApi;
  let mockTenantRepository: any;
  let mockCache: { set: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };

  const tenant = (overrides?: Record<string, unknown>) => ({
    id: TENANT_ID,
    name: 'tenant-1',
    isUserTenant: false,
    tenantWebsocketServerPath: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockTenantRepository = {
      readByKey: vi.fn().mockResolvedValue(tenant()),
      readByWebsocketServerPath: vi.fn().mockResolvedValue(undefined),
      readAllWithWebsocketServerPath: vi.fn().mockResolvedValue([]),
      updateWebsocketServerPath: vi
        .fn()
        .mockImplementation((tenantId: number, path: string | null) =>
          Promise.resolve(tenant({ id: tenantId, tenantWebsocketServerPath: path })),
        ),
    };

    mockCache = {
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(true),
    };

    adminApi = getTestInstance(container, AdminApi, {
      router: {
        config: { util: { networkConnection: { websocketServers: [] } } },
        cache: mockCache,
      } as any,
      networkConnection: {} as any,
      server: { register: vi.fn() } as any,
      subscriptionRepository: {} as any,
      serverNetworkProfileRepository: {} as any,
      tenantRepository: mockTenantRepository,
      installCertificateHelperService: {} as any,
    });
  });

  const mappingRequest = (query: Record<string, unknown>): any => ({ query });

  it('assigns the path to the tenant and caches it', async () => {
    const result = await adminApi.putWebsocketMapping(
      mappingRequest({ path: 'acme', tenantId: TENANT_ID }),
    );

    expect(mockTenantRepository.updateWebsocketServerPath).toHaveBeenCalledWith(TENANT_ID, 'acme');
    expect(mockCache.set).toHaveBeenCalledWith('acme', String(TENANT_ID), 'tpm');
    expect(mockCache.remove).not.toHaveBeenCalled();
    expect(result.tenantWebsocketServerPath).toBe('acme');
  });

  it('evicts the previous path from the cache when a tenant is re-mapped', async () => {
    mockTenantRepository.readByKey.mockResolvedValue(
      tenant({ tenantWebsocketServerPath: 'old-path' }),
    );

    await adminApi.putWebsocketMapping(mappingRequest({ path: 'new-path', tenantId: TENANT_ID }));

    expect(mockCache.remove).toHaveBeenCalledWith('old-path', 'tpm');
    expect(mockCache.set).toHaveBeenCalledWith('new-path', String(TENANT_ID), 'tpm');
  });

  it('rejects a path already mapped to another tenant', async () => {
    mockTenantRepository.readByWebsocketServerPath.mockResolvedValue(
      tenant({ id: 2, tenantWebsocketServerPath: 'acme' }),
    );

    await expect(
      adminApi.putWebsocketMapping(mappingRequest({ path: 'acme', tenantId: TENANT_ID })),
    ).rejects.toThrow(BadRequestError);
    expect(mockTenantRepository.updateWebsocketServerPath).not.toHaveBeenCalled();
    expect(mockCache.set).not.toHaveBeenCalled();
  });

  // A multi-segment path would resolve to whatever its LAST segment is, letting a tenant
  // register 'tenant2/tenant1' and have its connections land on tenant1.
  it.each(['tenant2/tenant1', '/leading', 'trailing/', 'a%2Fb', 'has space', ''])(
    'rejects the path %j because it is not a single URL segment',
    async (path) => {
      await expect(
        adminApi.putWebsocketMapping(mappingRequest({ path, tenantId: TENANT_ID })),
      ).rejects.toThrow(BadRequestError);
      expect(mockTenantRepository.updateWebsocketServerPath).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    },
  );

  it('throws NotFoundError when the tenant does not exist', async () => {
    mockTenantRepository.readByKey.mockResolvedValue(undefined);

    await expect(
      adminApi.putWebsocketMapping(mappingRequest({ path: 'acme', tenantId: 404 })),
    ).rejects.toThrow(NotFoundError);
    expect(mockTenantRepository.updateWebsocketServerPath).not.toHaveBeenCalled();
  });

  it('clears the mapping and removes the cached path on delete', async () => {
    mockTenantRepository.readByKey.mockResolvedValue(tenant({ tenantWebsocketServerPath: 'acme' }));

    const result = await adminApi.deleteWebsocketMapping(mappingRequest({ tenantId: TENANT_ID }));

    expect(mockTenantRepository.updateWebsocketServerPath).toHaveBeenCalledWith(TENANT_ID, null);
    expect(mockCache.remove).toHaveBeenCalledWith('acme', 'tpm');
    expect(result.tenantWebsocketServerPath).toBeNull();
  });

  it('throws NotFoundError when deleting a mapping the tenant does not have', async () => {
    await expect(
      adminApi.deleteWebsocketMapping(mappingRequest({ tenantId: TENANT_ID })),
    ).rejects.toThrow(NotFoundError);
    expect(mockTenantRepository.updateWebsocketServerPath).not.toHaveBeenCalled();
    expect(mockCache.remove).not.toHaveBeenCalled();
  });
});
