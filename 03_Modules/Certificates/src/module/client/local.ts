import { ICertificateAuthorityClient } from './interface';
import { CacheNamespace, ICache, SystemConfig } from '@citrineos/base';
import forge from 'node-forge';
import fs from 'fs';
import { ILogObj, Logger } from 'tslog';

export class Local implements ICertificateAuthorityClient {
  private _securityCaCertKeyPairs: Map<
    string,
    [forge.pki.Certificate, forge.pki.rsa.PrivateKey]
  > = new Map();
  private _logger: Logger<ILogObj>;
  private _cache: ICache;

  constructor(config: SystemConfig, cache: ICache, logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._cache = cache;

    config.util.networkConnection.websocketServers.forEach((server) => {
      if (server.securityProfile === 3) {
        try {
          this._securityCaCertKeyPairs.set(server.id, [
            forge.pki.certificateFromPem(
              fs.readFileSync(
                server.mtlsCertificateAuthorityRootsFilepath as string,
                'utf8',
              ),
            ),
            forge.pki.privateKeyFromPem(
              fs.readFileSync(
                server.mtlsCertificateAuthorityKeysFilepath as string,
                'utf8',
              ),
            ),
          ]);
        } catch (error) {
          this._logger.error(
            'Unable to start Certificates module due to invalid security certificates for {}: {}',
            server,
            error,
          );
          throw error;
        }
      }
    });
  }

  /**
   * Retrieves CSMSRootCertificate based a specific station.
   *
   * @param {string} stationId - The ID of the station.
   * @return {Promise<string>} The CSMSRootCertificate in PEM format.
   */
  async getCACertificates(stationId?: string): Promise<string> {
    if (!stationId) {
      throw new Error('stationId is required');
    }
    const clientConnection: string = (await this._cache.get(
      stationId,
      CacheNamespace.Connections,
    )) as string;
    const [rootCert, _rootPrivateKey] = this._securityCaCertKeyPairs.get(
      clientConnection,
    ) as [forge.pki.Certificate, forge.pki.rsa.PrivateKey];

    return forge.pki.certificateToPem(rootCert);
  }

  /**
   * Load CSMSRootCertificate based on the station ID.
   * Use it to sign certificate based on the CSR string.
   *
   * @param {string} csrString - The Certificate Signing Request (CSR) string.
   * @param {string} [stationId] - The station ID.
   * @return {Promise<string>} The signed certificate in PEM format.
   */
  async getSignedCertificate(
    csrString: string,
    stationId?: string,
  ): Promise<string> {
    if (!stationId) {
      throw new Error('stationId is required');
    }
    const clientConnection: string = (await this._cache.get(
      stationId,
      CacheNamespace.Connections,
    )) as string;
    const [rootCert, rootPrivateKey] = this._securityCaCertKeyPairs.get(
      clientConnection,
    ) as [forge.pki.Certificate, forge.pki.rsa.PrivateKey];

    const csr: forge.pki.CertificateSigningRequest =
      forge.pki.certificationRequestFromPem(csrString);

    return forge.pki.certificateToPem(
      this._createSignedCertificate(csr, rootCert, rootPrivateKey),
    );
  }

  /**
   * Generate a serial number without leading 0s.
   */
  private _generateSerialNumber(): string {
    const hexString = forge.util.bytesToHex(forge.random.getBytesSync(20));
    return hexString.replace(/^0+/, '');
  }

  private _createSignedCertificate(
    csr: forge.pki.CertificateSigningRequest,
    caCert: forge.pki.Certificate,
    caPrivateKey: forge.pki.rsa.PrivateKey,
  ): forge.pki.Certificate {
    const cert = forge.pki.createCertificate();
    cert.publicKey = csr.publicKey as forge.pki.rsa.PublicKey;
    cert.serialNumber = this._generateSerialNumber(); // Unique serial number for the certificate
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(
      cert.validity.notAfter.getFullYear() + 1,
    ); // 1-year validity
    // Set CA's attributes as issuer
    cert.setIssuer(caCert.subject.attributes);
    cert.setSubject(csr.subject.attributes);
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: false,
      },
      {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true,
      },
    ]);
    // Sign the certificate
    cert.sign(caPrivateKey);
    return cert;
  }
}
