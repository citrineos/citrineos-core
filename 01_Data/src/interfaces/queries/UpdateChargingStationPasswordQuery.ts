// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export const UpdateChargingStationPasswordQuerySchema = QuerySchema('UpdateChargingStationPasswordQuerySchema', [['callbackUrl', 'string']]);

export interface UpdateChargingStationPasswordQueryString {
  callbackUrl?: string;
}
