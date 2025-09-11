// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

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
