import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import jsrsasign from 'jsrsasign';
import x509 = jsrsasign.KJUR.asn1.x509;

export const aValidSignedCertificate = (
  updateFunction?: UpdateFunction<x509.Certificate>,
): x509.Certificate => {
  const issuerKeyPair = jsrsasign.KEYUTIL.generateKeypair('EC', 'secp256r1');
  const subjectKeyPair = jsrsasign.KEYUTIL.generateKeypair('EC', 'secp256r1');
  const item = new x509.Certificate({
    version: 3,
    serial: { int: 1 },
    issuer: { str: 'CN=issuer_test' },
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
    ],
    sigalg: 'SHA256withECDSA',
    cakey: issuerKeyPair.prvKeyObj,
  });
  return applyUpdateFunction(item, updateFunction);
};
