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
  generateCSR,
  parseCertificateChainPem,
  sendOCSPRequest,
  type CertificateGenerationInput,
} from '@services/index.js';
import { SignatureAlgorithmEnumType } from '@citrineos/dal';
import { OCPP2_1 } from '@citrineos/types';
import jsrsasign from 'jsrsasign';
import { readFile } from '../../helpers/file-util.js';
import { parseOcspRequestHex } from '../../helpers/ocsp-request-parser.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import X509 = jsrsasign.X509;
import KJUR = jsrsasign.KJUR;
import OCSPRequest = jsrsasign.KJUR.asn1.ocsp.OCSPRequest;

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

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

      expect(parseOcspRequestHex(hex)).toEqual([
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
      const hex = createOcspRequest({ ...givenOcspRequestData, hashAlgorithm }).getEncodedHex();

      expect(parseOcspRequestHex(hex)[0].alg).toBe(hashAlgorithm.toLowerCase());
    });
  });

  describe('sendOCSPRequest', () => {
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
    const givenResponderURL = 'https://ocsp.example.com/ocsp';

    beforeEach(() => {
      fetchMock.mockReset();
    });

    it('success', async () => {
      const responderDer = Buffer.from([0x30, 0x03, 0x0a, 0x01, 0x00, 0x80, 0x81]);
      fetchMock.mockResolvedValueOnce(new Response(responderDer, { status: 200 }));

      const actualResult = await sendOCSPRequest(givenRequest, givenResponderURL);

      expect(actualResult).toBe(responderDer.toString('hex'));
      const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
      expect(url.toString()).toBe(givenResponderURL);
      expect(init.redirect).toBe('error');
      expect(init.signal).toBeInstanceOf(AbortSignal);
      expect(Buffer.from(init.body as Uint8Array).toString('hex')).toBe(
        givenRequest.getEncodedHex(),
      );
    });

    it('fails due to internal server error', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }));

      await expect(() => sendOCSPRequest(givenRequest, givenResponderURL)).rejects.toThrow(
        `Failed to fetch OCSP response from ${givenResponderURL}: 500 with error: Internal Server Error`,
      );
    });

    it('refuses a responder host that is not on the configured list', async () => {
      await expect(() =>
        sendOCSPRequest(givenRequest, 'http://169.254.169.254/', ['ocsp.example.com']),
      ).rejects.toThrow(/not permitted/);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('reaches any responder when no hosts are configured', async () => {
      fetchMock.mockResolvedValueOnce(new Response(Buffer.from([0x30]), { status: 200 }));

      await sendOCSPRequest(givenRequest, givenResponderURL, []);

      expect(fetchMock).toHaveBeenCalledOnce();
    });
  });

  describe('extractCertificateArrayFromEncodedString', () => {
    it('successes', async () => {
      const givenEncodedString = readFile('V2GCACertChainSample.pem');

      const actualResult = extractCertificateArrayFromEncodedString(givenEncodedString);

      expect(actualResult?.length).toBe(3);
    });
  });

  describe('generateCSR', () => {
    const csrInput = (
      overrides: Partial<CertificateGenerationInput> = {},
    ): CertificateGenerationInput =>
      ({
        signatureAlgorithm: SignatureAlgorithmEnumType.ECDSA,
        commonName: 'localhost',
        organizationName: 's44',
        countryName: 'US',
        isCA: false,
        ...overrides,
      }) as CertificateGenerationInput;

    it('builds a CSR carrying the requested extensions', () => {
      const [csrPem, privateKeyPem] = generateCSR(csrInput());

      const actualParams = KJUR.asn1.csr.CSRUtil.getParam(csrPem);
      expect(actualParams.subject.str).toBe('/CN=localhost/O=s44/C=US');
      expect(actualParams.sigalg).toBe('SHA256withECDSA');
      expect(actualParams.extreq).toEqual([
        { extname: 'basicConstraints' },
        {
          extname: 'keyUsage',
          names: ['digitalSignature', 'keyEncipherment', 'keyCertSign', 'cRLSign'],
        },
      ]);
      expect(privateKeyPem).toContain('PRIVATE KEY');
    });

    it('requests cA and pathLen for a sub CA', () => {
      const [csrPem] = generateCSR(csrInput({ isCA: true, pathLen: 1 }));

      const actualParams = KJUR.asn1.csr.CSRUtil.getParam(csrPem);
      expect(actualParams.extreq?.[0]).toEqual({
        extname: 'basicConstraints',
        cA: true,
        pathLen: 1,
      });
    });

    it('requests pathLen 0 for a sub CA that must not issue further CAs', () => {
      const [csrPem] = generateCSR(csrInput({ isCA: true, pathLen: 0 }));

      const actualParams = KJUR.asn1.csr.CSRUtil.getParam(csrPem);

      expect(actualParams.extreq?.[0]).toEqual({
        extname: 'basicConstraints',
        cA: true,
        pathLen: 0,
      });
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
      expect(serialNumber).toEqual(0x1916c392dce);
      expect(issuerName).toEqual('/CN=localhost SubCA/O=s44/C=US');
      expect(organizationName).toEqual('s44');
      expect(commonName).toEqual('localhost');
      expect(countryName).toEqual('US');
      expect(validBefore).toEqual(new Date('2034-08-19T00:00:00.000Z'));
      expect(signatureAlgorithm).toEqual('SHA256withECDSA');
    });

    it('reads the serial of a certificate the CSMS signed as its full hex value', () => {
      const signedAt = new Date('2028-03-01T00:00:00.000Z');
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(signedAt);
      let givenCertPem: string;
      try {
        givenCertPem = createSignedCertificateFromCSR(
          readFile('ChargingStationCSRSample.pem'),
          readFile('SubCACertificateSample.pem'),
          readFile('SubCAKeySample.pem'),
        ).getPEM();
      } finally {
        vi.useRealTimers();
      }

      const { serialNumber } = extractCertificateDetails(givenCertPem);

      expect(serialNumber).toBe(signedAt.getTime());
    });

    it.each([
      ['00c5', 0xc5],
      ['00c5a1b2c3d4e5f60718293a4b5c6d7e', null],
    ])('reads serial %s as %s', (serialHex, expectedSerialNumber) => {
      const { prvKeyObj, pubKeyObj } = jsrsasign.KEYUTIL.generateKeypair('EC', 'secp256r1');
      const givenCertPem = new jsrsasign.KJUR.asn1.x509.Certificate({
        version: 3,
        serial: { hex: serialHex },
        issuer: { str: '/CN=Serial Test' },
        subject: { str: '/CN=Serial Test' },
        notbefore: '250101000000Z',
        notafter: '350101000000Z',
        sbjpubkey: pubKeyObj,
        ext: [{ extname: 'basicConstraints', cA: true }],
        sigalg: 'SHA256withECDSA',
        cakey: prvKeyObj,
      }).getPEM();

      const { serialNumber } = extractCertificateDetails(givenCertPem);

      expect(serialNumber).toBe(expectedSerialNumber);
    });
  });
});
