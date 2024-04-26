import { ICertificateAuthorityClient } from './interface';
import { CacheNamespace, ICache, SystemConfig } from '@citrineos/base';
import forge from 'node-forge';
import fs from 'fs';
import { ILogObj, Logger } from 'tslog';

export class Local implements ICertificateAuthorityClient {
  // Key: serverId, Value: [ca certs chain, sub ca private key]
  private _securityCaCertsKeyMap: Map<string, [string, string]> = new Map();
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
          this._securityCaCertsKeyMap.set(server.id, [
            fs.readFileSync(
              server.mtlsCertificateAuthorityRootsFilepath as string,
              'utf8',
            ),
            fs.readFileSync(
              server.mtlsCertificateAuthorityKeyFilepath as string,
              'utf8',
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
   * Retrieves CSMSRootCertificate chain based on stationId.
   * including a sub CA certificate + an external root CA certificate .
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
    const [caCerts, _subCAPrivateKey] = this._securityCaCertsKeyMap.get(
      clientConnection,
    ) as [string, string];

    return caCerts;
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
    const [caCerts, subCAPrivateKey] = this._securityCaCertsKeyMap.get(
      clientConnection,
    ) as [string, string];

    const csr: forge.pki.CertificateSigningRequest =
      forge.pki.certificationRequestFromPem(csrString);

    const caCert: forge.pki.Certificate = forge.pki.certificateFromPem(
      this._getCertificateForSigning(caCerts),
    );
    const caPrivateKey: forge.pki.rsa.PrivateKey =
      forge.pki.privateKeyFromPem(subCAPrivateKey);
    return forge.pki.certificateToPem(
      this._createSignedCertificate(csr, caCert, caPrivateKey),
    );
  }

  /**
   * Retrieves the CA certificate for signing from the provided ordered CA certificates PEM string.
   * the order should follow: sub CA n .... sub CA 2, sub CA 1, root CA
   *
   * @param {string} caCertsPem - The PEM string containing the ordered CA certificates.
   * @return {string | null} The CA certificate which is used for signing or null if not found.
   */
  private _getCertificateForSigning(caCertsPem: string): string {
    const caCertsArray: string[] = caCertsPem
      .split('-----END CERTIFICATE-----')
      .filter((cert) => cert.trim().length > 0);

    if (caCertsArray.length === 0) {
      throw new Error('CA certificate for signing not found');
    }

    // Add "-----END CERTIFICATE-----" back because split removes it
    return caCertsArray[0].concat('-----END CERTIFICATE-----');
  }

  /**
   * Generate a serial number without leading 0s.
   */
  private _generateSerialNumber(): string {
    const hexString = forge.util.bytesToHex(forge.random.getBytesSync(20));
    return hexString.replace(/^0+/, '');
  }

  /**
   * Create a signed certificate for the provided CSR using the CA certificate, and its private key.
   *
   * @param {forge.pki.CertificateSigningRequest} csr - The CSR that need to be signed.
   * @param {forge.pki.Certificate} caCert - The CA certificate.
   * @param {forge.pki.rsa.PrivateKey} caPrivateKey - The private key of the CA certificate.
   * @return {forge.pki.Certificate} The signed certificate.
   */
  private _createSignedCertificate(
    csr: forge.pki.CertificateSigningRequest,
    caCert: forge.pki.Certificate,
    caPrivateKey: forge.pki.rsa.PrivateKey,
  ): forge.pki.Certificate {
    // Create the certificate
    const certificate: forge.pki.Certificate = forge.pki.createCertificate();
    certificate.publicKey = csr.publicKey as forge.pki.rsa.PublicKey;
    certificate.serialNumber = this._generateSerialNumber(); // Unique serial number for the certificate
    certificate.validity.notBefore = new Date();
    certificate.validity.notAfter = new Date();
    certificate.validity.notAfter.setFullYear(
      certificate.validity.notAfter.getFullYear() + 1,
    ); // 1-year validity by default
    certificate.setIssuer(caCert.subject.attributes); // Set CA's attributes as issuer
    certificate.setSubject(csr.subject.attributes);
    certificate.setExtensions([
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
    certificate.sign(caPrivateKey);

    return certificate;
  }
}
