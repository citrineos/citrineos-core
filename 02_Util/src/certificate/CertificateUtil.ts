// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import * as pkijs from 'pkijs';
import * as asn1js from 'asn1js';
import forge from 'node-forge';
import { Certificate } from '@citrineos/data';

export function createPemBlock(type: string, content: string) {
  return `-----BEGIN ${type}-----\n${content}\n-----END ${type}-----\n`;
}

/*
 * Parse the certificate chain and extract certificates
 * @param pem - certificate chain pem containing multiple certificate blocks
 * @return array of pkijs.Certificate
 */
export function parseCertificateChainPem(pem: string): string[] {
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
export function extractCertificateArrayFromPem(
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
export function extractEncodedContentFromCSR(csrPem: string): string {
  return csrPem
    .replace(/-----BEGIN CERTIFICATE REQUEST-----/, '')
    .replace(/-----END CERTIFICATE REQUEST-----/, '')
    .replace(/\n/g, '');
}

/**
 * Generate a serial number without leading 0s.
 */
export function generateSerialNumber(): string {
  const hexString = forge.util.bytesToHex(forge.random.getBytesSync(20));
  return hexString.replace(/^0+/, '');
}

/**
 * Generate certificate and its private key
 *
 * @param certificateEntity - the certificate
 * @param isCA - true if the certificate is a root or sub CA certificate
 * @param issuerKeyPem - the issuer private key
 * @param issuerCertPem - the issuer certificate
 * @param pathLenConstraint - A pathLenConstraint of zero indicates that no intermediate CA certificates may
 * follow in a valid certification path. Where it appears, the pathLenConstraint field MUST be greater than or
 * equal to zero. Where pathLenConstraint does not appear, no limit is imposed.
 * Reference: https://www.rfc-editor.org/rfc/rfc5280#section-4.2.1.9
 *
 * @return generated certificate and its private key
 */
export function generateCertificate(
  certificateEntity: Certificate,
  isCA: boolean,
  pathLenConstraint?: number,
  issuerKeyPem?: string,
  issuerCertPem?: string,
): [string, string] {
  // create key pair
  const keyPair = forge.pki.rsa.generateKeyPair({
    bits: certificateEntity.keyLength,
  });

  // create certificate
  const certificate = forge.pki.createCertificate();
  certificate.publicKey = keyPair.publicKey;
  certificate.serialNumber = certificateEntity.serialNumber;
  certificate.validity.notBefore = new Date();
  if (certificateEntity.validBefore) {
    certificate.validity.notAfter = new Date(
      Date.parse(certificateEntity.validBefore),
    );
  } else {
    certificate.validity.notAfter = new Date();
    certificate.validity.notAfter.setFullYear(
      certificate.validity.notAfter.getFullYear() + 1,
    );
  }

  // set subject
  const attrs = [
    {
      name: 'commonName',
      value: certificateEntity.commonName,
    },
    { name: 'organizationName', value: certificateEntity.organizationName },
  ];
  certificate.setSubject(attrs);

  // set issuer
  if (issuerCertPem) {
    certificate.setIssuer(
      forge.pki.certificateFromPem(issuerCertPem).subject.attributes,
    );
  } else {
    certificate.setIssuer(attrs);
  }

  // set extensions
  const basicConstraints: any = {
    name: 'basicConstraints',
    cA: isCA,
  };
  if (pathLenConstraint) {
    basicConstraints.pathLenConstraint = pathLenConstraint;
  }
  const extensions: any[] = [
    basicConstraints,
    {
      name: 'keyUsage',
      critical: true,
      keyCertSign: true,
      digitalSignature: true,
      crlSign: true,
      keyEncipherment: !isCA,
    },
    {
      name: 'subjectKeyIdentifier',
    },
  ];
  if (issuerCertPem) {
    extensions.push({
      name: 'authorityKeyIdentifier',
      keyIdentifier: forge.pki
        .certificateFromPem(issuerCertPem)
        .generateSubjectKeyIdentifier()
        .getBytes(),
    });
  }
  certificate.setExtensions(extensions);

  // sign
  if (issuerKeyPem) {
    certificate.sign(
      forge.pki.privateKeyFromPem(issuerKeyPem),
      forge.md.sha256.create(),
    );
  } else {
    certificate.sign(keyPair.privateKey, forge.md.sha256.create());
  }

  return [
    forge.pki.certificateToPem(certificate),
    forge.pki.privateKeyToPem(keyPair.privateKey),
  ];
}

/**
 * Retrieves sub CA certificate for signing from the provided certificate chain PEM string.
 * The chain is in order: leaf cert, sub CA n ... sub CA 1
 *
 * @param {string} certChainPem - The PEM string containing the ordered CA certificates.
 * @return {string} The sub CA certificate which is used for signing.
 */
export function getSubCAForSigning(certChainPem: string): string {
  const certsArray: string[] = certChainPem
    .split('-----END CERTIFICATE-----')
    .filter((cert) => cert.trim().length > 0);

  if (certsArray.length < 2) {
    // no certificate or only one leaf certificate
    throw new Error('Sub CA certificate for signing not found');
  }

  // Remove leading new line and add "-----END CERTIFICATE-----" back because split removes it
  return certsArray[1].replace(/^\n+/, '').concat('-----END CERTIFICATE-----');
}

/**
 * Create a signed certificate for the provided CSR using the sub CA certificate, and its private key.
 *
 * @param {forge.pki.CertificateSigningRequest} csr - The CSR that need to be signed.
 * @param {forge.pki.Certificate} caCert - The sub CA certificate.
 * @param {forge.pki.rsa.PrivateKey} caPrivateKey - The private key of the sub CA certificate.
 * @return {forge.pki.Certificate} The signed certificate.
 */
export function createSignedCertificateFromCSR(
  csr: forge.pki.CertificateSigningRequest,
  caCert: forge.pki.Certificate,
  caPrivateKey: forge.pki.rsa.PrivateKey,
): forge.pki.Certificate {
  // Create the certificate
  const certificate: forge.pki.Certificate = forge.pki.createCertificate();
  certificate.publicKey = csr.publicKey as forge.pki.rsa.PublicKey;
  certificate.serialNumber = generateSerialNumber(); // Unique serial number for the certificate
  certificate.validity.notBefore = new Date();
  certificate.validity.notAfter = caCert.validity.notAfter;
  certificate.setIssuer(caCert.subject.attributes); // Set CA's attributes as issuer
  certificate.setSubject(csr.subject.attributes);
  certificate.setExtensions([
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'keyUsage',
      critical: true,
      digitalSignature: true,
      keyEncipherment: true,
    },
    {
      name: 'subjectKeyIdentifier',
    },
    {
      name: 'authorityKeyIdentifier',
      keyIdentifier: caCert.generateSubjectKeyIdentifier().getBytes(),
    },
  ]);

  // Sign the certificate
  certificate.sign(caPrivateKey);

  return certificate;
}
