import { IBaseDto } from './base.dto.js';

export interface IServerNetworkProfileDto extends IBaseDto {
  id: string;
  host: string;
  port: number;
  pingInterval: number;
  protocol: string;
  messageTimeout: number;
  securityProfile: number;
  allowUnknownChargingStations: boolean;
  tlsKeyFilePath?: string;
  tlsCertificateChainFilePath?: string;
  mtlsCertificateAuthorityKeyFilePath?: string;
  rootCACertificateFilePath?: string;
}

export enum ServerNetworkProfileDtoProps {
  id = 'id',
  host = 'host',
  port = 'port',
  pingInterval = 'pingInterval',
  protocol = 'protocol',
  messageTimeout = 'messageTimeout',
  securityProfile = 'securityProfile',
  allowUnknownChargingStations = 'allowUnknownChargingStations',
  tlsKeyFilePath = 'tlsKeyFilePath',
  tlsCertificateChainFilePath = 'tlsCertificateChainFilePath',
  mtlsCertificateAuthorityKeyFilePath = 'mtlsCertificateAuthorityKeyFilePath',
  rootCACertificateFilePath = 'rootCACertificateFilePath',
}
