// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ConfigLoader, type IFileStorage } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import { faker } from '@faker-js/faker';
import * as CertificateUtil from '@util/certificate/CertificateUtil.js';
import { Acme } from '@util/certificate/client/acme.js';
import { Client } from 'acme-client';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { beforeAll, beforeEach, describe, expect, it, Mock, Mocked, vi } from 'vitest';
import { aValidSignedCertificate } from '../../providers/ACME.js';

vi.mock('@util/certificate/CertificateUtil');

describe('ACME', () => {
  const mockTlsCertificateChain = faker.lorem.word();
  const mockMtlsCertificateAuthorityKey = faker.lorem.word();
  const mockLeafPem = faker.lorem.word();
  const mockSubCAPem = faker.lorem.word();
  let mockCertUtil: Mocked<typeof CertificateUtil>;
  let mockClient: Mocked<Client>;
  let mockFileStorage: IFileStorage;

  let systemConfig: SystemConfig;
  const logger: Logger<ILogObj> | undefined = undefined;
  let acme: Acme;

  beforeAll(async () => {
    global.fetch = vi.fn();
    mockCertUtil = CertificateUtil as Mocked<typeof CertificateUtil>;
    // No mtlsCertificateAuthorityCertificateFilePath on this server, so create()
    // falls back to the second entry of the tls certificate chain.
    mockCertUtil.parseCertificateChainPem.mockReturnValue([mockLeafPem, mockSubCAPem]);

    const websocketServersConfigFile = 'websocket-servers.json';
    const websocketServers = [
      {
        id: '3',
        host: '0.0.0.0',
        port: 8444,
        pingInterval: 60,
        protocols: ['ocpp2.0.1'],
        securityProfile: 3,
        allowUnknownChargingStations: false,
        dynamicTenantResolution: false,
        tenantId: 1,
        tlsKeyFilePath: faker.lorem.word(),
        tlsCertificateChainFilePath: faker.lorem.word(),
        mtlsCertificateAuthorityKeyFilePath: faker.lorem.word(),
      },
    ];

    mockFileStorage = {
      saveFile: vi.fn().mockResolvedValue(undefined),
      getFile: vi
        .fn()
        .mockResolvedValueOnce(JSON.stringify(websocketServers))
        .mockResolvedValueOnce(mockTlsCertificateChain)
        .mockResolvedValueOnce(mockMtlsCertificateAuthorityKey)
        .mockResolvedValueOnce(faker.lorem.word()),
      exists: vi.fn().mockResolvedValue(true),
      createDirectory: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    } as unknown as IFileStorage;

    systemConfig = {
      websocketServerConfigFile: websocketServersConfigFile,
      integrations: {
        chargingStationCA: {
          name: 'acme',
          acme: {
            env: 'staging',
            accountKeyFilePath: faker.lorem.word(),
            email: 'test@citrineos.com',
          },
        },
      },
    } as any;
    mockClient = {} as unknown as Mocked<Client>;
    acme = await Acme.create(systemConfig, mockFileStorage, logger, mockClient);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCertificateChain', () => {
    it('signs against the sub CA cert derived from the tls certificate chain', async () => {
      // The chain is parsed once in create(); by the time a CSR arrives the map
      // already holds the sub CA certificate itself.
      const mockCertificate = aValidSignedCertificate();
      mockCertUtil.createSignedCertificateFromCSR.mockReturnValueOnce(mockCertificate);

      const givenCSR = faker.lorem.word();
      const actualResult = await acme.getCertificateChain(givenCSR);

      const expectedResult = mockCertificate.getPEM().replace(/\n+$/, '') + '\n' + mockSubCAPem;
      expect(actualResult).toBe(expectedResult);
      expect(mockCertUtil.createSignedCertificateFromCSR).toHaveBeenCalledWith(
        givenCSR,
        mockSubCAPem,
        mockMtlsCertificateAuthorityKey,
      );
    });

    it('signs against mtlsCertificateAuthorityCertificateFilePath when set, ignoring the tls chain', async () => {
      // The case the fallback gets wrong: the CSMS's own TLS chain is issued by
      // a public CA, so its second entry is that CA -- not the sub CA that must
      // appear as the issuer of a charging station certificate.
      const dedicatedSubCAPem = faker.lorem.word();
      const dedicatedMtlsKey = faker.lorem.word();
      const dedicatedServers = [
        {
          id: '3',
          host: '0.0.0.0',
          port: 8444,
          pingInterval: 60,
          protocols: ['ocpp2.0.1'],
          securityProfile: 3,
          allowUnknownChargingStations: false,
          dynamicTenantResolution: false,
          tenantId: 1,
          tlsKeyFilePath: faker.lorem.word(),
          tlsCertificateChainFilePath: faker.lorem.word(),
          mtlsCertificateAuthorityKeyFilePath: faker.lorem.word(),
          mtlsCertificateAuthorityCertificateFilePath: faker.lorem.word(),
        },
      ];
      const dedicatedFileStorage = {
        saveFile: vi.fn().mockResolvedValue(undefined),
        getFile: vi
          .fn()
          .mockResolvedValueOnce(JSON.stringify(dedicatedServers))
          .mockResolvedValueOnce(dedicatedSubCAPem)
          .mockResolvedValueOnce(dedicatedMtlsKey)
          .mockResolvedValueOnce(faker.lorem.word()),
        exists: vi.fn().mockResolvedValue(true),
        createDirectory: vi.fn().mockResolvedValue(undefined),
        deleteFile: vi.fn().mockResolvedValue(undefined),
      } as unknown as IFileStorage;

      // loadWebsocketServersConfig caches the parsed servers on a static, so a
      // second create() would otherwise reuse the ones from beforeAll.
      (ConfigLoader as unknown as { websocketServers: unknown }).websocketServers = undefined;

      const dedicatedAcme = await Acme.create(
        systemConfig,
        dedicatedFileStorage,
        logger,
        mockClient,
      );

      const mockCertificate = aValidSignedCertificate();
      mockCertUtil.createSignedCertificateFromCSR.mockReturnValueOnce(mockCertificate);
      const givenCSR = faker.lorem.word();

      const actualResult = await dedicatedAcme.getCertificateChain(givenCSR);

      expect(actualResult).toBe(
        mockCertificate.getPEM().replace(/\n+$/, '') + '\n' + dedicatedSubCAPem,
      );
      expect(mockCertUtil.createSignedCertificateFromCSR).toHaveBeenCalledWith(
        givenCSR,
        dedicatedSubCAPem,
        dedicatedMtlsKey,
      );
      // The tls chain is never read when a dedicated sub CA certificate is set.
      expect(mockCertUtil.parseCertificateChainPem).not.toHaveBeenCalled();
    });
  });

  describe('signCertificateByExternalCA', () => {
    const folderPath =
      '/usr/local/apps/citrineos/apps/ocpp-server/src/assets/.well-known/acme-challenge';

    it('creates directory, saves challenge file, and removes on cleanup when directory does not exist', async () => {
      const mockCert = faker.lorem.word();
      const mockToken = faker.lorem.word();
      const mockKeyAuth = faker.lorem.word();
      const mockAuthz = { identifier: { value: faker.internet.domainName() } };

      (mockFileStorage.exists as Mock).mockResolvedValueOnce(false);
      (mockClient as any).auto = vi.fn().mockImplementation(async (options: any) => {
        await options.challengeCreateFn(mockAuthz, { token: mockToken }, mockKeyAuth);
        await options.challengeRemoveFn({}, {}, '');
        return mockCert;
      });

      const givenCSR = faker.lorem.word();
      const actualResult = await acme.signCertificateByExternalCA(givenCSR);

      expect(actualResult).toBe(mockCert);
      expect(mockFileStorage.exists).toHaveBeenCalledWith(folderPath, undefined, { trusted: true });
      expect(mockFileStorage.createDirectory).toHaveBeenCalledWith(folderPath, undefined, {
        recursive: true,
        trusted: true,
      });
      expect(mockFileStorage.saveFile).toHaveBeenCalledWith(
        `${folderPath}/${mockToken}`,
        Buffer.from(mockKeyAuth),
        undefined,
        { trusted: true },
      );
      expect(mockFileStorage.deleteFile).toHaveBeenCalledWith(folderPath, undefined, {
        recursive: true,
        force: true,
        trusted: true,
      });
    });

    it('skips directory creation when directory already exists', async () => {
      const mockCert = faker.lorem.word();
      const mockToken = faker.lorem.word();
      const mockKeyAuth = faker.lorem.word();

      (mockFileStorage.exists as Mock).mockResolvedValueOnce(true);
      (mockClient as any).auto = vi.fn().mockImplementation(async (options: any) => {
        await options.challengeCreateFn(
          { identifier: { value: faker.internet.domainName() } },
          { token: mockToken },
          mockKeyAuth,
        );
        await options.challengeRemoveFn({}, {}, '');
        return mockCert;
      });

      const givenCSR = faker.lorem.word();
      const actualResult = await acme.signCertificateByExternalCA(givenCSR);

      expect(actualResult).toBe(mockCert);
      expect(mockFileStorage.exists).toHaveBeenCalledWith(folderPath, undefined, { trusted: true });
      expect(mockFileStorage.createDirectory).not.toHaveBeenCalled();
      expect(mockFileStorage.deleteFile).toHaveBeenCalledWith(folderPath, undefined, {
        recursive: true,
        force: true,
        trusted: true,
      });
    });

    it('throws when client returns no certificate', async () => {
      (mockClient as any).auto = vi.fn().mockResolvedValue(undefined);

      await expect(acme.signCertificateByExternalCA(faker.lorem.word())).rejects.toThrow(
        'Failed to get signed certificate',
      );
    });
  });

  describe('getRootCACertificate', () => {
    it('success', async () => {
      const mockResult = faker.lorem.word();
      (fetch as Mock).mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          text: () => mockResult,
        }),
      );

      const actualResult = await acme.getRootCACertificate();
      expect(actualResult).toBe(mockResult);

      const expectedUrl = 'https://letsencrypt.org/certs/isrgrootx1.pem';
      expect(fetch).toHaveBeenCalledWith(expectedUrl);
    });

    it('fails due to internal server error', async () => {
      (fetch as Mock).mockReturnValueOnce(
        Promise.resolve({
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        }),
      );

      await expect(() => acme.getRootCACertificate()).rejects.toThrow(
        'Failed to fetch certificate: 500: Internal Server Error',
      );
    });
  });
});
