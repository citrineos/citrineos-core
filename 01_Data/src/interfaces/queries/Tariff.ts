// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export const TariffQuerySchema = QuerySchema([
  ['stationId', 'string'],
  ['unit', 'string'],
  ['id', 'string'],
]);

export interface TariffQueryString {
  stationId?: string;
  unit?: string;
  id?: string;
}

export const CreateOrUpdateTariffQuerySchema = QuerySchema([['stationId', 'string']], ['stationId']);
