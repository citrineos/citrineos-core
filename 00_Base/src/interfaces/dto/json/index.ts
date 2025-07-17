// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP1_6, OCPP2_0_1 } from '../../../ocpp/model';

export * from './hours';

export type SampledValue =
  | OCPP2_0_1.SampledValueType
  | OCPP1_6.MeterValuesRequest['meterValue'][number]['sampledValue'][number];
