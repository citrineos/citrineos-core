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
import { Acme } from '../client/acme';
import { ILogObj, Logger } from 'tslog';
import * as pkijs from 'pkijs';
import * as asn1js from 'asn1js';
import { Certificate } from 'pkijs';

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
        const signedCert = await this._v2gClient.getSignedCertificate(
          this._extractEncodedContentFromCSR(csrString),
        );
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
    let certificateChain = '';
    // Add Cert
    const leafRaw = this._extractCertificateArrayFromPem(signedCert)?.[0];
    if (leafRaw) {
      certificateChain += this._createPemBlock(
        'CERTIFICATE',
        Buffer.from(leafRaw.toSchema().toBER(false)).toString('base64'),
      );
    } else {
      throw new Error(
        `Cannot extract leaf certificate from the pem: ${signedCert}`,
      );
    }

    // Add Chain
    const chainWithoutRoot = this._extractCertificateArrayFromPem(
      caCerts,
    )?.slice(0, -1);
    chainWithoutRoot?.forEach((certItem) => {
      const cert = certItem as Certificate;
      certificateChain += this._createPemBlock(
        'CERTIFICATE',
        Buffer.from(cert.toSchema().toBER(false)).toString('base64'),
      );
    });

    return certificateChain;
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

  /**
   * Decode the pem and extract certificates
   * @param pem - base64 encoded certificate without header and footer
   * @return array of pkijs.CertificateSetItem
   */
  private _extractCertificateArrayFromPem(
    pem: string,
  ): pkijs.CertificateSetItem[] | undefined {
    const cmsSignedBuffer = Buffer.from(pem, 'base64');
    const asn1 = asn1js.fromBER(cmsSignedBuffer);
    const cmsContent = new pkijs.ContentInfo({ schema: asn1.result });
    const cmsSigned = new pkijs.SignedData({ schema: cmsContent.content });
    return cmsSigned.certificates;
  }

  /**
   * extracts the base64-encoded content from a pem encoded csr
   * @param csrPem
   * @private
   * @return {string} The parsed CSR or the original CSR if it cannot be parsed
   */
  private _extractEncodedContentFromCSR(csrPem: string): string {
    return csrPem
      .replace(/-----BEGIN CERTIFICATE REQUEST-----/, '')
      .replace(/-----END CERTIFICATE REQUEST-----/, '')
      .replace(/\n/g, '');
  }

  private _createPemBlock(type: string, content: string) {
    return `-----BEGIN ${type}-----\n${content}\n-----END ${type}-----\n`;
  }
}
