import { ICertificateAuthorityClient } from './interface';
import { CacheNamespace, ICache, SystemConfig } from '@citrineos/base';
import forge from 'node-forge';
import fs from 'fs';
import { ILogObj, Logger } from 'tslog';

export class Local implements ICertificateAuthorityClient {
  // Key: serverId, Value: [certificate chain, sub ca private key, root ca]
  private _securityCaCertsKeyMap: Map<
    string,
    [string, string, string | undefined]
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
        let rootCA: string | undefined;
        if (!server.rootCaCertificateFilePath) {
          rootCA = fs.readFileSync(
            server.rootCaCertificateFilePath as string,
            'utf8',
          );
        }
        try {
          this._securityCaCertsKeyMap.set(server.id, [
            fs.readFileSync(
              server.tlsCertificateChainFilePath as string,
              'utf8',
            ),
            fs.readFileSync(
              server.mtlsCertificateAuthorityKeyFilePath as string,
              'utf8',
            ),
            rootCA,
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

  updateSecurityCaCertsKeyMap(
    serverId: string,
    certificateChain: string,
    privateKey: string,
    rootCA?: string,
  ) {
    if (this._securityCaCertsKeyMap.has(serverId)) {
      this._securityCaCertsKeyMap.set(serverId, [
        certificateChain,
        privateKey,
        rootCA,
      ]);
    } else {
      this._logger.error(
        `server ${serverId} not found in securityCaCertsKeyMap`,
      );
    }
  }

  /**
   * Retrieve customized root CA based on stationId.
   *
   * @param {string} stationId - The ID of the station.
   * @return {Promise<string>} The root CA certificate in PEM format.
   */
  async getCACertificates(stationId?: string): Promise<string> {
    if (!stationId) {
      throw new Error('stationId is required');
    }

    const clientConnection: string = (await this._cache.get(
      stationId,
      CacheNamespace.Connections,
    )) as string;
    const [_certChain, _subCAPrivateKey, caCert] =
      this._securityCaCertsKeyMap.get(clientConnection) as [
        string,
        string,
        string | undefined,
      ];

    if (!caCert) {
      throw new Error('Customized CA certificate not found');
    }

    return caCert;
  }

  /**
   * Get sub CA from the certificate chain based on the station ID.
   * Use it to sign certificate based on the CSR string.
   *
   * @param {string} csrString - The CSR string.
   * @param {string} [stationId] - The station ID.
   * @return {Promise<string>} The signed certificate followed by sub CA in PEM format.
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
    const [certChain, subCAPrivateKey, _rootCa] =
      this._securityCaCertsKeyMap.get(clientConnection) as [
        string,
        string,
        string | undefined,
      ];

    const subCACertPem: string = this._getCertificateForSigning(certChain);

    const signedCertPem: string = forge.pki.certificateToPem(
      this._createSignedCertificate(
        forge.pki.certificationRequestFromPem(csrString),
        forge.pki.certificateFromPem(subCACertPem),
        forge.pki.privateKeyFromPem(subCAPrivateKey),
      ),
    );

    return signedCertPem.trim() + '\n' + subCACertPem;
  }

  /**
   * Retrieves the sub CA certificate for signing from the provided certificate chain PEM string.
   * The chain looks is in order: leaf cert, sub CA n ... sub CA 1
   *
   * @param {string} certChainPem - The PEM string containing the ordered certificates.
   * @return {string | null} The sub CA certificate which is used for signing or null if not found.
   */
  private _getCertificateForSigning(certChainPem: string): string {
    const certsArray: string[] = certChainPem
      .split('-----END CERTIFICATE-----')
      .filter((cert) => cert.trim().length > 0);

    if (certsArray.length === 0) {
      throw new Error('Sub CA certificate for signing not found');
    }

    // Add "-----END CERTIFICATE-----" back because split removes it
    return certsArray[1].concat('-----END CERTIFICATE-----');
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
