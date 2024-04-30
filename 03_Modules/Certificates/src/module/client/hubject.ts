// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IV2GCertificateAuthorityClient } from './interface';
import { SystemConfig } from '@citrineos/base';

export class Hubject implements IV2GCertificateAuthorityClient {
  private readonly _baseUrl: string;
  private readonly _isoVersion: string;
  private readonly _tokenUrl: string;

  private _authorizationToken: string | undefined;

  constructor(config: SystemConfig) {
    if (!config.modules.certificates?.v2gCA.hubject) {
      throw new Error('Missing Hubject configuration');
    }

    this._baseUrl = config.modules.certificates?.v2gCA.hubject.baseUrl;
    this._tokenUrl = config.modules.certificates?.v2gCA.hubject.tokenUrl;
    this._isoVersion = config.modules.certificates?.v2gCA.hubject.isoVersion;
  }

  /**
   * Retrieves a signed certificate based on the provided CSR.
   * DOC: https://hubject.stoplight.io/docs/open-plugncharge/486f0b8b3ded4-simple-enroll-iso-15118-2-and-iso-15118-20
   *
   * @param {string} csrString - The certificate signing request from SignCertificateRequest.
   * @return {Promise<string>} The signed certificate.
   */
  async getSignedCertificate(csrString: string): Promise<string> {
    this._authorizationToken =
      this._authorizationToken ||
      (await this._getAuthorizationToken(this._tokenUrl));
    const url = `${this._baseUrl}/cpo/simpleenroll/${this._isoVersion}`;
    const base64Csr: string = Buffer.from(csrString).toString('base64');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/pkcs10',
        Authorization: this._authorizationToken,
        'Content-Type': 'application/pkcs10',
      },
      body: base64Csr,
    });

    if (response.status !== 200) {
      throw new Error(
        `Get signed certificate response is unexpected: ${response.status}: ${await response.text()}`,
      );
    }

    return Buffer.from(await response.text(), 'base64').toString('utf8');
  }

  /**
   * Retrieves the CA certificates including sub CAs and root CA.
   * DOC: https://hubject.stoplight.io/docs/open-plugncharge/e246aa213bc22-obtaining-ca-certificates-iso-15118-2-and-iso-15118-20
   *
   * @return {Promise<string>} The CA certificates.
   */
  async getCACertificates(): Promise<string> {
    this._authorizationToken =
      this._authorizationToken ||
      (await this._getAuthorizationToken(this._tokenUrl));
    const url = `${this._baseUrl}/cpo/cacerts/${this._isoVersion}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/pkcs10, application/pkcs7',
        Authorization: this._authorizationToken,
        'Content-Transfer-Encoding': 'application/pkcs10',
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `Get CA certificates response is unexpected: ${response.status}: ${await response.text()}`,
      );
    }

    return Buffer.from(await response.text(), 'base64').toString('utf8');
  }

  private async _getAuthorizationToken(tokenUrl: string): Promise<string> {
    return fetch(tokenUrl, { method: 'GET' })
      .then((response) => {
        if (response.status !== 304) {
          throw new Error(
            `Get token response is unexpected: ${response.status}`,
          );
        }
        return response.json();
      })
      .then((data) => this._parseBearerToken(data.data))
      .catch((error) => {
        throw new Error(`Get token failed: ${error}`);
      });
  }

  /**
   * Parses the Bearer token from the input token
   * which is expected to be in the format of "XXXXBearer <token>\nXXXXX"
   *
   * @param {string} token - The input token string to parse.
   * @return {string} The parsed Bearer token string.
   */
  private _parseBearerToken(token: string): string {
    let tokenValue: string = token.split('Bearer ')[1];
    tokenValue = tokenValue.split('\n')[0];
    return 'Bearer ' + tokenValue;
  }
}
