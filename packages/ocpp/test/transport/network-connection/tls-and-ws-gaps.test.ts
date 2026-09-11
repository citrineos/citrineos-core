// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path from 'path';
import { CacheNamespace, type IFileStorage } from '@citrineos/base';
import { SignatureAlgorithmEnumType } from '@citrineos/dal';
import type { SystemConfig, WebsocketServerConfig } from '@citrineos/types';
import jsrsasign from 'jsrsasign';
import moment from 'moment';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Secret scanners flag literal PEM delimiters, so the markers are assembled.
const PEM_DASHES = '-'.repeat(5);
const pemMarker = (label: string, edge: 'BEGIN' | 'END') =>
  `${PEM_DASHES}${edge} ${label}${PEM_DASHES}`;
const pemBlock = (label: string, body: string) =>
  `${pemMarker(label, 'BEGIN')}\n${body}\n${pemMarker(label, 'END')}`;

import { WebSocket } from 'ws';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import {
  createOcspRequest,
  createSignedCertificateFromCSR,
  extractCertificateArrayFromEncodedString,
  extractCertificateDetails,
  generateCertificate,
  getValidityTimeString,
  isSignedBy,
  parseCertificateChainPem,
  parseCSRForVerification,
  parseX509Date,
  type CertificateGenerationInput,
} from '@services/index.js';
import { TlsCredentialManager } from '@/transport/network-connection/tls-certificate-manager.js';
import {
  getClientIdFromUrl,
  WebsocketNetworkConnection,
} from '@/transport/network-connection/websocket-network-connection.js';
import { readFile } from '../../utils/file-util.js';
import KJUR = jsrsasign.KJUR;
import KEYUTIL = jsrsasign.KEYUTIL;
import X509 = jsrsasign.X509;

const resourcePath = (fileName: string) => path.resolve(__dirname, `../../resources/${fileName}`);

/** OCSPParser ships in jsrsasign but is missing from @types/jsrsasign. */
type OcspCertIdParams = { alg: string; issname: string; isskey: string; sbjsn: string };
const OcspParser = (
  KJUR.asn1.ocsp as unknown as {
    OCSPParser: new () => { getRequest(hex: string): OcspCertIdParams };
  }
).OCSPParser;

describe('CertificateUtil gaps', () => {
  const { logger } = createTestContainer();

  const subCACertPem = readFile('SubCACertificateSample.pem');
  const subCAKeyPem = readFile('SubCAKeySample.pem');
  const rootCertPem = readFile('RootCertificateSample.pem');
  const leafCertPem = readFile('LeafCertificateSample.pem');

  describe('getValidityTimeString', () => {
    it('formats dates before 2050 as UTCTime with 2-digit year', () => {
      expect(getValidityTimeString(moment.utc('2049-12-31T23:59:59Z'))).toBe('491231235959Z');
    });

    it('formats dates from 2050 on as GeneralizedTime with 4-digit year', () => {
      expect(getValidityTimeString(moment.utc('2050-01-01T00:00:00Z'))).toBe('20500101000000Z');
    });
  });

  describe('parseX509Date', () => {
    it('parses GeneralizedTime', () => {
      expect(parseX509Date('20550304050607Z')).toEqual(new Date('2055-03-04T05:06:07.000Z'));
    });

    it('parses UTCTime', () => {
      expect(parseX509Date('340819000000Z')).toEqual(new Date('2034-08-19T00:00:00.000Z'));
    });

    it('returns null and logs for an unrecognized format', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(parseX509Date('26-08-19')).toBeNull();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('Invalid X.509 date format: 26-08-19');
      errorSpy.mockRestore();
    });
  });

  describe('parseCertificateChainPem incomplete input', () => {
    it('drops a trailing block that has no end marker', () => {
      const dangling = `${leafCertPem}${pemMarker('CERTIFICATE', 'BEGIN')}\nMIIB`;

      const actualResult = parseCertificateChainPem(dangling);

      expect(actualResult.length).toBe(1);
      expect(actualResult[0]).toBe(leafCertPem.replace(/[\r\n]+$/, ''));
    });

    it('returns an empty array when no markers are present', () => {
      expect(parseCertificateChainPem('no pem here')).toEqual([]);
    });
  });

  describe('isSignedBy', () => {
    it('accepts the actual issuer', () => {
      expect(isSignedBy(leafCertPem, subCACertPem)).toBe(true);
    });

    it('rejects a certificate from another CA', () => {
      expect(isSignedBy(leafCertPem, rootCertPem)).toBe(false);
    });

    it('returns false for unparsable input', () => {
      expect(isSignedBy('not a cert', subCACertPem)).toBe(false);
    });
  });

  describe('extractCertificateArrayFromEncodedString invalid input', () => {
    it('throws when the decoded content is not CMS SignedData', () => {
      expect(() => extractCertificateArrayFromEncodedString('aGVsbG8=')).toThrow(
        /^Failed to extract certificate aGVsbG8= due to /,
      );
    });
  });

  describe('extractCertificateDetails invalid input', () => {
    it('throws for a non-PEM string', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => extractCertificateDetails('garbage')).toThrow(
        'Invalid PEM format or unsupported certificate',
      );

      expect(errorSpy).toHaveBeenCalledTimes(1);
      errorSpy.mockRestore();
    });
  });

  describe('parseCSRForVerification', () => {
    it('parses the sample CSR subject attributes', () => {
      const csrPem = readFile('ChargingStationCSRSample.pem');

      const actualResult = parseCSRForVerification(csrPem);

      // C=US, O=Pionix, DC=CPO
      expect(actualResult.subject.typesAndValues.map((tv) => tv.type)).toEqual([
        '2.5.4.6',
        '2.5.4.10',
        '0.9.2342.19200300.100.1.25',
      ]);
    });

    it('throws when the base64 body is not BER', () => {
      const bogusCsr = pemBlock('CERTIFICATE REQUEST', 'aGVsbG8=');

      expect(() => parseCSRForVerification(bogusCsr)).toThrow(
        'Failed to parse CSR: invalid ASN.1 BER encoding',
      );
    });
  });

  describe('createOcspRequest', () => {
    it('encodes CertID from precomputed hashes', () => {
      const actualResult = createOcspRequest({
        hashAlgorithm: 'SHA1',
        issuerNameHash: 'aabb',
        issuerKeyHash: 'ccdd',
        serialNumber: '1f2e',
      });

      expect(actualResult.getEncodedHex()).toBe(
        ['30193017300906052b0e03021a0500', '0402aabb', '0402ccdd', '02021f2e'].join(''),
      );
    });

    it('lowercases the hash algorithm', () => {
      const actualResult = createOcspRequest({
        hashAlgorithm: 'SHA1',
        issuerNameHash: 'aabb',
        issuerKeyHash: 'ccdd',
        serialNumber: '1f2e',
      });

      const parsed = new OcspParser().getRequest(actualResult.getEncodedHex());
      expect(parsed).toEqual({ alg: 'sha1', issname: 'aabb', isskey: 'ccdd', sbjsn: '1f2e' });
    });
  });

  describe('generateCertificate', () => {
    it('generates a self-signed EC CA certificate with pathLen', () => {
      const input: CertificateGenerationInput = {
        signatureAlgorithm: SignatureAlgorithmEnumType.ECDSA,
        commonName: 'Test Root',
        organizationName: 'S44',
        countryName: 'US',
        isCA: true,
        pathLen: 2,
        validBefore: '2027-03-05T06:07:08.000Z',
      } as CertificateGenerationInput;

      const [certPem, keyPem] = generateCertificate(input, logger);

      const cert = new X509();
      cert.readCertPEM(certPem);
      expect(cert.getSubjectString()).toBe('/CN=Test Root/O=S44/C=US');
      expect(cert.getIssuerString()).toBe('/CN=Test Root/O=S44/C=US');
      expect(cert.getSignatureAlgorithmName()).toBe('SHA256withECDSA');
      expect(cert.getNotAfter()).toBe('270305060708Z');
      expect(cert.getExtBasicConstraints()).toEqual({
        extname: 'basicConstraints',
        cA: true,
        pathLen: 2,
      });
      // isCA branch: keyEncipherment must not be granted to a CA
      expect(cert.getExtKeyUsage().names).not.toContain('keyEncipherment');
      expect(keyPem).toContain(pemMarker('PRIVATE KEY', 'BEGIN'));
      expect(isSignedBy(certPem, certPem)).toBe(true);
    });

    it('caps validity at the issuer notAfter and chains to the issuer', () => {
      const input: CertificateGenerationInput = {
        signatureAlgorithm: SignatureAlgorithmEnumType.ECDSA,
        commonName: 'Capped Leaf',
        organizationName: 'S44',
        countryName: 'US',
        isCA: false,
        validBefore: '2099-01-01T00:00:00.000Z',
      } as CertificateGenerationInput;

      const [certPem] = generateCertificate(input, logger, subCAKeyPem, subCACertPem);

      const cert = new X509();
      cert.readCertPEM(certPem);
      expect(cert.getIssuerString()).toBe('/CN=localhost SubCA/O=s44/C=US');
      expect(cert.getSubjectString()).toBe('/CN=Capped Leaf/O=S44/C=US');
      // SubCA sample expires 2034-08-19; 2099 request is clamped to it
      expect(cert.getNotAfter()).toBe('340819000000Z');
      expect(isSignedBy(certPem, subCACertPem)).toBe(true);
    });

    it('generates an RSA non-CA certificate', () => {
      const input: CertificateGenerationInput = {
        signatureAlgorithm: SignatureAlgorithmEnumType.RSA,
        keyLength: 512,
        commonName: 'Rsa Leaf',
        organizationName: 'S44',
        countryName: 'US',
        isCA: false,
        validBefore: '2027-01-01T00:00:00.000Z',
      } as CertificateGenerationInput;

      const [certPem, keyPem] = generateCertificate(input, logger);

      const cert = new X509();
      cert.readCertPEM(certPem);
      expect(cert.getSignatureAlgorithmName()).toBe('SHA256withRSA');
      expect(cert.getExtBasicConstraints()).toEqual({
        extname: 'basicConstraints',
        critical: true,
      });
      expect(cert.getExtKeyUsage().names).toContain('keyEncipherment');
      expect(keyPem).toContain(pemMarker('PRIVATE KEY', 'BEGIN'));
    });
  });

  describe('createSignedCertificateFromCSR without extensionRequest', () => {
    it('falls back to default leaf extensions', () => {
      const keyPair = KEYUTIL.generateKeypair('EC', 'secp256r1');
      const csrPem = new KJUR.asn1.csr.CertificationRequest({
        subject: { str: '/CN=NoExt/O=Test/C=US' },
        sbjpubkey: KEYUTIL.getPEM(keyPair.pubKeyObj),
        sigalg: 'SHA256withECDSA',
        sbjprvkey: KEYUTIL.getPEM(keyPair.prvKeyObj, 'PKCS8PRV'),
      }).getPEM();

      const actualResult = createSignedCertificateFromCSR(csrPem, subCACertPem, subCAKeyPem);

      const cert = new X509();
      cert.readCertPEM(actualResult.getPEM());
      expect(cert.getIssuerString()).toBe('/CN=localhost SubCA/O=s44/C=US');
      expect(cert.getSubjectString()).toBe('/CN=NoExt/O=Test/C=US');
      expect(cert.getExtBasicConstraints()).toEqual({ extname: 'basicConstraints' });
      expect(cert.getExtKeyUsage()).toEqual({
        extname: 'keyUsage',
        critical: true,
        names: ['digitalSignature', 'keyEncipherment'],
      });
    });
  });
});

describe('TlsCredentialManager', () => {
  const { logger } = createTestContainer();
  const keyPath = resourcePath('LeafKeySample.pem');
  const certPath = resourcePath('LeafCertificateSample.pem');
  const caPath = resourcePath('RootCertificateSample.pem');

  const makeStorage = () => ({ exists: vi.fn(), getFile: vi.fn() });
  const makeConfig = (overrides: Record<string, unknown> = {}): WebsocketServerConfig =>
    ({
      id: 'wss-1',
      securityProfile: 3,
      tlsKeyFilePath: keyPath,
      tlsCertificateChainFilePath: certPath,
      rootCACertificateFilePath: caPath,
      ...overrides,
    }) as unknown as WebsocketServerConfig;

  afterEach(() => {
    logger.info.mockClear();
  });

  it('loads all credentials from file storage when every path exists there', async () => {
    const storage = makeStorage();
    storage.exists.mockResolvedValue(true);
    storage.getFile
      .mockResolvedValueOnce('KEY')
      .mockResolvedValueOnce('CERT')
      .mockResolvedValueOnce('CA');
    const config = makeConfig();

    const manager = new TlsCredentialManager(config, storage as unknown as IFileStorage, logger);
    const options = await manager.getServerOptions(config);

    expect(options).toEqual({
      key: Buffer.from('KEY'),
      cert: Buffer.from('CERT'),
      ca: Buffer.from('CA'),
      requestCert: true,
      rejectUnauthorized: true,
    });
    expect(storage.exists).toHaveBeenCalledTimes(3);
    expect(storage.exists).toHaveBeenNthCalledWith(1, keyPath, undefined, { trusted: true });
    expect(storage.getFile).toHaveBeenCalledTimes(3);
    expect(storage.getFile).toHaveBeenNthCalledWith(2, certPath, undefined, { trusted: true });
  });

  it('disables client cert verification for security profile 2', async () => {
    const storage = makeStorage();
    storage.exists.mockResolvedValue(true);
    storage.getFile.mockResolvedValueOnce('KEY').mockResolvedValueOnce('CERT');
    const config = makeConfig({ securityProfile: 2, rootCACertificateFilePath: undefined });

    const manager = new TlsCredentialManager(config, storage as unknown as IFileStorage, logger);
    const options = await manager.getServerOptions(config);

    expect(options.requestCert).toBe(false);
    expect(options.rejectUnauthorized).toBe(false);
    expect(storage.exists).toHaveBeenCalledTimes(2);
  });

  it('omits ca when the root CA file cannot be read', async () => {
    const storage = makeStorage();
    storage.exists.mockResolvedValue(true);
    storage.getFile
      .mockResolvedValueOnce('KEY')
      .mockResolvedValueOnce('CERT')
      .mockResolvedValueOnce(undefined);
    const config = makeConfig();

    const manager = new TlsCredentialManager(config, storage as unknown as IFileStorage, logger);
    const options = await manager.getServerOptions(config);

    expect(options.ca).toBeUndefined();
    expect(options.key).toEqual(Buffer.from('KEY'));
  });

  it('falls back to reading paths from disk when file storage misses a file', async () => {
    const storage = makeStorage();
    storage.exists.mockResolvedValue(false);
    const config = makeConfig({ rootCACertificateFilePath: undefined });

    const manager = new TlsCredentialManager(config, storage as unknown as IFileStorage, logger);
    const options = await manager.getServerOptions(config);

    expect(options.key).toEqual(Buffer.from(fs.readFileSync(keyPath, 'utf-8')));
    expect(options.cert).toEqual(Buffer.from(fs.readFileSync(certPath, 'utf-8')));
    expect(storage.getFile).not.toHaveBeenCalled();
  });

  it('rejects when the TLS key is missing everywhere', async () => {
    const storage = makeStorage();
    storage.exists.mockResolvedValue(false);
    const missingKeyPath = resourcePath('DoesNotExist.pem');
    const config = makeConfig({
      tlsKeyFilePath: missingKeyPath,
      rootCACertificateFilePath: undefined,
    });

    const manager = new TlsCredentialManager(config, storage as unknown as IFileStorage, logger);

    await expect(manager.getServerOptions(config)).rejects.toThrow(
      `TLS key file not found: ${missingKeyPath}`,
    );
  });

  it('rejects when the certificate chain is missing', async () => {
    const storage = makeStorage();
    storage.exists.mockResolvedValue(true);
    storage.getFile.mockResolvedValueOnce('KEY').mockResolvedValueOnce(undefined);
    const config = makeConfig({ rootCACertificateFilePath: undefined });

    const manager = new TlsCredentialManager(config, storage as unknown as IFileStorage, logger);

    await expect(manager.getServerOptions(config)).rejects.toThrow(
      `TLS certificate chain file not found: ${certPath}`,
    );
  });

  it('reload re-reads credentials from storage', async () => {
    const storage = makeStorage();
    storage.exists.mockResolvedValue(true);
    storage.getFile
      .mockResolvedValueOnce('KEY-1')
      .mockResolvedValueOnce('CERT-1')
      .mockResolvedValueOnce('KEY-2')
      .mockResolvedValueOnce('CERT-2');
    const config = makeConfig({ rootCACertificateFilePath: undefined });

    const manager = new TlsCredentialManager(config, storage as unknown as IFileStorage, logger);
    const before = await manager.getServerOptions(config);
    await manager.reload();
    const after = await manager.getServerOptions(config);

    expect(before.cert).toEqual(Buffer.from('CERT-1'));
    expect(after.cert).toEqual(Buffer.from('CERT-2'));
    expect(storage.getFile).toHaveBeenCalledTimes(4);
    expect(logger.info).toHaveBeenCalledWith('TLS credentials reloaded from storage');
  });
});

describe('getClientIdFromUrl', () => {
  it('takes the last path segment', () => {
    expect(getClientIdFromUrl('/ocpp/2.0.1/cp001')).toBe('cp001');
  });

  it('strips the query string', () => {
    expect(getClientIdFromUrl('/ws/cp42?token=abc&x=/y')).toBe('cp42');
  });

  it('returns a bare id unchanged', () => {
    expect(getClientIdFromUrl('cp1')).toBe('cp1');
  });
});

describe('WebsocketNetworkConnection', () => {
  const { container } = createTestContainer();

  const makeWs = (readyState: number) => ({
    readyState,
    send: vi.fn((_message: string, callback: (error?: Error) => void) => callback()),
    terminate: vi.fn(),
    close: vi.fn(),
  });

  let cache: { get: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
  let router: {
    networkHook?: (identifier: string, message: string) => Promise<void>;
    deregisterConnection: ReturnType<typeof vi.fn>;
  };
  let connection: WebsocketNetworkConnection;

  const seedSocket = (identifier: string, ws: unknown) => {
    (
      connection as unknown as { _identifierConnections: Map<string, unknown> }
    )._identifierConnections.set(identifier, ws);
  };

  beforeEach(() => {
    cache = { get: vi.fn(), remove: vi.fn() };
    router = { deregisterConnection: vi.fn() };
    connection = getTestInstance(container, WebsocketNetworkConnection, {
      config: {} as SystemConfig,
      cache,
      authenticator: { authenticate: vi.fn() },
      router,
      fileStorage: {},
      doesChargingStationExistByOcppConnectionName: vi.fn(),
      getMaxChargingStationsForTenant: vi.fn(),
      getTenantIdByWebsocketServerPath: vi.fn(),
      getAllTenantWebsocketServerPaths: vi.fn(),
      connectionManager: {},
    });
  });

  it('constructor installs sendMessage as the router network hook', async () => {
    cache.get.mockResolvedValue(null);

    expect(router.networkHook).toBeTypeOf('function');
    await expect(router.networkHook!('1:cp001', 'payload')).rejects.toThrow(
      'Cannot identify client connection for 1:cp001',
    );
    expect(cache.get).toHaveBeenCalledTimes(1);
    expect(cache.get).toHaveBeenCalledWith('1:cp001', CacheNamespace.Connections);
  });

  it('sendMessage terminates a stale socket when the cache entry is gone', async () => {
    cache.get.mockResolvedValue(null);
    const staleWs = makeWs(WebSocket.OPEN);
    seedSocket('1:cp001', staleWs);

    await expect(connection.sendMessage('1:cp001', 'payload')).rejects.toThrow(
      'Cannot identify client connection for 1:cp001',
    );
    expect(staleWs.terminate).toHaveBeenCalledTimes(1);
  });

  it('sendMessage rejects when no socket exists for a cached connection', async () => {
    cache.get.mockResolvedValue('ws-server-0');

    await expect(connection.sendMessage('1:cp001', 'payload')).rejects.toThrow(
      'Websocket connection not found for 1:cp001',
    );
  });

  it('sendMessage terminates and rejects when the socket is not open', async () => {
    cache.get.mockResolvedValue('ws-server-0');
    const closedWs = makeWs(WebSocket.CLOSED);
    seedSocket('1:cp001', closedWs);

    await expect(connection.sendMessage('1:cp001', 'payload')).rejects.toThrow(
      'Websocket connection is not ready - 1:cp001',
    );
    expect(closedWs.terminate).toHaveBeenCalledTimes(1);
    expect(closedWs.send).not.toHaveBeenCalled();
  });

  it('sendMessage resolves after the socket accepts the payload', async () => {
    cache.get.mockResolvedValue('ws-server-0');
    const openWs = makeWs(WebSocket.OPEN);
    seedSocket('1:cp001', openWs);

    await expect(connection.sendMessage('1:cp001', 'payload')).resolves.toBeUndefined();
    expect(openWs.send).toHaveBeenCalledTimes(1);
    expect(openWs.send.mock.calls[0][0]).toBe('payload');
  });

  it('sendMessage rejects with the socket send error', async () => {
    cache.get.mockResolvedValue('ws-server-0');
    const openWs = makeWs(WebSocket.OPEN);
    openWs.send.mockImplementation((_message: string, callback: (error?: Error) => void) =>
      callback(new Error('broken pipe')),
    );
    seedSocket('1:cp001', openWs);

    await expect(connection.sendMessage('1:cp001', 'payload')).rejects.toThrow('broken pipe');
  });

  it('bindNetworkHook returns a delegate to sendMessage', async () => {
    const sendSpy = vi.spyOn(connection, 'sendMessage').mockResolvedValue(undefined);

    await connection.bindNetworkHook()('7:cp007', 'ping');

    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledWith('7:cp007', 'ping');
  });

  it('disconnect closes the socket and deregisters from the router', async () => {
    const openWs = makeWs(WebSocket.OPEN);
    // identifier format is `${tenantId}:${ocppConnectionName}`
    seedSocket('5:cp9', openWs);
    router.deregisterConnection.mockResolvedValue(true);

    const actualResult = await connection.disconnect(5, 'cp9');

    expect(actualResult).toBe(true);
    expect(openWs.close).toHaveBeenCalledWith(1000, 'Disconnected by admin request');
    expect(router.deregisterConnection).toHaveBeenCalledTimes(1);
    expect(router.deregisterConnection).toHaveBeenCalledWith(5, 'cp9');
  });

  it('disconnect returns false without a socket even when deregistration succeeds', async () => {
    router.deregisterConnection.mockResolvedValue(true);

    const actualResult = await connection.disconnect(5, 'cp9');

    expect(actualResult).toBe(false);
    expect(router.deregisterConnection).toHaveBeenCalledWith(5, 'cp9');
  });

  it('reloadTlsCertificates rejects for an unknown server id', async () => {
    await expect(connection.reloadTlsCertificates('wss-9')).rejects.toThrow(
      'No TLS Credential Manager found for server wss-9',
    );
  });

  it('updateTlsCertificates throws for an unknown server id', () => {
    expect(() => connection.updateTlsCertificates('wss-9', 'key', 'chain')).toThrow(
      'Server wss-9 is not a https server.',
    );
  });

  it('getHttpServers is empty before initialize', () => {
    expect(connection.getHttpServers().size).toBe(0);
  });
});
