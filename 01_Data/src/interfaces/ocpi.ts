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

export interface VersionEndpoint {
  identifier: string;
  url: string;
  role: 'SENDER' | 'RECEIVER';
}

export interface CredentialRole {
  role: 'CPO' | 'EMSP' | 'HUB' | 'NAP' | 'NSP' | 'SCSP';
  business_details?: BusinessDetails;
  party_id: string;
  country_code: string;
}

export interface Credentials {
  token: string;
  url: string;
  roles: CredentialRole[];
}
