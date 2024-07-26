// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export const TariffQuerySchema = QuerySchema([['id', 'string']]);

export interface TariffQueryString {
  id?: string;
}
