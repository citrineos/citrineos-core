import {
  createPemBlock,
  createSignedCertificateFromCSR,
  extractCertificateArrayFromEncodedString,
  extractEncodedContentFromCSR,
  parseCertificateChainPem,
  sendOCSPRequest,
} from '../../src';
import jsrsasign from 'jsrsasign';
import X509 = jsrsasign.X509;
import OCSPRequest = jsrsasign.KJUR.asn1.ocsp.OCSPRequest;
import { faker } from '@faker-js/faker';
import { readFile } from '../utils/FileUtil';

describe('CertificateUtil', () => {
  describe('createSignedCertificateFromCSR', () => {
    it('successes', async () => {
      const givenCSR = readFile('ChargingStationCSRSample.pem');
      const givenIssuerCert = readFile('SubCACertificateSample.pem');
      const givenIssuerKey = readFile('SubCAKeySample.pem');

      const actualResult = createSignedCertificateFromCSR(
        givenCSR,
        givenIssuerCert,
        givenIssuerKey,
      );
      const actualCert = new X509(actualResult.getPEM());

      expect(actualCert.getIssuerString()).toBe('/CN=localhost SubCA/O=s44/C=US');
      expect(actualCert.getSubjectString()).toBe('/C=US/O=Pionix/DC=CPO');
      expect(actualCert.getExtKeyUsage().names).toStrictEqual(['digitalSignature', 'keyAgreement']);
      expect(actualCert.getExtBasicConstraints().critical).toBe(true);
      expect(actualCert.getSignatureAlgorithmName()).toBe('SHA256withECDSA');
    });
  });

  describe('parseCertificateChainPem', () => {
    it('successes', async () => {
      const subCACertPem = readFile('SubCACertificateSample.pem');
      const leafCertPem = readFile('LeafCertificateSample.pem');
      const givenCertChainPem = `${leafCertPem}${subCACertPem}`;

      const actualResult = parseCertificateChainPem(givenCertChainPem);

      expect(actualResult.length).toBe(2);
      expect(actualResult[0]).toBe(leafCertPem.replace(/[\r\n]+$/, ''));
      expect(actualResult[1]).toBe(subCACertPem.replace(/[\r\n]+$/, ''));
    });
  });

  describe('createPemBlock', () => {
    it('successes', async () => {
      const givenContent = 'PemString';
      const givenType = 'CERTIFICATE';

      const actualResult = createPemBlock(givenType, givenContent);

      expect(actualResult).toBe(
        `-----BEGIN CERTIFICATE-----\nPemString\n-----END CERTIFICATE-----\n`,
      );
    });
  });

  describe('extractEncodedContentFromCSR', () => {
    it('successes', async () => {
      const givenCSR = readFile('ChargingStationCSRSample.pem');

      const actualResult = extractEncodedContentFromCSR(givenCSR);

      expect(actualResult).toBe(
        'MIIBGjCBwQIBADAzMQswCQYDVQQGEwJVUzEPMA0GA1UECgwGUGlvbml4MRMwEQYKCZImiZPyLGQBGRYDQ1BPMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE/qHSRETZBPAGnwy+/Inpb5QBcY48FVSxULQt2jORcSzCS4M6Zqk2xDwk/YP/HOQdpY/ypjdQJYtxCSDXRWx8PaAsMCoGCSqGSIb3DQEJDjEdMBswCwYDVR0PBAQDAgOIMAwGA1UdEwEB/wQCMAAwCgYIKoZIzj0EAwIDSAAwRQIhAIZwq/GiP/ANMuFw3neUtnwAU4hSgeYWy2GBwkwySNDrAiBPJplbpKMzgPL1BZmWuQO7tK7bOBPefmdSBbes71dYAw==',
      );
    });
  });

  describe('sendOCSPRequest', () => {
    global.fetch = jest.fn();

    const issuerCertPem = readFile('SubCACertificateSample.pem');
    const subjectCertPem = readFile('LeafCertificateSample.pem');
    const givenRequest = new OCSPRequest({
      reqList: [
        {
          issuerCert: issuerCertPem,
          subjectCert: subjectCertPem,
        },
      ],
    });
    const givenResponderURL = faker.internet.url();

    it('success', async () => {
      const mockResult = faker.lorem.word();
      (fetch as jest.Mock).mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          text: () => mockResult,
        }),
      );

      const actualResult = await sendOCSPRequest(givenRequest, givenResponderURL);

      expect(actualResult).toBe(mockResult);
      const expectedInit: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ocsp-request',
          Accept: 'application/ocsp-response',
        },
        body: givenRequest.getEncodedHex(),
      };
      expect(fetch).toHaveBeenCalledWith(givenResponderURL, expectedInit);
    });

    it('fails due to internal server error', async () => {
      (fetch as jest.Mock).mockReturnValueOnce(
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        }),
      );

      await expect(() => sendOCSPRequest(givenRequest, givenResponderURL)).rejects.toThrow(
        `Failed to fetch OCSP response from ${givenResponderURL}: 500 with error: Internal Server Error`,
      );
    });
  });

  describe('extractCertificateArrayFromEncodedString', () => {
    it('successes', async () => {
      const givenEncodedString = readFile('V2GCACertChainSample.pem');

      const actualResult = extractCertificateArrayFromEncodedString(givenEncodedString);

      expect(actualResult?.length).toBe(3);
    });
  });
});
