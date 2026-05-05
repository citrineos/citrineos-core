// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MeterValueType } from '@dto/shared/meter-value.dto';
import { MeterValue16Type } from '@dto/shared/meter-value-16.dto';
import { SampledValueType } from '@dto/shared/sampled-value.dto';
import { NewMeterValueRow } from '@entities/meter-value.entity';

/**
 * Maps OCPP `MeterValueType` (a single timestamped sample bundle) into
 * `MeterValues` rows. Mirrors `core/src/dal/layers/sequelize/model/TransactionEvent/MeterValue.ts`.
 *
 * The wire shape is one envelope with N `sampledValue[]`; we store it
 * 1-to-1 (one row per envelope) with `sampledValues` as JSONB so the
 * full structure (measurand / phase / unitOfMeasure / context) is
 * preserved without exploding into extra tables — matches legacy.
 */
export class MeterValueMapper {
  /** OCPP 2.0.1 / 2.1 MeterValues request item → row. */
  static fromMeterValueType(
    _stationId: string,
    tenantId: number,
    transactionId: string | null,
    mv: MeterValueType,
  ): NewMeterValueRow {
    return {
      tenantId,
      transactionId,
      sampledValue: mv.sampledValue,
      timestamp: new Date(mv.timestamp),
    };
  }

  /** Bulk: an array of envelopes from a single MeterValues request. */
  static fromMeterValuesRequest(
    stationId: string,
    tenantId: number,
    transactionId: string | null,
    meterValues: MeterValueType[],
  ): NewMeterValueRow[] {
    return meterValues.map((mv) =>
      MeterValueMapper.fromMeterValueType(stationId, tenantId, transactionId, mv),
    );
  }

  /**
   * Convert OCPP 1.6 MeterValue envelopes into the same row shape used
   * by 2.0.1. The only structural delta is the SampledValue's `value`
   * (string in 1.6, number in 2.0.1); we parse to number so the
   * downstream `computeTotalKwh` can treat them uniformly.
   */
  static fromMeterValues16Request(
    stationId: string,
    tenantId: number,
    transactionId: string | null,
    meterValues: MeterValue16Type[],
  ): NewMeterValueRow[] {
    return meterValues.map((mv) => ({
      tenantId,
      transactionId,
      timestamp: new Date(mv.timestamp),
      sampledValue: mv.sampledValue.map(MeterValueMapper.normalizeSampledValue16),
    }));
  }

  private static normalizeSampledValue16(
    s: MeterValue16Type['sampledValue'][number],
  ): SampledValueType {
    return {
      value: Number(s.value),
      context: s.context,
      measurand: s.measurand,
      phase: s.phase,
      location: s.location,
      unit: s.unit,
    };
  }
}
