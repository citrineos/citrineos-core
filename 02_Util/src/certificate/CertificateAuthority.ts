// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AuthorizeCertificateStatusEnumType,
  CertificateSigningUseEnumType,
  ICache,
  InstallCertificateUseEnumType,
  OCSPRequestDataType,
  SystemConfig,
} from '@citrineos/base';
import {
  IChargingStationCertificateAuthorityClient,
  IV2GCertificateAuthorityClient,
} from './client/interface';
import { Hubject } from './client/hubject';
import { Acme } from './client/acme';
import { ILogObj, Logger } from 'tslog';
import * as pkijs from 'pkijs';
import * as asn1js from 'asn1js';
import { Certificate } from 'pkijs';
import jsrsasign from 'jsrsasign';
import X509 = jsrsasign.X509;
import getOCSPResponseInfo = jsrsasign.KJUR.asn1.ocsp.OCSPUtil.getOCSPResponseInfo;
import OCSPRequest = jsrsasign.KJUR.asn1.ocsp.OCSPRequest;
import Request = jsrsasign.KJUR.asn1.ocsp.Request;
import moment from 'moment';
import {createPemBlock} from './CertificateUtil';

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

  async getSignedContractData(
    iso15118SchemaVersion: string,
    exiRequest: string,
  ): Promise<string> {
    return await this._v2gClient.getSignedContractData(
      iso15118SchemaVersion,
      exiRequest,
    );
  }

  async getRootCACertificateFromExternalCA(
    certificateType: InstallCertificateUseEnumType,
  ): Promise<string> {
    switch (certificateType) {
      case InstallCertificateUseEnumType.V2GRootCertificate: {
        const caCerts = await this._v2gClient.getCACertificates();
        const rootCACert = this._extractCertificateArrayFromPem(caCerts)?.pop();
        if (rootCACert) {
          return createPemBlock(
            'CERTIFICATE',
            Buffer.from(rootCACert.toSchema().toBER(false)).toString('base64'),
          );
        } else {
          throw new Error('V2GRootCertificate not found');
        }
      }
      case InstallCertificateUseEnumType.CSMSRootCertificate:
        return await this._chargingStationClient.getRootCACertificate();
      default:
        throw new Error(
          `Certificate type: ${certificateType} not implemented.`,
        );
    }
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

  /*
   * Validate the certificate chain using real time OCSP check.
   *
   * @param certificateChainPem - certificate chain pem
   * @return AuthorizeCertificateStatusEnumType
   */
  public async validateCertificateChainPem(
    certificateChainPem: string,
  ): Promise<AuthorizeCertificateStatusEnumType> {
    const certificatePems: string[] =
      this._parseCertificateChainPem(certificateChainPem);
    if (certificatePems.length < 1) {
      return AuthorizeCertificateStatusEnumType.NoCertificateAvailable;
    }

    // Find the root certificate of the certificate chain
    const rootCerts: string[] = await this._v2gClient.getRootCertificates();
    const lastCertInChain = new X509();
    lastCertInChain.readCertPEM(certificatePems[certificatePems.length - 1]);
    let rootCertPem;
    for (const rootCert of rootCerts) {
      const root = new X509();
      root.readCertPEM(rootCert);
      if (
        root.getSubjectString() === lastCertInChain.getIssuerString() &&
        root.getExtSubjectKeyIdentifier().kid.hex ===
          lastCertInChain.getExtAuthorityKeyIdentifier().kid.hex
      ) {
        rootCertPem = rootCert;
        break;
      }
    }
    if (!rootCertPem) {
      this._logger.error(
        `Cannot find root certificate for certificate ${lastCertInChain}`,
      );
      return AuthorizeCertificateStatusEnumType.NoCertificateAvailable;
    } else {
      certificatePems.push(rootCertPem);
    }

    // OCSP validation for each certificate
    for (let i = 0; i < certificatePems.length - 1; i++) {
      const subjectCert = new X509();
      subjectCert.readCertPEM(certificatePems[i]);

      const notAfter = moment(subjectCert.getNotAfter(), 'YYMMDDHHmmssZ');
      this._logger.debug(
        `Contract Certificate notAfter: ${notAfter.toISOString()}`,
      );
      if (notAfter.isBefore(moment())) {
        return AuthorizeCertificateStatusEnumType.CertificateExpired;
      }

      const ocspUrls = subjectCert.getExtAIAInfo()?.ocsp;
      if (ocspUrls && ocspUrls.length > 0) {
        const ocspRequest = new OCSPRequest({
          reqList: [
            {
              issuerCert: certificatePems[i + 1],
              subjectCert: certificatePems[i],
            },
          ],
        });

        this._logger.debug(`OCSP response URL: ${ocspUrls[0]}`);
        const certStatus = await this._sendOCSPRequest(
          ocspRequest,
          ocspUrls[0],
        );
        if (certStatus === 'revoked') {
          return AuthorizeCertificateStatusEnumType.CertificateRevoked;
        } else if (certStatus !== 'good') {
          return AuthorizeCertificateStatusEnumType.NoCertificateAvailable;
        }
      }
    }

    return AuthorizeCertificateStatusEnumType.Accepted;
  }

  public async validateCertificateHashData(
    ocspRequestData: OCSPRequestDataType[],
  ): Promise<AuthorizeCertificateStatusEnumType> {
    for (const reqData of ocspRequestData) {
      const ocspRequest = new jsrsasign.KJUR.asn1.ocsp.Request({
        alg: reqData.hashAlgorithm,
        keyhash: reqData.issuerKeyHash,
        namehash: reqData.issuerNameHash,
        serial: reqData.serialNumber,
      });

      const certStatus = await this._sendOCSPRequest(
        ocspRequest,
        reqData.responderURL,
      );
      if (certStatus === 'revoked') {
        return AuthorizeCertificateStatusEnumType.CertificateRevoked;
      } else if (certStatus !== 'good') {
        return AuthorizeCertificateStatusEnumType.NoCertificateAvailable;
      }
    }

    return AuthorizeCertificateStatusEnumType.Accepted;
  }

  private async _sendOCSPRequest(
    ocspRequest: OCSPRequest | Request,
    responderURL: string,
  ): Promise<string> {
    const response = await fetch(responderURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ocsp-request',
        Accept: 'application/ocsp-response',
      },
      body: ocspRequest.getEncodedHex(),
    });

    if (!response.ok) {
      this._logger.error(
        `Failed to fetch OCSP response: ${response.status} with error: ${await response.text()}`,
      );
    }

    const ocspResponse = getOCSPResponseInfo(await response.text());
    return ocspResponse.certStatus;
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
      certificateChain += createPemBlock(
        'CERTIFICATE',
        Buffer.from(leafRaw.toSchema().toBER(false)).toString('base64'),
      );
    } else {
      throw new Error(
        `Cannot extract leaf certificate from the pem: ${signedCert}`,
      );
    }

    // Add Chain without Root CA Certificate
    const chainWithoutRoot = this._extractCertificateArrayFromPem(
      caCerts,
    )?.slice(0, -1);
    chainWithoutRoot?.forEach((certItem) => {
      const cert = certItem as Certificate;
      certificateChain += createPemBlock(
        'CERTIFICATE',
        Buffer.from(cert.toSchema().toBER(false)).toString('base64'),
      );
    });

    return certificateChain;
  }

  private _instantiateV2GClient(
    config: SystemConfig,
  ): IV2GCertificateAuthorityClient {
    switch (config.util.certificateAuthority.v2gCA.name) {
      case 'hubject': {
        return new Hubject(config);
      }
      default: {
        throw new Error(
          `Unsupported V2G CA: ${config.util.certificateAuthority.v2gCA.name}`,
        );
      }
    }
  }

  private _instantiateChargingStationClient(
    config: SystemConfig,
    cache: ICache,
    logger?: Logger<ILogObj>,
  ): IChargingStationCertificateAuthorityClient {
    switch (config.util.certificateAuthority.chargingStationCA.name) {
      case 'acme': {
        return new Acme(config, cache, logger);
      }
      default: {
        throw new Error(
          `Unsupported Charging Station CA: ${config.util.certificateAuthority.chargingStationCA.name}`,
        );
      }
    }
  }

  /*
   * Parse the certificate chain pem and extract certificates
   * @param pem - certificate chain pem containing multiple certificate blocks
   * @return array of pkijs.Certificate
   */
  private _parseCertificateChainPem(pem: string): string[] {
    const certs: string[] = [];

    // Split the PEM into individual certificates
    const pemCerts = pem.split('-----END CERTIFICATE-----\n');

    // Parse each certificate
    pemCerts.forEach((pemCert) => {
      certs.push(pemCert + '-----END CERTIFICATE-----\n');
    });

    return certs;
  }

  /**
   * Decode the pem and extract certificates
   * @param pem - base64 encoded certificate chain string without header and footer
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
}
