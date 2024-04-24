// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ICertificateAuthorityClient } from './interface';
import { SystemConfig } from '@citrineos/base';
import * as acme from 'acme-client';
import {Client} from 'acme-client';
import {ILogObj, Logger} from 'tslog';

export class Acme implements ICertificateAuthorityClient {
  private _client: Client | undefined;
  private _directoryUrl: string = acme.directory.letsencrypt.staging;
  private _logger: Logger<ILogObj>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>) {
    this._logger = logger
        ? logger.getSubLogger({ name: this.constructor.name })
        : new Logger<ILogObj>({ name: this.constructor.name });

    acme.forge.createPrivateKey().then((privateKey) => {
      this._logger.debug(`private key: ${privateKey}`);

      const acmeEnv: string | undefined = config.modules.certificates?.certificateAuthority?.acme?.env;
      if (!acmeEnv && acmeEnv === 'production') {
        this._directoryUrl = acme.directory.letsencrypt.production;
      }

      this._client = new acme.Client({
        directoryUrl: this._directoryUrl,
        accountKey: privateKey
      });
    }).catch(error => {
        throw new Error('Failed to create account key: ' + error);
    });
  }

  /**
   * Get LetsEncrypt CA certificates, ISRG Root X1.
   * @return {Promise<string>} The CA certificate pem.
   */
  async getCACertificates(): Promise<string> {
    const response = await fetch('https://letsencrypt.org/certs/isrgrootx1.pem');

    if (response.status !== 304) {
      throw new Error(`Failed to fetch certificate: ${response.statusText}`);
    }

    return await response.text();
  }

  async getSignedCertificate(csrString: string): Promise<string> {
    const cert = await this._client?.auto({
      csr: csrString,
      email: 'zihe.cheng@s44.team',
      termsOfServiceAgreed: true,
      preferredChain: 'ISRG Root X1', // listed in https://ccadb.my.salesforce-sites.com/mozilla/CAAIdentifiersReport
      skipChallengeVerification: true,
      challengePriority: ['TLS-ALPN-01'],
      challengeCreateFn: async () => {},
      challengeRemoveFn: async () => {}
    });
    this._logger.debug(`certificate: ${cert}`);
    if (!cert) {
      throw new Error('Failed to get signed certificate');
    }
    return cert;
  }
}
