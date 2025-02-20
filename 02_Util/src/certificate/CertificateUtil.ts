// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import * as pkijs from 'pkijs';
import * as asn1js from 'asn1js';
import { Certificate, SignatureAlgorithmEnumType } from '@citrineos/data';
import jsrsasign from 'jsrsasign';
import KJUR = jsrsasign.KJUR;
import OCSPRequest = jsrsasign.KJUR.asn1.ocsp.OCSPRequest;
import Request = jsrsasign.KJUR.asn1.ocsp.Request;
import X509 = jsrsasign.X509;
import { CertificationRequest } from 'pkijs';
import { fromBase64, stringToArrayBuffer } from 'pvutils';
import { fromBER } from 'asn1js';
import moment from 'moment';
import { ILogObj, Logger } from 'tslog';
import KEYUTIL = jsrsasign.KEYUTIL;

export const dateTimeFormat = 'YYMMDDHHmmssZ';

export function getValidityTimeString(time: moment.Moment) {
  return time.utc().format('YYMMDDHHmmss').concat('Z');
}

export function createPemBlock(type: string, content: string) {
  return `-----BEGIN ${type}-----\n${content}\n-----END ${type}-----\n`;
}

/*
 * Parse the certificate chain and extract certificates
 * @param pem - certificate chain pem containing multiple certificate blocks
 * @return array of certificate pem blocks
 */
export function parseCertificateChainPem(pem: string): string[] {
  const certs: string[] = [];
  pem
    .match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g)
    ?.forEach((certPem) => certs.push(certPem));
  return certs;
}

/**
 * Decode the pem and extract certificates
 * @param pem - base64 encoded certificate chain string without header and footer
 * @return array of pkijs.CertificateSetItem
 */
export function extractCertificateArrayFromEncodedString(pem: string): pkijs.CertificateSetItem[] {
  try {
    const cmsSignedBuffer = Buffer.from(pem, 'base64');
    const asn1 = asn1js.fromBER(cmsSignedBuffer);
    const cmsContent = new pkijs.ContentInfo({ schema: asn1.result });
    const cmsSigned = new pkijs.SignedData({ schema: cmsContent.content });
    if (cmsSigned.certificates && cmsSigned.certificates.length > 0) {
      return cmsSigned.certificates;
    } else {
      return [];
    }
  } catch (e) {
    throw new Error(`Failed to extract certificate ${pem} due to ${e}`);
  }
}

/**
 * extracts the base64-encoded content from a pem encoded csr
 * @param csrPem
 * @private
 * @return {string} The parsed CSR or the original CSR if it cannot be parsed
 */
export function extractEncodedContentFromCSR(csrPem: string): string {
  return csrPem
    .replace(/-----BEGIN CERTIFICATE REQUEST-----/, '')
    .replace(/-----END CERTIFICATE REQUEST-----/, '')
    .replace(/\n/g, '');
}

/**
 * Generate certificate and its private key
 *
 * @param certificateEntity - the certificate
 * @param logger - the logger
 * @param issuerKeyPem - the issuer private key
 * @param issuerCertPem - the issuer certificate
 *
 * @return generated certificate pem and its private key pem
 */
export function generateCertificate(
  certificateEntity: Certificate,
  logger: Logger<ILogObj>,
  issuerKeyPem?: string,
  issuerCertPem?: string,
): [string, string] {
  // Generate a key pair
  let keyPair;
  logger.debug(`Private key signAlgorithm: ${certificateEntity.signatureAlgorithm}`);
  if (certificateEntity.signatureAlgorithm === SignatureAlgorithmEnumType.RSA) {
    keyPair = jsrsasign.KEYUTIL.generateKeypair(
      'RSA',
      certificateEntity.keyLength ? certificateEntity.keyLength : 2048,
    );
  } else {
    keyPair = jsrsasign.KEYUTIL.generateKeypair('EC', 'secp256r1');
  }
  const privateKeyPem = jsrsasign.KEYUTIL.getPEM(keyPair.prvKeyObj, 'PKCS8PRV');
  const publicKeyPem = jsrsasign.KEYUTIL.getPEM(keyPair.pubKeyObj);
  logger.debug(`Created publicKeyPem: ${publicKeyPem}`);

  let issuerCertObj: X509 | undefined;
  if (issuerCertPem) {
    issuerCertObj = new X509();
    issuerCertObj.readCertPEM(issuerCertPem);
  }

  // Prepare certificate attributes
  let subjectNotAfter = certificateEntity.validBefore
    ? moment(certificateEntity.validBefore)
    : moment().add(1, 'year');
  const subjectString = `/CN=${certificateEntity.commonName}/O=${certificateEntity.organizationName}/C=${certificateEntity.countryName}`;
  let issuerParam = { str: subjectString };
  if (issuerCertObj) {
    const issuerNotAfter = moment(issuerCertObj.getNotAfter(), dateTimeFormat);
    if (subjectNotAfter.isAfter(issuerNotAfter)) {
      subjectNotAfter = issuerNotAfter;
    }
    issuerParam = { str: issuerCertObj.getSubjectString() };
  }

  // Prepare certificate extensions
  const keyUsages = ['digitalSignature', 'keyCertSign', 'crlSign'];
  if (!certificateEntity.isCA) {
    keyUsages.push('keyEncipherment');
  }
  let basicConstraints: any = {
    extname: 'basicConstraints',
    critical: true,
    cA: certificateEntity.isCA,
  };
  if (certificateEntity.pathLen) {
    basicConstraints = {
      extname: 'basicConstraints',
      cA: certificateEntity.isCA,
      pathLen: certificateEntity.pathLen,
    };
  }
  const extensions = [
    basicConstraints,
    { extname: 'keyUsage', critical: true, names: keyUsages },
    { extname: 'subjectKeyIdentifier', kid: publicKeyPem },
  ];
  if (issuerCertObj) {
    extensions.push({
      extname: 'authorityKeyIdentifier',
      kid: issuerCertPem,
      isscert: issuerCertPem,
    });
  }

  // Prepare certificate sign parameters
  const signAlgorithm =
    certificateEntity.signatureAlgorithm === SignatureAlgorithmEnumType.RSA
      ? SignatureAlgorithmEnumType.RSA
      : SignatureAlgorithmEnumType.ECDSA;
  logger.debug(`Certificate SignAlgorithm: ${signAlgorithm}`);
  const caKey = issuerKeyPem ? issuerKeyPem : privateKeyPem;

  // Generate certificate
  const certificate: KJUR.asn1.x509.Certificate = new KJUR.asn1.x509.Certificate({
    version: 3,
    serial: { int: moment().valueOf() },
    notbefore: getValidityTimeString(moment()),
    notafter: getValidityTimeString(subjectNotAfter),
    issuer: issuerParam,
    subject: { str: subjectString },
    sbjpubkey: keyPair.pubKeyObj,
    ext: extensions,
    sigalg: signAlgorithm,
    cakey: caKey,
  });

  return [certificate.getPEM(), privateKeyPem];
}

/**
 * Create a signed certificate for the provided CSR using the issuer certificate, and its private key.
 *
 * @param csrPem - The CSR that need to be signed.
 * @param issuerCertPem - The issuer certificate.
 * @param issuerPrivateKeyPem - The issuer private key.
 * @return {KJUR.asn1.x509.Certificate} The signed certificate.
 */
export function createSignedCertificateFromCSR(
  csrPem: string,
  issuerCertPem: string,
  issuerPrivateKeyPem: string,
): KJUR.asn1.x509.Certificate {
  const csrObj: KJUR.asn1.csr.ParamResponse = jsrsasign.KJUR.asn1.csr.CSRUtil.getParam(csrPem);
  const issuerCertObj = new X509();
  issuerCertObj.readCertPEM(issuerCertPem);

  let subjectNotAfter = moment().add(1, 'year');
  const issuerNotAfter = moment(issuerCertObj.getNotAfter(), dateTimeFormat);
  if (subjectNotAfter.isAfter(issuerNotAfter)) {
    subjectNotAfter = issuerNotAfter;
  }

  let extensions: any[];
  if (csrObj.extreq) {
    extensions = csrObj.extreq;
  } else {
    extensions = [
      { extname: 'basicConstraints', cA: false },
      {
        extname: 'keyUsage',
        critical: true,
        names: ['digitalSignature', 'keyEncipherment'],
      },
    ];
  }
  extensions.push({ extname: 'subjectKeyIdentifier', kid: csrObj.sbjpubkey });
  extensions.push({
    extname: 'authorityKeyIdentifier',
    kid: issuerCertPem,
    isscert: issuerCertPem,
  });

  return new KJUR.asn1.x509.Certificate({
    version: 3,
    serial: { int: moment().valueOf() },
    issuer: { str: issuerCertObj.getSubjectString() },
    subject: { str: csrObj.subject.str },
    notbefore: getValidityTimeString(moment()),
    notafter: getValidityTimeString(subjectNotAfter),
    sbjpubkey: csrObj.sbjpubkey,
    ext: extensions,
    sigalg: csrObj.sigalg,
    cakey: issuerPrivateKeyPem,
  });
}

export async function sendOCSPRequest(
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
    throw new Error(
      `Failed to fetch OCSP response from ${responderURL}: ${response.status} with error: ${await response.text()}`,
    );
  }

  return await response.text();
}

export function parseCSRForVerification(csrPem: string): CertificationRequest {
  const certificateBuffer = stringToArrayBuffer(fromBase64(extractEncodedContentFromCSR(csrPem)));
  const asn1 = fromBER(certificateBuffer);
  return new CertificationRequest({ schema: asn1.result });
}

export function generateCSR(certificate: Certificate): [string, string] {
  let keyPair;
  if (certificate.signatureAlgorithm === SignatureAlgorithmEnumType.RSA) {
    keyPair = KEYUTIL.generateKeypair('RSA', certificate.keyLength ? certificate.keyLength : 2048);
  } else {
    keyPair = KEYUTIL.generateKeypair('EC', 'secp256r1');
  }
  const privateKeyPem = jsrsasign.KEYUTIL.getPEM(keyPair.prvKeyObj, 'PKCS8PRV');
  const publicKeyPem = jsrsasign.KEYUTIL.getPEM(keyPair.pubKeyObj);

  let basicConstraintParam: any;
  if (certificate.pathLen) {
    basicConstraintParam = {
      cA: certificate.isCA,
      pathLen: certificate.pathLen,
    };
  } else {
    basicConstraintParam = { cA: certificate.isCA };
  }
  const csr = new KJUR.asn1.csr.CertificationRequest({
    subject: {
      str: `/CN=${certificate.commonName}/O=${certificate.organizationName}/C=${certificate.countryName}`,
    },
    sbjpubkey: publicKeyPem,
    extreq: [
      { extname: 'basicConstraints', array: [basicConstraintParam] },
      {
        extname: 'keyUsage',
        array: [
          {
            names: ['digitalSignature', 'keyEncipherment', 'keyCertSign', 'crlSign'],
          },
        ],
      },
    ],
    sigalg: certificate.signatureAlgorithm
      ? certificate.signatureAlgorithm
      : SignatureAlgorithmEnumType.ECDSA,
    sbjprvkey: privateKeyPem,
  });

  return [csr.getPEM(), privateKeyPem];
}
