// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { BadRequestError, NotFoundError, type IFileStorage } from '@citrineos/base';
import { type SystemConfig, type WebsocketServerConfig } from '@citrineos/types';
import { GenerateCertificateChainEndpoint } from '@modules/OcppRouter/src/module/endpoints/GenerateCertificateChainEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('GenerateCertificateChainEndpoint', () => {
  const { container } = createTestContainer();
  let endpoint: GenerateCertificateChainEndpoint;
  let mockNetworkConnection: {
    getWebsocketServers: ReturnType<typeof vi.fn>;
    saveWebsocketServersConfig: ReturnType<typeof vi.fn>;
    reloadTlsCertificates: ReturnType<typeof vi.fn>;
  };
  let mockServerNetworkProfileRepository: any;
  let mockInstallCertificateHelperService: any;
  let websocketServers: WebsocketServerConfig[];

  beforeEach(() => {
    vi.clearAllMocks();

    websocketServers = [
      buildWebsocketConfig({ id: 'server-1' }),
      buildWebsocketConfig({ id: 'server-2' }),
    ];

    mockNetworkConnection = {
      getWebsocketServers: vi.fn().mockReturnValue(websocketServers),
      saveWebsocketServersConfig: vi.fn().mockResolvedValue(undefined),
      reloadTlsCertificates: vi.fn().mockResolvedValue(undefined),
    };

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

    endpoint = getTestInstance(container, GenerateCertificateChainEndpoint, {
      config: { timeouts: { maxCallLengthSeconds: 30 } } as SystemConfig,
      networkConnection: mockNetworkConnection as any,
      fileStorage: {} as IFileStorage,
      serverNetworkProfileRepository: mockServerNetworkProfileRepository,
      installCertificateHelperService: mockInstallCertificateHelperService,
    });
  });

  it('throws NotFoundError for an unknown serverId', async () => {
    await expect(endpoint.handle(buildRequest('unknown'))).rejects.toThrow(NotFoundError);
  });

  it('throws BadRequestError for a server that is not TLS-enabled', async () => {
    websocketServers.push(buildWebsocketConfig({ id: 'plain', securityProfile: 0 }));

    await expect(endpoint.handle(buildRequest('plain'))).rejects.toThrow(BadRequestError);
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

    const result = await endpoint.handle(buildRequest('server-1'));

    expect(mockInstallCertificateHelperService.generateCertificateChain).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({ id: 'server-1' }),
      expect.anything(),
    );
    expect(mockNetworkConnection.saveWebsocketServersConfig).toHaveBeenCalledTimes(1);
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

    const result = await endpoint.handle(buildRequest(['server-1', 'server-2']));

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

    const result = await endpoint.handle(buildRequest(['server-1', 'server-2']));

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

    await endpoint.handle(buildRequest(['server-1', 'server-3']));

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

    await endpoint.handle(buildRequest('server-1'));

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

    await expect(endpoint.handle(buildRequest('server-1'))).rejects.toThrow(BadRequestError);
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

      const result = await endpoint.handle(serverlessRequest());

      expect(mockInstallCertificateHelperService.generateStandaloneFullChain).toHaveBeenCalledWith(
        TENANT_ID,
        expect.anything(),
      );
      // No server-scoped work: no grouping, no per-server generation, no persist, no reload.
      expect(mockInstallCertificateHelperService.groupServersForGeneration).not.toHaveBeenCalled();
      expect(mockInstallCertificateHelperService.generateCertificateChain).not.toHaveBeenCalled();
      expect(mockNetworkConnection.saveWebsocketServersConfig).not.toHaveBeenCalled();
      expect(mockServerNetworkProfileRepository.upsertServerNetworkProfile).not.toHaveBeenCalled();
      expect(mockNetworkConnection.reloadTlsCertificates).not.toHaveBeenCalled();
      // Standalone response: certificates + filePaths, no serverId.
      expect(result).toEqual({ certificates, filePaths });
    });

    it('throws BadRequestError if a non-FullChain scope is requested without a serverId', async () => {
      await expect(endpoint.handle(serverlessRequest({ generationScope: 'Leaf' }))).rejects.toThrow(
        BadRequestError,
      );
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

      const result = await endpoint.handle(serverlessRequest({ generationScope: 'FullChain' }));

      expect(mockInstallCertificateHelperService.generateStandaloneFullChain).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toEqual({ certificates: [{ id: 1 }], filePaths });
    });
  });
});
