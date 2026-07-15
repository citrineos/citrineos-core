// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_0_1 } from '@citrineos/base';

export function aSecurityEventNotificationRequest(
  override?: Partial<OCPP2_0_1.SecurityEventNotificationRequest>,
): OCPP2_0_1.SecurityEventNotificationRequest {
  return {
    type: 'SettingSystemTime',
    timestamp: new Date().toISOString(),
    ...override,
  };
}
