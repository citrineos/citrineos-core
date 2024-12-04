// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export interface NetworkProfileQuerystring {
  stationId: string;
}

export const NetworkProfileQuerySchema = QuerySchema('NetworkProfileQuerySchema', [['stationId', 'string']], ['stationId']);

export interface NetworkProfileDeleteQuerystring {
  stationId: string;
  configurationSlot: number[];
}

export const NetworkProfileDeleteQuerySchema = QuerySchema(
  'NetworkProfileDeleteQuerySchema',
  [
    ['stationId', 'string'],
    ['configurationSlot', 'number[]'],
  ],
  ['stationId', 'configurationSlot'],
);
