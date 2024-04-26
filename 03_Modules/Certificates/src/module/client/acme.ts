// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ICertificateAuthorityClient } from './interface';
import { SystemConfig } from '@citrineos/base';
import * as acme from 'acme-client';
import { Client } from 'acme-client';
import { ILogObj, Logger } from 'tslog';
import fs from 'fs';

export class Acme implements ICertificateAuthorityClient {
  private readonly _directoryUrl: string = acme.directory.letsencrypt.staging;
  private readonly _email: string | undefined;

  private _client: Client | undefined;
  private _logger: Logger<ILogObj>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._email =
      config.modules.certificates?.certificateAuthority?.acme?.email;
    const accountKey = fs.readFileSync(
      config.modules.certificates?.certificateAuthority?.acme
        ?.accountKeyFilePath as string,
    );
    const acmeEnv: string | undefined =
      config.modules.certificates?.certificateAuthority?.acme?.env;
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
  async getCACertificates(): Promise<string> {
    const response = await fetch(
      'https://letsencrypt.org/certs/isrgrootx1.pem',
    );

    if (response.status !== 304) {
      throw new Error(`Failed to fetch certificate: ${response.statusText}`);
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
  async getSignedCertificate(csrString: string): Promise<string> {
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
}
