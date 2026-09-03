// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Constructable } from '@lib/utils/constructable';
import { plainToInstance } from 'class-transformer';

export function generateSearchFilters(values: any, searchableKeys: Set<string>): [] {
  const result = [];
  let filterValue;

  if (values?.search?.length > 0) {
    filterValue = values.search;
  }

  for (const searchableKey of searchableKeys) {
    result.push({
      field: searchableKey,
      operator: 'contains',
      value: filterValue,
    });
  }

  return result as any;
}

export const getPlainToInstanceOptions: any = (dto: Constructable<any>, isSingle = false) =>
  isSingle
    ? {
        select: (data: any) => ({
          ...data,
          data: plainToInstance(dto, data.data),
        }),
      }
    : {
        select: (data: any) => ({
          ...data,
          data: data.data.map((item: any) => plainToInstance(dto, item)),
        }),
      };
