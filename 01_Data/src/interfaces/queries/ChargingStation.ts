// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export interface ChargingStationKeyQuerystring {
  stationId: string;
}

export const ChargingStationKeyQuerySchema = QuerySchema('ChargingStationKeyQuerySchema', [['stationId', 'string']], ['stationId']);
