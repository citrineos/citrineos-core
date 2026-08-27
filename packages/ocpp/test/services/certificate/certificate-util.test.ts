// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  createOcspRequest,
  createPemBlock,
  createSignedCertificateFromCSR,
  extractCertificateArrayFromEncodedString,
  extractCertificateDetails,
  extractEncodedContentFromCSR,
  parseCertificateChainPem,
  sendOCSPRequest,
} from '@/services/index.js';
import { OCPP2_1 } from '@citrineos/types';
import jsrsasign from 'jsrsasign';
import { faker } from '@faker-js/faker';
import { readFile } from '../../utils/file-util.js';
import { describe, expect, it, Mock, vi } from 'vitest';
import X509 = jsrsasign.X509;
import OCSPRequest = jsrsasign.KJUR.asn1.ocsp.OCSPRequest;

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

      const actualResult = createPemBlock(givenContent);

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

  describe('createOcspRequest', () => {
    const givenOcspRequestData: OCPP2_1.OCSPRequestDataType = {
      hashAlgorithm: OCPP2_1.HashAlgorithmEnumType.SHA256,
      issuerNameHash: 'aa'.repeat(32),
      issuerKeyHash: 'bb'.repeat(32),
      serialNumber: '0102030405',
      responderURL: 'http://ocsp.example.test/responder',
    };

    it('encodes the hash data the station reported', () => {
      const hex = createOcspRequest(givenOcspRequestData).getEncodedHex();

      const parsed = new jsrsasign.KJUR.asn1.ocsp.OCSPParser().getOCSPRequest(hex);
      expect(parsed.array).toEqual([
        {
          alg: 'sha256',
          issname: givenOcspRequestData.issuerNameHash,
          isskey: givenOcspRequestData.issuerKeyHash,
          sbjsn: givenOcspRequestData.serialNumber,
        },
      ]);
    });

    it.each([
      OCPP2_1.HashAlgorithmEnumType.SHA256,
      OCPP2_1.HashAlgorithmEnumType.SHA384,
      OCPP2_1.HashAlgorithmEnumType.SHA512,
    ])('encodes with hash algorithm %s', (hashAlgorithm) => {
      // OCPP spells these upper case; jsrsasign only resolves the lower-case OID names.
      const hex = createOcspRequest({ ...givenOcspRequestData, hashAlgorithm }).getEncodedHex();

      const parsed = new jsrsasign.KJUR.asn1.ocsp.OCSPParser().getOCSPRequest(hex);
      expect(parsed.array[0].alg).toBe(hashAlgorithm.toLowerCase());
    });
  });

  describe('sendOCSPRequest', () => {
    global.fetch = vi.fn();

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
      // RFC 6960 Appendix A.1: the body is the DER of the OCSPRequest and the responder answers
      // with the DER of an OCSPResponse, so neither direction survives a text decode.
      const responderDer = Uint8Array.from([0x30, 0x03, 0x0a, 0x01, 0x00, 0x80, 0x81]);
      (fetch as Mock).mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(responderDer.buffer),
        }),
      );

      const actualResult = await sendOCSPRequest(givenRequest, givenResponderURL);

      expect(actualResult).toBe(Buffer.from(responderDer).toString('hex'));
      const expectedInit: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ocsp-request',
          Accept: 'application/ocsp-response',
        },
        body: Uint8Array.from(Buffer.from(givenRequest.getEncodedHex(), 'hex')),
      };
      expect(fetch).toHaveBeenCalledWith(givenResponderURL, expectedInit);
    });

    it('fails due to internal server error', async () => {
      (fetch as Mock).mockReturnValueOnce(
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

  describe('extractCertificateDetails', () => {
    it('successes', async () => {
      const givenEncodedString = readFile('LeafCertificateSample.pem');
      const {
        serialNumber,
        issuerName,
        organizationName,
        commonName,
        countryName,
        validBefore,
        signatureAlgorithm,
      } = extractCertificateDetails(givenEncodedString);
      expect(serialNumber).toEqual(1916);
      expect(issuerName).toEqual('/CN=localhost SubCA/O=s44/C=US');
      expect(organizationName).toEqual('s44');
      expect(commonName).toEqual('localhost');
      expect(countryName).toEqual('US');
      expect(validBefore).toEqual(new Date('2034-08-19T00:00:00.000Z'));
      expect(signatureAlgorithm).toEqual('SHA256withECDSA');
    });
  });
});
