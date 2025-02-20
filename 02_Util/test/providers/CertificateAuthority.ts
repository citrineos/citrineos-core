import * as asn1js from 'asn1js';
import { CertificateSetItem } from 'pkijs';
import * as pkijs from 'pkijs';
import jsrsasign from 'jsrsasign';
import X509 = jsrsasign.X509;
import x509 = jsrsasign.KJUR.asn1.x509;

export const aValidCertificateItemArray = (pem: string): CertificateSetItem[] => {
  const cmsSignedBuffer = Buffer.from(pem, 'base64');
  const asn1 = asn1js.fromBER(cmsSignedBuffer);
  const cmsContent = new pkijs.ContentInfo({ schema: asn1.result });
  const cmsSigned = new pkijs.SignedData({ schema: cmsContent.content });
  return cmsSigned.certificates ?? [];
};

export const aValidSignedCertificateWithOCSPInfo = (
  url: string,
  issuerCertPem: string,
  issuerKeyPem: string,
): x509.Certificate => {
  const issuerCertificate = new X509();
  issuerCertificate.readCertPEM(issuerCertPem);

  const subjectKeyPair = jsrsasign.KEYUTIL.generateKeypair('EC', 'secp256r1');
  return new x509.Certificate({
    version: 3,
    serial: { int: 1 },
    issuer: { str: issuerCertificate.getSubjectString() },
    subject: { str: 'CN=subject_test' },
    notbefore: '240815000000Z',
    notafter: '340815000000Z',
    sbjpubkey: subjectKeyPair.pubKeyObj,
    ext: [
      { extname: 'basicConstraints', cA: false },
      {
        extname: 'keyUsage',
        critical: true,
        names: ['digitalSignature', 'keyEncipherment'],
      },
      {
        extname: 'subjectKeyIdentifier',
        kid: jsrsasign.KEYUTIL.getPEM(subjectKeyPair.pubKeyObj),
      },
      {
        extname: 'authorityKeyIdentifier',
        kid: issuerCertPem,
        isscert: issuerCertPem,
      },
      {
        extname: 'authorityInfoAccess',
        critical: true,
        array: [{ ocsp: url }, { caissuer: 'https://example.com/a.crt' }],
      },
    ],
    sigalg: 'SHA256withECDSA',
    cakey: issuerKeyPem,
  });
};
