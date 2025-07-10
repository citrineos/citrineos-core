import { IBaseDto } from '../..';

export interface IInstalledCertificateDto extends IBaseDto {
  id?: number;
  stationId: string;
  hashAlgorithm: any;
  issuerNameHash: string;
  issuerKeyHash: string;
  serialNumber: string;
  certificateType: any;
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
