import { readFileSync } from 'fs';
import { SystemConfig } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { faker } from '@faker-js/faker';
import { Acme } from '../../../src/certificate/client/acme';
import { aValidSignedCertificate } from '../../providers/ACME';
import * as CertificateUtil from '../../../src/certificate/CertificateUtil';
import { Client } from 'acme-client';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));
jest.mock('../../../src/certificate/CertificateUtil');

describe('ACME', () => {
  const mockTlsCertificateChain = faker.lorem.word();
  const mockMtlsCertificateAuthorityKey = faker.lorem.word();
  let mockCertUtil: jest.Mocked<typeof CertificateUtil>;
  let mockClient: jest.Mocked<Client>;

  let systemConfig: SystemConfig;
  const logger: Logger<ILogObj> | undefined = undefined;
  let acme: Acme;

  beforeAll(() => {
    global.fetch = jest.fn();
    (readFileSync as jest.Mock)
      .mockReturnValueOnce(mockTlsCertificateChain)
      .mockReturnValueOnce(mockMtlsCertificateAuthorityKey)
      .mockReturnValueOnce(faker.lorem.word());
    mockCertUtil = CertificateUtil as jest.Mocked<typeof CertificateUtil>;

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
    mockClient = {} as unknown as jest.Mocked<Client>;
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
      (fetch as jest.Mock).mockReturnValueOnce(
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
      (fetch as jest.Mock).mockReturnValueOnce(
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
