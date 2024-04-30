// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  CertificateSigningUseEnumType,
  ICache,
  SystemConfig,
} from '@citrineos/base';
import {
  IChargingStationCertificateAuthorityClient,
  IV2GCertificateAuthorityClient,
} from '../client/interface';
import { Hubject } from '../client/hubject';
import * as forge from 'node-forge';
import { Acme } from '../client/acme';
import { ILogObj, Logger } from 'tslog';

export class CertificateAuthorityService {
  private readonly _v2gClient: IV2GCertificateAuthorityClient;
  private readonly _chargingStationClient: IChargingStationCertificateAuthorityClient;
  private readonly _logger: Logger<ILogObj>;

  constructor(config: SystemConfig, cache: ICache, logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._chargingStationClient = this._instantiateChargingStationClient(
      config,
      cache,
      this._logger,
    );
    this._v2gClient = this._instantiateV2GClient(config);
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
    this._logger.info(
      `Getting certificate chain for certificateType: ${certificateType} and stationId: ${stationId}`,
    );

    switch (certificateType) {
      case CertificateSigningUseEnumType.V2GCertificate: {
        const signedCert =
          await this._v2gClient.getSignedCertificate(csrString);
        const caCerts = await this._v2gClient.getCACertificates();
        return this._createCertificateChainWithoutRootCA(signedCert, caCerts);
      }
      case CertificateSigningUseEnumType.ChargingStationCertificate: {
        return await this._chargingStationClient.getCertificateChain(
          csrString,
          stationId,
        );
      }
      default: {
        throw new Error(`Unsupported certificate type: ${certificateType}`);
      }
    }
  }

  async signedSubCaCertificateByExternalCA(csrString: string): Promise<string> {
    return await this._chargingStationClient.signCertificateByExternalCA(
      csrString,
    );
  }

  async getRootCACertificateFromExternalCA(): Promise<string> {
    return await this._chargingStationClient.getRootCACertificate();
  }

  updateSecurityCertChainKeyMap(
    serverId: string,
    certificateChain: string,
    privateKey: string,
  ) {
    this._chargingStationClient.updateCertificateChainKeyMap(
      serverId,
      certificateChain,
      privateKey,
    );
  }

  /**
   * Create a certificate chain including leaf and sub CA certificates except for the root certificate.
   *
   * @param {string} signedCert - The leaf certificate.
   * @param {string} caCerts - CA certificates.
   * @return {string} The certificate chain pem.
   */
  private _createCertificateChainWithoutRootCA(
    signedCert: string,
    caCerts: string,
  ): string {
    // The chain starts from the leaf certificate
    let certChainPem: string = signedCert;
    const caCertsArray: string[] = caCerts
      .split('-----END CERTIFICATE-----')
      .filter((cert) => cert.trim().length > 0);

    caCertsArray.forEach((certPem) => {
      // Add "-----END CERTIFICATE-----" back because split removes it
      const pemWithEnd = certPem + '-----END CERTIFICATE-----';
      const parsedCert = forge.pki.certificateFromPem(pemWithEnd);
      // The issuer of the certificate should not be itself
      if (!parsedCert.isIssuer(parsedCert)) {
        certChainPem = certChainPem.concat(pemWithEnd);
      }
    });

    return certChainPem;
  }

  private _instantiateV2GClient(
    config: SystemConfig,
  ): IV2GCertificateAuthorityClient {
    switch (config.modules.certificates?.v2gCA.name) {
      case 'hubject': {
        return new Hubject(config);
      }
      default: {
        throw new Error(
          `Unsupported V2G CA: ${config.modules.certificates?.v2gCA.name}`,
        );
      }
    }
  }

  private _instantiateChargingStationClient(
    config: SystemConfig,
    cache: ICache,
    logger?: Logger<ILogObj>,
  ): IChargingStationCertificateAuthorityClient {
    switch (config.modules.certificates?.chargingStationCA.name) {
      case 'acme': {
        return new Acme(config, cache, logger);
      }
      default: {
        throw new Error(
          `Unsupported Charging Station CA: ${config.modules.certificates?.chargingStationCA.name}`,
        );
      }
    }
  }
}
