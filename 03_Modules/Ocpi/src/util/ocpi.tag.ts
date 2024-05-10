export enum OcpiTag {
  Tariffs = 'tariffs-controller',
  Credentials = 'credentials-controller',
  ChargingProfiles = 'charging-profiles-controller',
  Cdrs = 'cdrs-controller',
  Locations = 'locations-controller',
  Sessions = 'sessions-controller',
  Tokens = 'tokens-controller',
  Versions = 'versions-controller',
  Commands = 'commands-controller',
}

export const getOcpiTagString = (ocpiTag: OcpiTag) => `ocpi-${ocpiTag}`;
