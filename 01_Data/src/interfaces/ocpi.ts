export interface BusinessDetails {
  name: string;
  website?: string;
  logo?: Image;
}

export interface Image {
  url: string;
  category?: string;
  type?: string;
  width?: number;
  height?: number;
}

export interface Version {
  version: string;
  url: string;
}

export interface Endpoint {
  module: string;
  url: string;
  roles: string[];
}

export interface CredentialRole {
  role: 'CPO' | 'EMSP' | 'HUB' | 'NAP' | 'NSP' | 'SCSP';
  business_details?: BusinessDetails;
}

export interface Credentials {
  token?: string;
  connectionUrl?: string;
  certificateRef?: string;
}
