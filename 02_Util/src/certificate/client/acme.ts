// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IChargingStationCertificateAuthorityClient } from './interface';
import { SystemConfig } from '@citrineos/base';
import * as acme from 'acme-client';
import { Client } from 'acme-client';
import { ILogObj, Logger } from 'tslog';
import fs from 'fs';
import { createSignedCertificateFromCSR, parseCertificateChainPem } from '../CertificateUtil';

export class Acme implements IChargingStationCertificateAuthorityClient {
  private readonly _directoryUrl: string = acme.directory.letsencrypt.staging;
  private readonly _email: string | undefined;
  private readonly _preferredChain = {
    name: 'ISRG Root X1',
    file: 'isrgrootx1',
  };
  // Key: serverId, Value: [cert chain, sub ca private key]
  private _securityCertChainKeyMap: Map<string, [string, string]> = new Map();

  private _client: Client | undefined;
  private _logger: Logger<ILogObj>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, client?: Client) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    config.util.networkConnection.websocketServers.forEach((server) => {
      if (server.securityProfile === 3) {
        try {
          this._securityCertChainKeyMap.set(server.id, [
            fs.readFileSync(server.tlsCertificateChainFilePath as string, 'utf8'),
            fs.readFileSync(server.mtlsCertificateAuthorityKeyFilePath as string, 'utf8'),
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

    this._email = config.util.certificateAuthority.chargingStationCA.acme?.email;
    const accountKey = fs.readFileSync(
      config.util.certificateAuthority.chargingStationCA?.acme?.accountKeyFilePath as string,
    );
    const acmeEnv: string | undefined =
      config.util.certificateAuthority.chargingStationCA?.acme?.env;
    if (acmeEnv === 'production') {
      this._directoryUrl = acme.directory.letsencrypt.production;
    }

    this._client =
      client ||
      new acme.Client({
        directoryUrl: this._directoryUrl,
        accountKey: accountKey.toString(),
      });
  }

  /**
   * Get LetsEncrypt Root CA certificate, ISRG Root X1.
   * @return {Promise<string>} The CA certificate pem.
   */
  async getRootCACertificate(): Promise<string> {
    const response = await fetch(`https://letsencrypt.org/certs/${this._preferredChain.file}.pem`);

    if (!response.ok && response.status !== 304) {
      throw new Error(`Failed to fetch certificate: ${response.status}: ${await response.text()}`);
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
    const folderPath = '/usr/local/apps/citrineos/Server/src/assets/.well-known/acme-challenge';

    const cert = await this._client?.auto({
      csr: csrString,
      email: this._email,
      termsOfServiceAgreed: true,
      preferredChain: this._preferredChain.name,
      challengePriority: ['http-01'],
      skipChallengeVerification: true,
      challengeCreateFn: async (authz, challenge, keyAuthorization) => {
        this._logger.debug('Triggered challengeCreateFn()');
        const filePath = `${folderPath}/${challenge.token}`;
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
          this._logger.debug(`Directory created: ${folderPath}`);
        } else {
          this._logger.debug(`Directory already exists: ${folderPath}`);
        }
        const fileContents = keyAuthorization;
        this._logger.debug(
          `Creating challenge response ${fileContents} for ${authz.identifier.value} at path: ${filePath}`,
        );
        fs.writeFileSync(filePath, fileContents);
      },
      challengeRemoveFn: async (_authz, _challenge, _keyAuthorization) => {
        this._logger.debug(`Triggered challengeRemoveFn(). Would remove "${folderPath}`);
        fs.rmSync(folderPath, { recursive: true, force: true });
      },
    });

    if (!cert) {
      throw new Error('Failed to get signed certificate');
    }
    this._logger.debug(`Certificate singed by external CA: ${cert}`);
    return cert;
  }

  /**
   * Get sub CA from the certificate chain.
   * Use it to sign certificate based on the CSR string.
   *
   * @param {string} csrString - The Certificate Signing Request (CSR) string.
   * @return {Promise<string>} - The signed certificate followed by sub CA in PEM format.
   */
  async getCertificateChain(csrString: string): Promise<string> {
    const nextEntry = this._securityCertChainKeyMap.entries().next().value;
    if (!nextEntry) {
      throw new Error('Failed to get certificate chain, securityCertChainKeyMap is empty');
    }
    const [serverId, [certChain, subCAPrivateKey]] = nextEntry;
    this._logger.debug(`Found certificate chain in server ${serverId}: ${certChain}`);

    const certChainArray: string[] = parseCertificateChainPem(certChain);
    if (certChainArray.length < 2) {
      throw new Error(
        `The size of the chain is ${certChainArray.length}. Sub CA certificate for signing not found`,
      );
    }
    this._logger.info(`Found Sub CA certificate: ${certChainArray[1]}`);

    const signedCertPem: string = createSignedCertificateFromCSR(
      csrString,
      certChainArray[1],
      subCAPrivateKey,
    ).getPEM();

    // Generate and return certificate chain for signed certificate
    certChainArray[0] = signedCertPem.replace(/\n+$/, '');
    return certChainArray.join('\n');
  }

  updateCertificateChainKeyMap(
    serverId: string,
    certificateChain: string,
    privateKey: string,
  ): void {
    if (this._securityCertChainKeyMap.has(serverId)) {
      this._securityCertChainKeyMap.set(serverId, [certificateChain, privateKey]);
      this._logger.info(`Updated certificate chain key map for server ${serverId}`);
    } else {
      this._logger.error(`Server ${serverId} not found in the map`);
    }
  }
}
