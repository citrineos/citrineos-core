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
  private readonly _v2gCertificateAuthority: ICertificateAuthorityClient;
  private readonly _chargingStationCertificateAuthority: ICertificateAuthorityClient;
  private readonly _logger: Logger<ILogObj>;

  constructor(config: SystemConfig, cache: ICache, logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    const caServer =
      config.modules.certificates?.certificateAuthority?.caServer;
    if (
      caServer === 'acme' &&
      !config.modules.certificates?.certificateAuthority?.acme
    ) {
      this._chargingStationCertificateAuthority = new Acme(
        config,
        this._logger,
      );
    } else {
      this._chargingStationCertificateAuthority = new Local(
        config,
        cache,
        this._logger,
      );
    }
    this._v2gCertificateAuthority = new Hubject(config);
  }

  async getCertificateChain(
    csrString: string,
    stationId: string,
    certificateType?: CertificateSigningUseEnumType,
  ): Promise<string> {
    this._logger.debug(`certificateType: ${certificateType}`);
    switch (certificateType) {
      case CertificateSigningUseEnumType.V2GCertificate: {
        const signedCert =
          await this._v2gCertificateAuthority.getSignedCertificate(csrString);
        const caCerts = await this._v2gCertificateAuthority.getCACertificates();
        return this._createCertificateChainWithoutRoot(signedCert, caCerts);
      }
      case CertificateSigningUseEnumType.ChargingStationCertificate: {
        // TODO: remove getCACertificates, it is just for testing
        const caCert: string =
          await this._chargingStationCertificateAuthority.getCACertificates(
            stationId,
          );
        this._logger.debug(`caCert: ${caCert}`);
        return await this._chargingStationCertificateAuthority.getSignedCertificate(
          csrString,
          stationId,
        );
      }
      default: {
        throw new Error(`Unsupported certificate type: ${certificateType}`);
      }
    }
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
