import { AuthenticationOptions } from '@citrineos/base';

export function anAuthenticationOptions(
  override?: Partial<AuthenticationOptions>,
): AuthenticationOptions {
  return {
    securityProfile: 2,
    allowUnknownChargingStations: false,
    ...override,
  };
}
