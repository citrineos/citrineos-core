export interface IInstalledCertificateDto {
  id: number;
  stationId: string;
  hashAlgorithm: string;
  issuerNameHash: string;
  issuerKeyHash: string;
  serialNumber: string;
  certificateType: string;
}
export enum InstalledCertificateDtoProps {
  id = 'id',
  stationId = 'stationId',
  hashAlgorithm = 'hashAlgorithm',
  issuerNameHash = 'issuerNameHash',
  issuerKeyHash = 'issuerKeyHash',
  serialNumber = 'serialNumber',
  certificateType = 'certificateType',
}
