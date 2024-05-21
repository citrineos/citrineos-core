// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IChargingStationCertificateAuthorityClient } from './interface';
import { CacheNamespace, ICache, SystemConfig } from '@citrineos/base';
import * as acme from 'acme-client';
import { ILogObj, Logger } from 'tslog';
import fs from 'fs';
import forge from 'node-forge';
import { Client } from 'acme-client';
import {
  createSignedCertificateFromCSR,
  getSubCAForSigning,
} from '../CertificateUtil';

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

    this._email =
      config.util.certificateAuthority.chargingStationCA.acme?.email;
    const accountKey = fs.readFileSync(
      config.util.certificateAuthority.chargingStationCA?.acme
        ?.accountKeyFilePath as string,
    );
    const acmeEnv: string | undefined =
      config.util.certificateAuthority.chargingStationCA?.acme?.env;
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
      `https://letsencrypt.org/certs/${this._preferredChain.file}.pem`,
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
    const folderPath =
      '/usr/local/apps/citrineos/Server/src/assets/.well-known/acme-challenge';

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
        this._logger.debug(
          `Triggered challengeRemoveFn(). Would remove "${folderPath}`,
        );
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
      throw new Error(
        `Cannot find tls certificate chain and sub CA key with serverId  ${clientConnection}`,
      );
    }
    const [certChain, subCAPrivateKey] = this._securityCertChainKeyMap.get(
      clientConnection,
    ) as [string, string];

    const subCACertPem: string = getSubCAForSigning(certChain);
    const signedCertPem: string = forge.pki.certificateToPem(
      createSignedCertificateFromCSR(
        forge.pki.certificationRequestFromPem(csrString),
        forge.pki.certificateFromPem(subCACertPem),
        forge.pki.privateKeyFromPem(subCAPrivateKey),
      ),
    );

    return signedCertPem.replace(/\r/g, '') + subCACertPem;
  }

  updateCertificateChainKeyMap(
    serverId: string,
    certificateChain: string,
    privateKey: string,
  ): void {
    if (this._securityCertChainKeyMap.has(serverId)) {
      this._securityCertChainKeyMap.set(serverId, [
        certificateChain,
        privateKey,
      ]);
    } else {
      this._logger.error(`Server ${serverId} not found in the map`);
    }
  }
}
