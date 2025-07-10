export interface ICertificateDto {
  id: number;
  serialNumber: number;
  issuerName: string;
  organizationName: string;
  commonName: string;
  keyLength: number | null;
  signatureAlgorithm: SignatureAlgorithmEnumType | null;
  countryName: CountryNameEnumType | null;
  isCA: boolean | null;
  pathLen: number | null;
  certificateFileId: string | null;
  privateKeyFileId: string | null;
  signedBy: string | null;
  validBefore: any;
}

export interface INewCertificateRequestDto {
  keyLength?: number;
  organizationName: string;
  commonName: string;
  filePath?: string;
  selfSigned: boolean;
  countryName?: CountryNameEnumType;
  signatureAlgorithm?: SignatureAlgorithmEnumType;
  pathLen?: number;
  validBefore: any;
}

export enum SignatureAlgorithmEnumType {
  RSA = 'SHA256withRSA',
  ECDSA = 'SHA256withECDSA',
}

export enum CountryNameEnumType {
  US = 'US',
}

export enum CertificateDtoProps {
  id = 'id',
  serialNumber = 'serialNumber',
  issuerName = 'issuerName',
  organizationName = 'organizationName',
  commonName = 'commonName',
  keyLength = 'keyLength',
  validBefore = 'validBefore',
  signatureAlgorithm = 'signatureAlgorithm',
  countryName = 'countryName',
  isCA = 'isCA',
  pathLen = 'pathLen',
  certificateFileId = 'certificateFileId',
  privateKeyFileId = 'privateKeyFileId',
  signedBy = 'signedBy',
}
