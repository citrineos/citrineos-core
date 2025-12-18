// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'fs';
import { SystemConfig } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { faker } from '@faker-js/faker';
import { Acme } from '../../../src/certificate/client/acme.js';
import { aValidSignedCertificate } from '../../providers/ACME.js';
import * as CertificateUtil from '../../../src/certificate/CertificateUtil.js';
import { Client } from 'acme-client';
import { beforeAll, describe, expect, it, Mock, Mocked, vi } from 'vitest';

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  const fakeReadFileSync = vi.fn(() => 'fake cert contents');

  return {
    ...actual,
    default: {
      ...actual,
      readFileSync: fakeReadFileSync, // for `import fs from 'fs'`
    },
    readFileSync: fakeReadFileSync, // for `import { readFileSync } from 'fs'`
  };
});
vi.mock('../../../src/certificate/CertificateUtil');

describe('ACME', () => {
  const mockTlsCertificateChain = faker.lorem.word();
  const mockMtlsCertificateAuthorityKey = faker.lorem.word();
  let mockCertUtil: Mocked<typeof CertificateUtil>;
  let mockClient: Mocked<Client>;

  let systemConfig: SystemConfig;
  const logger: Logger<ILogObj> | undefined = undefined;
  let acme: Acme;

  beforeAll(() => {
    global.fetch = vi.fn();
    (readFileSync as Mock)
      .mockReturnValueOnce(mockTlsCertificateChain)
      .mockReturnValueOnce(mockMtlsCertificateAuthorityKey)
      .mockReturnValueOnce(faker.lorem.word());
    mockCertUtil = CertificateUtil as Mocked<typeof CertificateUtil>;

    systemConfig = {
      util: {
        networkConnection: {
          websocketServers: [
            {
              id: '3',
              securityProfile: 3,
              tlsCertificateChainFilePath: faker.lorem.word(),
              mtlsCertificateAuthorityKeyFilePath: faker.lorem.word(),
            },
          ],
        },
        certificateAuthority: {
          chargingStationCA: {
            name: 'acme',
            acme: {
              env: 'staging',
              accountKeyFilePath: faker.lorem.word(),
            },
          },
        },
      },
    } as any;
    mockClient = {} as unknown as Mocked<Client>;
    acme = new Acme(systemConfig, logger, mockClient);
  });

  describe('getCertificateChain', () => {
    it('successes', async () => {
      const mockLeafPem = faker.lorem.word();
      const mockSubCAPem = faker.lorem.word();
      const mockCertificate = aValidSignedCertificate();
      mockCertUtil.parseCertificateChainPem.mockReturnValueOnce([mockLeafPem, mockSubCAPem]);
      mockCertUtil.createSignedCertificateFromCSR.mockReturnValueOnce(mockCertificate);

      const givenCSR = faker.lorem.word();
      const actualResult = await acme.getCertificateChain(givenCSR);

      const expectedResult = mockCertificate.getPEM().replace(/\n+$/, '') + '\n' + mockSubCAPem;
      expect(actualResult).toBe(expectedResult);
      expect(mockCertUtil.parseCertificateChainPem).toHaveBeenCalledWith(mockTlsCertificateChain);
      expect(mockCertUtil.createSignedCertificateFromCSR).toHaveBeenCalledWith(
        givenCSR,
        mockSubCAPem,
        mockMtlsCertificateAuthorityKey,
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
