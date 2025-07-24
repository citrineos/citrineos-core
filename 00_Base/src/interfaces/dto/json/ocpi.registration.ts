// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPIVersionNumber } from '../enum';

export interface ServerProfile {
  credentialsRole: CredentialRole;
  versionDetails: Map<Version, Endpoint[]>;
}

export interface PartnerProfile {
  version: Version;
  serverCredentials: Credentials;
  roles?: CredentialRole[];
  credentials?: Credentials;
  endpoints?: Endpoint[];
}

export interface BusinessDetails {
  name: string;
  website?: string;
  logo?: Image;
}

export interface Image {
  url: string;
  type: string;
  category: string;
  width?: number;
  height?: number;
}

export interface Version {
  version: OCPIVersionNumber;
  versionDetailsUrl?: string;
}

export interface Endpoint {
  identifier: string;
  url: string;
}

export interface CredentialRole {
  role: 'CPO' | 'EMSP' | 'HUB' | 'NAP' | 'NSP' | 'SCSP';
  businessDetails: BusinessDetails;
}

export interface Credentials {
  versionsUrl: string;
  token?: string;
  certificateRef?: string;
}
