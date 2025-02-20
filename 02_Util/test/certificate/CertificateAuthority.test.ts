import {
  IChargingStationCertificateAuthorityClient,
  IV2GCertificateAuthorityClient,
} from '../../src/certificate/client/interface';
import { OCPP2_0_1, SystemConfig } from '@citrineos/base';
import { CertificateAuthorityService } from '../../src';
import {
  aValidCertificateItemArray,
  aValidSignedCertificateWithOCSPInfo,
} from '../providers/CertificateAuthority';
import { faker } from '@faker-js/faker';
import * as CertificateUtil from '../../src/certificate/CertificateUtil';
import { readFile } from '../utils/FileUtil';
import { KJUR } from 'jsrsasign';

jest.mock('../../src/certificate/CertificateUtil');
jest.spyOn(KJUR.asn1.ocsp.OCSPUtil, 'getOCSPResponseInfo').mockImplementation(() => {
  // Provide a mock implementation
  return {
    certStatus: 'good',
    responseStatus: 0,
    thisUpdate: new Date().toISOString(),
    nextUpdate: new Date(Date.now() + 3600 * 1000).toISOString(),
  };
});

describe('CertificateAuthorityService', () => {
  let mockV2GClient: jest.Mocked<IV2GCertificateAuthorityClient>;
  let mockChargingStationClient: jest.Mocked<IChargingStationCertificateAuthorityClient>;
  let mockSystemConfig: jest.Mocked<SystemConfig>;
  let mockCertUtil: jest.Mocked<typeof CertificateUtil>;
  let certificateAuthorityService: CertificateAuthorityService;

  beforeAll(() => {
    mockSystemConfig = {} as unknown as jest.Mocked<SystemConfig>;

    mockV2GClient = {
      getSignedCertificate: jest.fn(),
      getCACertificates: jest.fn(),
      getRootCertificates: jest.fn(),
    } as unknown as jest.Mocked<IV2GCertificateAuthorityClient>;

    mockChargingStationClient = {
      getRootCACertificate: jest.fn(),
      getCertificateChain: jest.fn(),
    } as unknown as jest.Mocked<IChargingStationCertificateAuthorityClient>;

    mockCertUtil = CertificateUtil as jest.Mocked<typeof CertificateUtil>;

    certificateAuthorityService = new CertificateAuthorityService(
      mockSystemConfig,
      undefined,
      mockChargingStationClient,
      mockV2GClient,
    );
  });

  describe('getCertificateChain', () => {
    it('successes to get V2G certificate chain', async () => {
      // we need to provide valid certificates samples
      // since in the source code it tries to parse and encoding these certificates
      const mockSignedCert = readFile('V2GLeafCertificateSample.pem');
      mockV2GClient.getSignedCertificate.mockReturnValue(Promise.resolve(mockSignedCert));
      const mockCACerts = readFile('V2GCACertChainSample.pem');
      mockV2GClient.getCACertificates.mockReturnValue(Promise.resolve(mockCACerts));
      const mockEncodedCSRString = faker.lorem.word();
      mockCertUtil.extractEncodedContentFromCSR.mockReturnValue(mockEncodedCSRString);
      mockCertUtil.extractCertificateArrayFromEncodedString.mockReturnValueOnce(
        aValidCertificateItemArray(mockSignedCert),
      );
      mockCertUtil.extractCertificateArrayFromEncodedString.mockReturnValueOnce(
        aValidCertificateItemArray(mockCACerts),
      );
      const mockLeafPem = faker.lorem.word();
      const mockSubCA2Pem = faker.lorem.word();
      const mockSubCA1Pem = faker.lorem.word();
      mockCertUtil.createPemBlock.mockReturnValueOnce(mockLeafPem);
      mockCertUtil.createPemBlock.mockReturnValueOnce(mockSubCA2Pem);
      mockCertUtil.createPemBlock.mockReturnValueOnce(mockSubCA1Pem);

      const givenCSR = faker.lorem.word();
      const givenStationId = faker.lorem.word();
      const actualResult = await certificateAuthorityService.getCertificateChain(
        givenCSR,
        givenStationId,
        OCPP2_0_1.CertificateSigningUseEnumType.V2GCertificate,
      );

      expect(mockCertUtil.extractEncodedContentFromCSR).toHaveBeenCalledWith(givenCSR);
      expect(mockV2GClient.getSignedCertificate).toHaveBeenCalledWith(mockEncodedCSRString);
      expect(mockV2GClient.getCACertificates).toHaveBeenCalled();
      expect(mockCertUtil.createPemBlock).toHaveBeenCalledTimes(3);
      expect(actualResult).toBe(`${mockLeafPem}${mockSubCA2Pem}${mockSubCA1Pem}`);
    });

    it('successes to get charging station certificate chain', async () => {
      const mockChargingStationCertChain = faker.lorem.word();
      mockChargingStationClient.getCertificateChain.mockReturnValue(
        Promise.resolve(mockChargingStationCertChain),
      );

      const givenCSR = faker.lorem.word();
      const givenStationId = faker.lorem.word();
      const actualResult = await certificateAuthorityService.getCertificateChain(
        givenCSR,
        givenStationId,
        OCPP2_0_1.CertificateSigningUseEnumType.ChargingStationCertificate,
      );

      expect(mockChargingStationClient.getCertificateChain).toHaveBeenCalledWith(givenCSR);
      expect(actualResult).toBe(mockChargingStationCertChain);
    });
  });

  describe('getRootCACertificateFromExternalCA', () => {
    it('successes to get V2G root certificate from external CA', async () => {
      const mockCACerts = readFile('V2GCACertChainSample.pem');
      mockV2GClient.getCACertificates.mockReturnValue(Promise.resolve(mockCACerts));
      mockCertUtil.extractCertificateArrayFromEncodedString.mockReturnValueOnce(
        aValidCertificateItemArray(mockCACerts),
      );
      const mockPem = faker.lorem.word();
      mockCertUtil.createPemBlock.mockReturnValue(mockPem);

      const actualResult = await certificateAuthorityService.getRootCACertificateFromExternalCA(
        OCPP2_0_1.InstallCertificateUseEnumType.V2GRootCertificate,
      );

      expect(mockV2GClient.getCACertificates).toHaveBeenCalled();
      expect(mockCertUtil.extractCertificateArrayFromEncodedString).toHaveBeenCalledWith(
        mockCACerts,
      );
      expect(mockCertUtil.createPemBlock).toHaveBeenCalled();
      expect(actualResult).toBe(mockPem);
    });

    it('successes to get charging station root certificate from external CA', async () => {
      const mockPem = faker.lorem.word();
      mockChargingStationClient.getRootCACertificate.mockReturnValue(Promise.resolve(mockPem));

      const actualResult = await certificateAuthorityService.getRootCACertificateFromExternalCA(
        OCPP2_0_1.InstallCertificateUseEnumType.CSMSRootCertificate,
      );

      expect(mockChargingStationClient.getRootCACertificate).toHaveBeenCalled();
      expect(actualResult).toBe(mockPem);
    });
  });

  describe('validateCertificateChainPem', () => {
    it('successes', async () => {
      // since this validateCertificateChainPem checks whether the issuer and subject certificate match and
      // the ocsp responder URL exists, we need to mock a valid certificate
      const mockOCSPURL = faker.internet.url();
      const mockIssuerCert = readFile('RootCertificateSample.pem');
      const mockIssuerKey = readFile('RootKeySample.pem');
      const mockLeafCert = aValidSignedCertificateWithOCSPInfo(
        mockOCSPURL,
        mockIssuerCert,
        mockIssuerKey,
      ).getPEM();
      mockCertUtil.parseCertificateChainPem.mockReturnValue([mockLeafCert]);
      mockV2GClient.getRootCertificates.mockReturnValueOnce(Promise.resolve([mockIssuerCert]));
      const mockOCSPResponse = faker.lorem.word();
      mockCertUtil.sendOCSPRequest.mockReturnValue(Promise.resolve(mockOCSPResponse));

      const givenCertChainPem = faker.lorem.word();
      const result =
        await certificateAuthorityService.validateCertificateChainPem(givenCertChainPem);

      expect(result).toBe(OCPP2_0_1.AuthorizeCertificateStatusEnumType.Accepted);
      expect(mockCertUtil.parseCertificateChainPem).toHaveBeenCalledWith(givenCertChainPem);
      expect(mockV2GClient.getRootCertificates).toHaveBeenCalled();
      expect(mockCertUtil.sendOCSPRequest).toHaveBeenCalledWith(
        expect.any(KJUR.asn1.ocsp.OCSPRequest),
        mockOCSPURL,
      );
      expect(KJUR.asn1.ocsp.OCSPUtil.getOCSPResponseInfo).toHaveBeenCalledWith(mockOCSPResponse);
    });

    it('fails when no OCSP responder URL in certificate', async () => {
      const mockSubCACert = readFile('SubCACertificateSample.pem');
      mockCertUtil.parseCertificateChainPem.mockReturnValue([mockSubCACert]);
      const mockRootCert = readFile('RootCertificateSample.pem');
      mockV2GClient.getRootCertificates.mockReturnValueOnce(Promise.resolve([mockRootCert]));

      const actualResult = await certificateAuthorityService.validateCertificateChainPem(
        faker.lorem.word(),
      );

      expect(actualResult).toBe(OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertChainError);
    });

    it('fails when found 0 certificates in chain', async () => {
      const result = await certificateAuthorityService.validateCertificateChainPem(
        faker.lorem.sentence(),
      );
      expect(result).toBe(OCPP2_0_1.AuthorizeCertificateStatusEnumType.NoCertificateAvailable);
    });

    it('fails when no root certificates match', async () => {
      (mockV2GClient.getRootCertificates as jest.Mock).mockReturnValueOnce([]);
      const result = await certificateAuthorityService.validateCertificateChainPem(
        readFile('SubCACertificateSample.pem'), //aInvalidCertificateChainWithoutRoot(),
      );
      expect(result).toBe(OCPP2_0_1.AuthorizeCertificateStatusEnumType.NoCertificateAvailable);
    });
  });

  describe('validateCertificateHashData', () => {
    it('successes', async () => {
      const mockOCSPResponse = faker.lorem.word();
      mockCertUtil.sendOCSPRequest.mockReturnValue(Promise.resolve(mockOCSPResponse));

      const givenResponderURL = faker.internet.url();
      const givenOCSPRequest = {
        hashAlgorithm: OCPP2_0_1.HashAlgorithmEnumType.SHA256,
        issuerNameHash: faker.lorem.word(),
        issuerKeyHash: faker.lorem.word(),
        serialNumber: faker.lorem.word(),
        responderURL: givenResponderURL,
      } as OCPP2_0_1.OCSPRequestDataType;
      const actualResult = await certificateAuthorityService.validateCertificateHashData([
        givenOCSPRequest,
      ]);

      expect(mockCertUtil.sendOCSPRequest).toHaveBeenCalledWith(
        expect.any(KJUR.asn1.ocsp.Request),
        givenResponderURL,
      );
      expect(KJUR.asn1.ocsp.OCSPUtil.getOCSPResponseInfo).toHaveBeenCalledWith(mockOCSPResponse);
      expect(actualResult).toBe(OCPP2_0_1.AuthorizeCertificateStatusEnumType.Accepted);
    });
  });
});
