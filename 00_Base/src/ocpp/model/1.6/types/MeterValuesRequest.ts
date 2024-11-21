// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { OcppRequest } from '../../../..';

export interface MeterValuesRequest extends OcppRequest {
  connectorId: number;
  transactionId?: number | null;
  meterValue: {
    timestamp: string;
    sampledValue: {
      value: string;
      context?: Context | null;
      format?: Format | null;
      measurand?: Measurand | null;
      phase?: Phase | null;
      location?: Location | null;
      unit?: Unit | null;
    }[];
  }[];
}