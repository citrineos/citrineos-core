// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1, SystemConfig } from '@citrineos/base';
import {
  IChargingStationCertificateAuthorityClient,
  IV2GCertificateAuthorityClient,
} from './client/interface';
import { Hubject } from './client/hubject';
import { Acme } from './client/acme';
import { ILogObj, Logger } from 'tslog';
import { Certificate } from 'pkijs';
import jsrsasign, { KJUR, X509 } from 'jsrsasign';
import OCSPRequest = jsrsasign.KJUR.asn1.ocsp.OCSPRequest;
import Request = jsrsasign.KJUR.asn1.ocsp.Request;
import moment from 'moment';
import {
  createPemBlock,
  dateTimeFormat,
  extractCertificateArrayFromEncodedString,
  extractEncodedContentFromCSR,
  parseCertificateChainPem,
  sendOCSPRequest,
} from './CertificateUtil';
import * as pkijs from 'pkijs';
import { Crypto } from '@peculiar/webcrypto';

const cryptoEngine = new pkijs.CryptoEngine({
  crypto: new Crypto(),
});
pkijs.setEngine('crypto', cryptoEngine as pkijs.ICryptoEngine);

export class CertificateAuthorityService {
  private readonly _v2gClient: IV2GCertificateAuthorityClient;
  private readonly _chargingStationClient: IChargingStationCertificateAuthorityClient;
  private readonly _logger: Logger<ILogObj>;

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    chargingStationClient?: IChargingStationCertificateAuthorityClient,
    v2gClient?: IV2GCertificateAuthorityClient,
  ) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._chargingStationClient =
      chargingStationClient || this._instantiateChargingStationClient(config, this._logger);
    this._v2gClient = v2gClient || this._instantiateV2GClient(config);
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
    certificateType?: OCPP2_0_1.CertificateSigningUseEnumType | null,
  ): Promise<string> {
    this._logger.info(
      `Getting certificate chain for certificateType: ${certificateType} and stationId: ${stationId}`,
    );

    switch (certificateType) {
      case OCPP2_0_1.CertificateSigningUseEnumType.V2GCertificate: {
        const signedCert = await this._v2gClient.getSignedCertificate(
          extractEncodedContentFromCSR(csrString),
        );
        const caCerts = await this._v2gClient.getCACertificates();
        return this._createCertificateChainWithoutRootCA(signedCert, caCerts);
      }
      case OCPP2_0_1.CertificateSigningUseEnumType.ChargingStationCertificate: {
        return await this._chargingStationClient.getCertificateChain(csrString);
      }
      default: {
        throw new Error(`Unsupported certificate type: ${certificateType}`);
      }
    }
  }

  async signedSubCaCertificateByExternalCA(csrString: string): Promise<string> {
    return await this._chargingStationClient.signCertificateByExternalCA(csrString);
  }

  async getSignedContractData(iso15118SchemaVersion: string, exiRequest: string): Promise<string> {
    return await this._v2gClient.getSignedContractData(iso15118SchemaVersion, exiRequest);
  }

  async getRootCACertificateFromExternalCA(
    certificateType: OCPP2_0_1.InstallCertificateUseEnumType,
  ): Promise<string> {
    switch (certificateType) {
      case OCPP2_0_1.InstallCertificateUseEnumType.V2GRootCertificate: {
        const caCerts = await this._v2gClient.getCACertificates();
        const rootCACert = extractCertificateArrayFromEncodedString(caCerts).pop();
        if (rootCACert) {
          return createPemBlock(
            'CERTIFICATE',
            Buffer.from(rootCACert.toSchema().toBER(false)).toString('base64'),
          );
        } else {
          throw new Error(`V2GRootCertificate not found from ${caCerts}`);
        }
      }
      case OCPP2_0_1.InstallCertificateUseEnumType.CSMSRootCertificate:
        return await this._chargingStationClient.getRootCACertificate();
      default:
        throw new Error(`Certificate type: ${certificateType} not implemented.`);
    }
  }

  updateSecurityCertChainKeyMap(serverId: string, certificateChain: string, privateKey: string) {
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
  ): Promise<OCPP2_0_1.AuthorizeCertificateStatusEnumType> {
    const certificatePems: string[] = parseCertificateChainPem(certificateChainPem);
    this._logger.debug(`Found ${certificatePems.length} certificates in chain.`);
    if (certificatePems.length < 1) {
      return OCPP2_0_1.AuthorizeCertificateStatusEnumType.NoCertificateAvailable;
    }

    try {
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
        this._logger.error(`Cannot find root certificate for certificate ${lastCertInChain}`);
        return OCPP2_0_1.AuthorizeCertificateStatusEnumType.NoCertificateAvailable;
      } else {
        certificatePems.push(rootCertPem);
      }

      // OCSP validation for each certificate
      for (let i = 0; i < certificatePems.length - 1; i++) {
        const subjectCert = new X509();
        subjectCert.readCertPEM(certificatePems[i]);
        this._logger.debug(`Subject Certificate: ${subjectCert.getInfo()}`);

        const notAfter = moment(subjectCert.getNotAfter(), dateTimeFormat);
        if (notAfter.isBefore(moment())) {
          return OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertificateExpired;
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
          const ocspResponse = KJUR.asn1.ocsp.OCSPUtil.getOCSPResponseInfo(
            await sendOCSPRequest(ocspRequest, ocspUrls[0]),
          );
          const certStatus = ocspResponse.certStatus;
          if (certStatus === 'revoked') {
            return OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertificateRevoked;
          } else if (certStatus !== 'good') {
            return OCPP2_0_1.AuthorizeCertificateStatusEnumType.NoCertificateAvailable;
          }
        } else {
          this._logger.error(`Certificate ${certificatePems[i]} has no OCSP URL.`);
          return OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertChainError;
        }
      }
    } catch (error) {
      this._logger.error(`Failed to validate certificate chain: ${error}`);
      return OCPP2_0_1.AuthorizeCertificateStatusEnumType.NoCertificateAvailable;
    }

    return OCPP2_0_1.AuthorizeCertificateStatusEnumType.Accepted;
  }

  public async validateCertificateHashData(
    ocspRequestData: OCPP2_0_1.OCSPRequestDataType[],
  ): Promise<OCPP2_0_1.AuthorizeCertificateStatusEnumType> {
    for (const reqData of ocspRequestData) {
      const ocspRequest = new Request({
        alg: reqData.hashAlgorithm,
        keyhash: reqData.issuerKeyHash,
        namehash: reqData.issuerNameHash,
        serial: reqData.serialNumber,
      });
      this._logger.debug(`OCSP request: ${JSON.stringify(ocspRequest)}`);

      try {
        const ocspResponse = KJUR.asn1.ocsp.OCSPUtil.getOCSPResponseInfo(
          await sendOCSPRequest(ocspRequest, reqData.responderURL),
        );
        // Cert statuses: good, revoked, unknown
        // source: https://kjur.github.io/jsrsasign/api/symbols/KJUR.asn1.ocsp.OCSPUtil.html#.getOCSPResponseInfo
        const certStatus = ocspResponse.certStatus;
        if (certStatus === 'revoked') {
          return OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertificateRevoked;
        } else if (certStatus !== 'good') {
          return OCPP2_0_1.AuthorizeCertificateStatusEnumType.NoCertificateAvailable;
        }
      } catch (error) {
        this._logger.error(`Failed to fetch OCSP response: ${error}`);
        return OCPP2_0_1.AuthorizeCertificateStatusEnumType.NoCertificateAvailable;
      }
    }

    return OCPP2_0_1.AuthorizeCertificateStatusEnumType.Accepted;
  }

  /**
   * Create a certificate chain including leaf and sub CA certificates except for the root certificate.
   *
   * @param {string} signedCert - The leaf certificate.
   * @param {string} caCerts - CA certificates.
   * @return {string} The certificate chain pem.
   */
  private _createCertificateChainWithoutRootCA(signedCert: string, caCerts: string): string {
    let certificateChain = '';
    // Add Cert
    const leafRaw = extractCertificateArrayFromEncodedString(signedCert)[0];
    if (leafRaw) {
      certificateChain += createPemBlock(
        'CERTIFICATE',
        Buffer.from(leafRaw.toSchema().toBER(false)).toString('base64'),
      );
    } else {
      throw new Error(`Cannot extract leaf certificate from the pem: ${signedCert}`);
    }

    // Add Chain without Root CA Certificate
    const chainWithoutRoot = extractCertificateArrayFromEncodedString(caCerts).slice(0, -1);
    chainWithoutRoot.forEach((certItem) => {
      const cert = certItem as Certificate;
      certificateChain += createPemBlock(
        'CERTIFICATE',
        Buffer.from(cert.toSchema().toBER(false)).toString('base64'),
      );
    });

    return certificateChain;
  }

  private _instantiateV2GClient(config: SystemConfig): IV2GCertificateAuthorityClient {
    switch (config.util.certificateAuthority.v2gCA.name) {
      case 'hubject': {
        return new Hubject(config);
      }
      default: {
        throw new Error(`Unsupported V2G CA: ${config.util.certificateAuthority.v2gCA.name}`);
      }
    }
  }

  private _instantiateChargingStationClient(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
  ): IChargingStationCertificateAuthorityClient {
    switch (config.util.certificateAuthority.chargingStationCA.name) {
      case 'acme': {
        return new Acme(config, logger);
      }
      default: {
        throw new Error(
          `Unsupported Charging Station CA: ${config.util.certificateAuthority.chargingStationCA.name}`,
        );
      }
    }
  }
}
