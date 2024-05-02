// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IChargingStationCertificateAuthorityClient } from './interface';
import { CacheNamespace, ICache, SystemConfig } from '@citrineos/base';
import * as acme from 'acme-client';
import { Client } from 'acme-client';
import { ILogObj, Logger } from 'tslog';
import fs from 'fs';
import forge from 'node-forge';

export class Acme implements IChargingStationCertificateAuthorityClient {
  private readonly _directoryUrl: string = acme.directory.letsencrypt.staging;
  private readonly _email: string | undefined;
  // Key: serverId, Value: [cert chain, sub ca private key]
  private _securityCertChainKeyMap: Map<string, [string, string]> = new Map();

  private _client: Client | undefined;
  private _cache: ICache;
  private _logger: Logger<ILogObj>;

  constructor(config: SystemConfig, cache: ICache, logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._cache = cache;

    config.util.networkConnection.websocketServers.forEach((server) => {
      if (server.securityProfile === 3) {
        try {
          this._securityCertChainKeyMap.set(server.id, [
            fs.readFileSync(
              server.tlsCertificateChainFilePath as string,
              'utf8',
            ),
            fs.readFileSync(
              server.mtlsCertificateAuthorityKeyFilePath as string,
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

    this._email = config.modules.certificates?.chargingStationCA.acme?.email;
    const accountKey = fs.readFileSync(
      config.modules.certificates?.chargingStationCA?.acme
        ?.accountKeyFilePath as string,
    );
    const acmeEnv: string | undefined =
      config.modules.certificates?.chargingStationCA?.acme?.env;
    if (!acmeEnv && acmeEnv === 'production') {
      this._directoryUrl = acme.directory.letsencrypt.production;
    }

    this._client = new acme.Client({
      directoryUrl: this._directoryUrl,
      accountKey: accountKey.toString(),
    });
  }

  /**
   * Get LetsEncrypt Root CA certificate, ISRG Root X1.
   * @return {Promise<string>} The CA certificate pem.
   */
  async getRootCACertificate(): Promise<string> {
    const response = await fetch(
      'https://letsencrypt.org/certs/isrgrootx1.pem',
    );

    if (!response.ok && response.status !== 304) {
      throw new Error(
        `Failed to fetch certificate: ${response.statusText}: ${await response.text()}`,
      );
    }

    return await response.text();
  }

  /**
   * Retrieves a signed certificate based on the provided CSR.
   * The returned certificate will be signed by Let's Encrypt, ISRG Root X1.
   * which is listed in https://ccadb.my.salesforce-sites.com/mozilla/CAAIdentifiersReport
   *
   * @param {string} csrString - The certificate signing request.
   * @return {Promise<string>} The signed certificate.
   */
  async signCertificateByExternalCA(csrString: string): Promise<string> {
    const cert = await this._client?.auto({
      csr: csrString,
      email: this._email,
      termsOfServiceAgreed: true,
      preferredChain: 'ISRG Root X1',
      challengeCreateFn: async () => {},
      challengeRemoveFn: async () => {},
    });
    this._logger.debug(`certificate: ${cert}`);
    if (!cert) {
      throw new Error('Failed to get signed certificate');
    }
    return cert;
  }

  /**
   * Get sub CA from the certificate chain based on the station ID.
   * Use it to sign certificate based on the CSR string.
   *
   * @param {string} csrString - The Certificate Signing Request (CSR) string.
   * @param {string} [stationId] - The station ID.
   * @return {Promise<string>} - The signed certificate followed by sub CA in PEM format.
   */
  async getCertificateChain(
    csrString: string,
    stationId: string,
  ): Promise<string> {
    const clientConnection: string = (await this._cache.get(
      stationId,
      CacheNamespace.Connections,
    )) as string;

    if (!this._securityCertChainKeyMap.has(clientConnection)) {
      throw new Error(`Cannot find tls certificate chain and sub CA key with serverId  ${clientConnection}`);
    }
    const [certChain, subCAPrivateKey] = this._securityCertChainKeyMap.get(
      clientConnection,
    ) as [string, string];

    const subCACertPem: string = this._getSubCAForSigning(certChain);
    const signedCertPem: string = forge.pki.certificateToPem(
      this._createSignedCertificateFromCSR(
        forge.pki.certificationRequestFromPem(csrString),
        forge.pki.certificateFromPem(subCACertPem),
        forge.pki.privateKeyFromPem(subCAPrivateKey),
      ),
    );

    return signedCertPem.replace(/\r/g, '') + subCACertPem;
  }

  /**
   * Retrieves sub CA certificate for signing from the provided certificate chain PEM string.
   * The chain is in order: leaf cert, sub CA n ... sub CA 1
   *
   * @param {string} certChainPem - The PEM string containing the ordered CA certificates.
   * @return {string} The sub CA certificate which is used for signing.
   */
  private _getSubCAForSigning(certChainPem: string): string {
    const certsArray: string[] = certChainPem
      .split('-----END CERTIFICATE-----')
      .filter((cert) => cert.trim().length > 0);

    if (certsArray.length < 2) {
      // no certificate or only one leaf certificate
      throw new Error('Sub CA certificate for signing not found');
    }

    // Remove leading new line and add "-----END CERTIFICATE-----" back because split removes it
    return certsArray[1].replace(/^\n+/, '').concat('-----END CERTIFICATE-----');
  }

  /**
   * Generate a serial number without leading 0s.
   */
  private _generateSerialNumber(): string {
    const hexString = forge.util.bytesToHex(forge.random.getBytesSync(20));
    return hexString.replace(/^0+/, '');
  }

  /**
   * Create a signed certificate for the provided CSR using the sub CA certificate, and its private key.
   *
   * @param {forge.pki.CertificateSigningRequest} csr - The CSR that need to be signed.
   * @param {forge.pki.Certificate} caCert - The sub CA certificate.
   * @param {forge.pki.rsa.PrivateKey} caPrivateKey - The private key of the sub CA certificate.
   * @return {forge.pki.Certificate} The signed certificate.
   */
  private _createSignedCertificateFromCSR(
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
