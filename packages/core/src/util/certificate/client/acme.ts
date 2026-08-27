// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ConfigLoader, type IFileStorage } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import {
  createSignedCertificateFromCSR,
  parseCertificateChainPem,
} from '@util/certificate/CertificateUtil.js';
import * as acme from 'acme-client';
import { Client } from 'acme-client';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IChargingStationCertificateAuthorityClient } from './interface.js';

export class Acme implements IChargingStationCertificateAuthorityClient {
  private readonly _email: string | undefined;
  private readonly _preferredChain = {
    name: 'ISRG Root X1',
    file: 'isrgrootx1',
  };
  // Key: serverId, Value: [cert chain, sub ca private key]
  private _securityCertChainKeyMap: Map<string, [string, string]>;

  private _config: SystemConfig;
  private _client: Client | undefined;
  private _logger: Logger<ILogObj>;
  private readonly _fileStorage: IFileStorage;

  private constructor(
    config: SystemConfig,
    fileStorage: IFileStorage,
    securityCertChainKeyMap: Map<string, [string, string]>,
    client: Client,
    logger?: Logger<ILogObj>,
  ) {
    this._fileStorage = fileStorage;
    this._securityCertChainKeyMap = securityCertChainKeyMap;
    this._client = client;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    this._config = config;
    this._email = config.integrations.chargingStationCA?.acme?.email;
  }

  static async create(
    config: SystemConfig,
    fileStorage: IFileStorage,
    logger?: Logger<ILogObj>,
    client?: Client,
  ): Promise<Acme> {
    const log = logger
      ? logger.getSubLogger({ name: 'Acme' })
      : new Logger<ILogObj>({ name: 'Acme' });

    // Read through ConfigLoader rather than taking the servers as an argument: it owns
    // the one copy for the process, so this cannot be handed a snapshot that a later
    // save has moved on from.
    const websocketServersConfig = await ConfigLoader.loadWebsocketServersConfig(
      fileStorage,
      config.websocketServerConfigFile,
    );

    // Collect all required file paths to check existence in configured file storage
    const securityProfile3Servers = websocketServersConfig.filter((s) => s.securityProfile === 3);
    const requiredPaths = securityProfile3Servers.flatMap((s) => [
      s.tlsCertificateChainFilePath as string,
      s.mtlsCertificateAuthorityKeyFilePath as string,
    ]);
    const existResults = await Promise.all(
      requiredPaths.map((p) => fileStorage.exists(p, undefined, { trusted: true })),
    );
    if (!existResults.every(Boolean)) {
      throw new Error('Required certificate files missing in configured file storage.');
    }

    const securityCertChainKeyMap = new Map<string, [string, string]>();
    for (const server of securityProfile3Servers) {
      try {
        const certChain = await fileStorage.getFile(
          server.tlsCertificateChainFilePath as string,
          undefined,
          { trusted: true },
        );
        const mtlsKey = await fileStorage.getFile(
          server.mtlsCertificateAuthorityKeyFilePath as string,
          undefined,
          { trusted: true },
        );
        if (certChain === undefined || mtlsKey === undefined) {
          throw new Error(`Certificate file not found for server ${server.id}`);
        }
        securityCertChainKeyMap.set(server.id, [certChain, mtlsKey]);
      } catch (error) {
        log.error(
          'Unable to start Certificates module due to invalid security certificates for {}: {}',
          server,
          error,
        );
        throw error;
      }
    }

    const acmeEnv = config.integrations.chargingStationCA?.acme?.env;
    const directoryUrl =
      acmeEnv === 'production'
        ? acme.directory.letsencrypt.production
        : acme.directory.letsencrypt.staging;

    let resolvedClient = client;
    if (!resolvedClient) {
      const accountKeyFilePath = config.integrations.chargingStationCA?.acme
        ?.accountKeyFilePath as string;
      const accountKeyStr = await fileStorage.getFile(accountKeyFilePath, undefined, {
        trusted: true,
      });
      if (!accountKeyStr) {
        throw new Error('Account key file not found');
      }
      resolvedClient = new acme.Client({
        directoryUrl,
        accountKey: accountKeyStr,
      });
    }

    return new Acme(config, fileStorage, securityCertChainKeyMap, resolvedClient, logger);
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
    const folderPath =
      '/usr/local/apps/citrineos/apps/ocpp-server/src/assets/.well-known/acme-challenge';

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
        if (!(await this._fileStorage.exists(folderPath, undefined, { trusted: true }))) {
          await this._fileStorage.createDirectory(folderPath, undefined, {
            recursive: true,
            trusted: true,
          });
          this._logger.debug(`Directory created: ${folderPath}`);
        } else {
          this._logger.debug(`Directory already exists: ${folderPath}`);
        }
        this._logger.debug(
          `Creating challenge response ${keyAuthorization} for ${authz.identifier.value} at path: ${filePath}`,
        );
        await this._fileStorage.saveFile(filePath, Buffer.from(keyAuthorization), undefined, {
          trusted: true,
        });
      },
      challengeRemoveFn: async (_authz, _challenge, _keyAuthorization) => {
        this._logger.debug(`Triggered challengeRemoveFn(). Would remove "${folderPath}`);
        await this._fileStorage.deleteFile(folderPath, undefined, {
          recursive: true,
          force: true,
          trusted: true,
        });
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
