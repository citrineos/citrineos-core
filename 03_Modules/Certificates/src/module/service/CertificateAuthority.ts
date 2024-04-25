// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  CertificateSigningUseEnumType,
  ICache,
  SystemConfig,
} from '@citrineos/base';
import { ICertificateAuthorityClient } from '../client/interface';
import { Hubject } from '../client/hubject';
import * as forge from 'node-forge';
import { Acme } from '../client/acme';
import { ILogObj, Logger } from 'tslog';
import { Local } from '../client/local';

export class CertificateAuthorityService {
  private readonly _hubjectCertificateAuthority: ICertificateAuthorityClient;
  private readonly _acmeCertificateAuthority: ICertificateAuthorityClient;
  private readonly _localCertificateAuthority: ICertificateAuthorityClient;
  private readonly _logger: Logger<ILogObj>;

  constructor(config: SystemConfig, cache: ICache, logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._acmeCertificateAuthority = new Acme(config, this._logger);
    this._hubjectCertificateAuthority = new Hubject(config);
    this._localCertificateAuthority = new Local(config, cache, this._logger);
  }

  /**
   * Retrieves the certificate chain for V2G- and Charging Station certificates.
   *
   * @param {string} csrString - The Certificate Signing Request string.
   * @param {string} stationId - The station identifier.
   * @param {CertificateSigningUseEnumType} [certificateType] - The type of certificate to retrieve.
   * @return {Promise<string>} The certificate chain without the root certificate.
   */
  async getCertificateChain(
    csrString: string,
    stationId: string,
    certificateType?: CertificateSigningUseEnumType,
  ): Promise<string> {
    this._logger.debug(`certificateType: ${certificateType}`);
    switch (certificateType) {
      case CertificateSigningUseEnumType.V2GCertificate: {
        const signedCert =
          await this._hubjectCertificateAuthority.getSignedCertificate(
            csrString,
          );
        const caCerts =
          await this._hubjectCertificateAuthority.getCACertificates();
        return this._createCertificateChainWithoutRoot(signedCert, caCerts);
      }
      case CertificateSigningUseEnumType.ChargingStationCertificate: {
        return await this._localCertificateAuthority.getSignedCertificate(
          csrString,
          stationId,
        );
      }
      default: {
        throw new Error(`Unsupported certificate type: ${certificateType}`);
      }
    }
  }

  async getSignedCertificateByExternalCA(csrString: string): Promise<string> {
    return await this._acmeCertificateAuthority.getSignedCertificate(csrString);
  }

  /**
   * Create a certificate chain without the root certificate.
   *
   * @param {string} signedCert - The signed certificate.
   * @param {string} caCerts - The CA certificates.
   * @return {string} The certificate chain pem without the root cert.
   */
  private _createCertificateChainWithoutRoot(
    signedCert: string,
    caCerts: string,
  ): string {
    let certChainPem: string = signedCert;
    const caCertsArray: string[] = caCerts
      .split('-----END CERTIFICATE-----')
      .filter((cert) => cert.trim().length > 0);

    caCertsArray.forEach((certPem) => {
      // Add "-----END CERTIFICATE-----" back because split removes it
      const pemWithEnd = certPem + '-----END CERTIFICATE-----';
      const parsedCert = forge.pki.certificateFromPem(pemWithEnd);
      if (!parsedCert.isIssuer(parsedCert)) {
        certChainPem = certChainPem.concat(pemWithEnd);
      }
    });

    return certChainPem;
  }
}
