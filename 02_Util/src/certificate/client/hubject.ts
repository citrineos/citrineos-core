// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IV2GCertificateAuthorityClient } from './interface.js';
import { HttpMethod, HttpStatus, type ICache, type SystemConfig } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { createPemBlock } from '../CertificateUtil.js';

export class Hubject implements IV2GCertificateAuthorityClient {
  private readonly _baseUrl: string;
  private readonly _tokenUrl: string;
  private readonly _clientId: string;
  private readonly _clientSecret: string;
  private readonly _logger: Logger<ILogObj>;
  private readonly _cache: ICache;
  private static readonly AUTH_TOKEN_CACHE_KEY = 'HUBJECT_AUTH_TOKEN';
  private static readonly AUTH_TOKEN_CACHE_NAMESPACE = 'hubject';

  constructor(config: SystemConfig, cache: ICache, logger?: Logger<ILogObj>) {
    const hubjectConfig = config.util.certificateAuthority.v2gCA.hubject;
    if (!hubjectConfig) {
      throw new Error('Missing Hubject configuration');
    }
    this._baseUrl = hubjectConfig.baseUrl;
    this._tokenUrl = hubjectConfig.tokenUrl;
    this._clientId = hubjectConfig.clientId;
    this._clientSecret = hubjectConfig.clientSecret;
    this._cache = cache;
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
    return this._makeAuthenticatedRequest(async () => {
      const url = `${this._baseUrl}/.well-known/cpo/simpleenroll`;
      return fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/pkcs10',
          Authorization: await this._getAuthorizationToken(),
          'Content-Type': 'application/pkcs10',
        },
        body: csrString,
      });
    }, 'Get signed certificate response is unexpected');
  }

  /**
   * Retrieves the CA certificates including sub CAs and root CA.
   * DOC: https://hubject.stoplight.io/docs/open-plugncharge/e246aa213bc22-obtaining-ca-certificates-iso-15118-2-and-iso-15118-20
   *
   * @return {Promise<string>} The CA certificates.
   */
  async getCACertificates(): Promise<string> {
    return this._makeAuthenticatedRequest(async () => {
      const url = `${this._baseUrl}/.well-known/cpo/cacerts`;
      return fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/pkcs10, application/pkcs7',
          Authorization: await this._getAuthorizationToken(),
          'Content-Transfer-Encoding': 'application/pkcs10',
        },
      });
    }, 'Get CA certificates response is unexpected');
  }

  async getSignedContractData(
    xsdMsgDefNamespace: string,
    certificateInstallationReq: string,
  ): Promise<string> {
    const responseText = await this._makeAuthenticatedRequest(async () => {
      const url = `${this._baseUrl}/v1/ccp/signedContractData`;
      return fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: await this._getAuthorizationToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateInstallationReq: certificateInstallationReq,
          xsdMsgDefNamespace: xsdMsgDefNamespace,
        }),
      });
    }, 'Get signed contract data response is unexpected');

    const contractData: SignedContractDataResponse = JSON.parse(
      responseText,
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
    const responseText = await this._makeAuthenticatedRequest(async () => {
      const url = `${this._baseUrl}/v1/root/rootCerts`;
      return fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: await this._getAuthorizationToken(),
        },
      });
    }, 'Get root certificates response is unexpected');

    const certificates: string[] = [];
    const rootCertificatesResponse: RootCertificatesResponse = JSON.parse(responseText);
    for (const root of rootCertificatesResponse.RootCertificateCollection.rootCertificates) {
      certificates.push(createPemBlock(root.caCertificate));
    }

    return certificates;
  }

  private async _getAuthorizationToken(retryCount = 0): Promise<string> {
    const MAX_RETRIES = 10;

    if (retryCount >= MAX_RETRIES) {
      throw new Error(
        `Max retries (${MAX_RETRIES}) exceeded while waiting for auth token. ` +
          `Another instance may be holding the lock or experiencing issues.`,
      );
    }

    const cachedToken = await this._cache.get<string>(
      Hubject.AUTH_TOKEN_CACHE_KEY,
      Hubject.AUTH_TOKEN_CACHE_NAMESPACE,
    );

    if (cachedToken) {
      return cachedToken;
    }

    // Try to acquire lock
    const lockKey = `${Hubject.AUTH_TOKEN_CACHE_KEY}_LOCK`;
    const lockAcquired = await this._cache.setIfNotExist(
      lockKey,
      'locked',
      Hubject.AUTH_TOKEN_CACHE_NAMESPACE,
      30, // 30 second lock timeout
    );

    if (!lockAcquired) {
      // Another instance is fetching, wait for it
      const waitMs = 1000 + retryCount * 500; // 1s, 1.5s, 2s, 2.5s...
      this._logger.debug(
        `Lock not acquired, waiting ${waitMs}ms (retry ${retryCount}/${MAX_RETRIES})`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return this._getAuthorizationToken(retryCount + 1); // Recursive retry
    }

    try {
      // Double-check cache in case another instance populated it
      // between initial check and lock acquisition
      const tokenAfterLock = await this._cache.get<string>(
        Hubject.AUTH_TOKEN_CACHE_KEY,
        Hubject.AUTH_TOKEN_CACHE_NAMESPACE,
      );

      if (tokenAfterLock) {
        return tokenAfterLock;
      }

      // Fetch and cache token
      const token = await this._fetchNewToken();
      return token;
    } finally {
      // Always release lock
      const removed = await this._cache.remove(lockKey, Hubject.AUTH_TOKEN_CACHE_NAMESPACE);
      if (!removed) {
        this._logger.warn('Failed to remove lock, it may have already expired');
      }
    }
  }

  private async _fetchNewToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this._clientId,
      client_secret: this._clientSecret,
      audience: this._baseUrl,
    });

    const response = await fetch(this._tokenUrl, {
      method: HttpMethod.Post,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(
        `Get token response is unexpected: ${response.status}: ${await response.text()}`,
      );
    }

    const tokenResponse = await response.json();
    if (!tokenResponse.access_token) {
      this._logger.error('Error fetching token - no access_token in response');
      throw new Error('Error while making call for hubject auth token');
    }

    const token = `Bearer ${tokenResponse.access_token}`;

    // Cache with expiration buffer
    const expiresIn = tokenResponse.expires_in || 3600;
    await this._cache.set(
      Hubject.AUTH_TOKEN_CACHE_KEY,
      token,
      Hubject.AUTH_TOKEN_CACHE_NAMESPACE,
      expiresIn - 60,
    );

    return token;
  }

  private async _makeAuthenticatedRequest(
    requestFn: () => Promise<Response>,
    errorPrefix: string,
  ): Promise<string> {
    try {
      let response = await requestFn();

      // If 401/403, clear cache and retry once
      if (response.status === HttpStatus.FORBIDDEN || response.status === HttpStatus.UNAUTHORIZED) {
        this._logger.warn(`Received ${response.status}, clearing auth token cache and retrying...`);
        const removed = await this._cache.remove(
          Hubject.AUTH_TOKEN_CACHE_KEY,
          Hubject.AUTH_TOKEN_CACHE_NAMESPACE,
        );
        this._logger.debug(`Cache ${Hubject.AUTH_TOKEN_CACHE_KEY} removed: ${removed}`);
        response = await requestFn();
      }

      if (response.status !== HttpStatus.OK) {
        const msg = `${errorPrefix}: ${response.status}: ${await response.text()}`;
        this._logger.error(msg);
        throw new Error(msg);
      }

      return await response.text();
    } catch (error) {
      this._logger.error('Request failed:', error);
      throw error;
    }
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
