// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IV2GCertificateAuthorityClient } from './interface';
import { SystemConfig } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { createPemBlock } from '../CertificateUtil';

export class Hubject implements IV2GCertificateAuthorityClient {
  private readonly _baseUrl: string;
  private readonly _isoVersion: string;
  private readonly _tokenUrl: string;
  private _logger: Logger<ILogObj>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>) {
    if (!config.util.certificateAuthority.v2gCA.hubject) {
      throw new Error('Missing Hubject configuration');
    }

    this._baseUrl = config.util.certificateAuthority.v2gCA.hubject.baseUrl;
    this._tokenUrl = config.util.certificateAuthority.v2gCA.hubject.tokenUrl;
    this._isoVersion = config.util.certificateAuthority.v2gCA.hubject.isoVersion;

    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Retrieves a signed certificate based on the provided CSR.
   * DOC: https://hubject.stoplight.io/docs/open-plugncharge/486f0b8b3ded4-simple-enroll-iso-15118-2-and-iso-15118-20
   *
   * @param {string} csrString - The certificate signing request from SignCertificateRequest.
   * @return {Promise<string>} The signed certificate without header and footer.
   */
  async getSignedCertificate(csrString: string): Promise<string> {
    const url = `${this._baseUrl}/cpo/simpleenroll/${this._isoVersion}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/pkcs10',
        Authorization: await this._getAuthorizationToken(this._tokenUrl),
        'Content-Type': 'application/pkcs10',
      },
      body: csrString,
    });

    if (response.status !== 200) {
      throw new Error(
        `Get signed certificate response is unexpected: ${response.status}: ${await response.text()}`,
      );
    }

    return await response.text();
  }

  /**
   * Retrieves the CA certificates including sub CAs and root CA.
   * DOC: https://hubject.stoplight.io/docs/open-plugncharge/e246aa213bc22-obtaining-ca-certificates-iso-15118-2-and-iso-15118-20
   *
   * @return {Promise<string>} The CA certificates.
   */
  async getCACertificates(): Promise<string> {
    const url = `${this._baseUrl}/cpo/cacerts/${this._isoVersion}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/pkcs10, application/pkcs7',
        Authorization: await this._getAuthorizationToken(this._tokenUrl),
        'Content-Transfer-Encoding': 'application/pkcs10',
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `Get CA certificates response is unexpected: ${response.status}: ${await response.text()}`,
      );
    }

    return await response.text();
  }

  async getSignedContractData(
    xsdMsgDefNamespace: string,
    certificateInstallationReq: string,
  ): Promise<string> {
    const url = `${this._baseUrl}/v1/ccp/signedContractData`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: await this._getAuthorizationToken(this._tokenUrl),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        certificateInstallationReq: certificateInstallationReq,
        xsdMsgDefNamespace: xsdMsgDefNamespace,
      }),
    });

    if (response.status !== 200) {
      const errorResponse = await response.text();
      this._logger.error(`Unexpected response ${response.status} from Hubject: ${errorResponse}`);
      let errorMessages = 'Failed to get signed contract data';
      if (errorResponse && errorResponse.includes('errorMessages')) {
        errorMessages = JSON.parse(errorResponse).errorMessages;
      }
      throw new Error(errorMessages);
    }

    const contractData: SignedContractDataResponse = JSON.parse(
      await response.text(),
    ) as SignedContractDataResponse;

    let certificateInstallationRes: string | undefined;
    if (contractData.CCPResponse.emaidContent && contractData.CCPResponse.emaidContent.length > 0) {
      for (const emaidContent of contractData.CCPResponse.emaidContent) {
        if (emaidContent.messageDef && emaidContent.messageDef.certificateInstallationRes) {
          certificateInstallationRes = emaidContent.messageDef.certificateInstallationRes;
        }
      }
    }
    if (!certificateInstallationRes) {
      throw new Error('Failed to find CertificateInstallationRes in response.');
    }
    return certificateInstallationRes;
  }

  /**
   * Retrieves all root certificates from Hubject.
   * Refer to https://hubject.stoplight.io/docs/open-plugncharge/fdc9bdfdd4fb2-get-all-root-certificates
   *
   * @return {Promise<string[]>} Array of root certificate.
   */
  async getRootCertificates(): Promise<string[]> {
    const url = `${this._baseUrl}/v1/root/rootCerts`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: await this._getAuthorizationToken(this._tokenUrl),
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `Get root certificates response is unexpected: ${response.status}: ${await response.text()}`,
      );
    }

    const certificates: string[] = [];
    const rootCertificatesResponse: RootCertificatesResponse = JSON.parse(await response.text());
    for (const root of rootCertificatesResponse.RootCertificateCollection.rootCertificates) {
      certificates.push(createPemBlock('CERTIFICATE', root.caCertificate));
    }

    return certificates;
  }

  private async _getAuthorizationToken(tokenUrl: string): Promise<string> {
    const response = await fetch(tokenUrl, { method: 'GET' });
    if (!response.ok && response.status !== 304) {
      throw new Error(
        `Get token response is unexpected: ${response.status}: ${await response.text()}`,
      );
    }
    return this._parseBearerToken((await response.json()).data);
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

interface SignedContractDataResponse {
  CCPResponse: CCPResponse;
}

interface CCPResponse {
  emaidContent?: EmaidContent[];
}

interface EmaidContent {
  messageDef: MessageDef;
}

interface MessageDef {
  metaData: string;
  certificateInstallationRes: string;
  emaid: string;
}

interface RootCertificatesResponse {
  RootCertificateCollection: RootCertificateCollection;
}

interface RootCertificateCollection {
  rootCertificates: RootCertificate[];
}

interface RootCertificate {
  rootCertificateId: string;
  distinguishedName: string;
  caCertificate: string;
  commonName: string;
  rootAuthorityKeyIdentifier: string;
  rootIssuerSerialNumber: string;
  validFrom: string;
  validTo: string;
  organizationName: string;
  rootType: string;
}
