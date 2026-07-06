// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { MeasurandEnumType, MeterValueDto, SampledValue } from '@citrineos/base';
import { MeasurandEnum, OCPP2_0_1 } from '@citrineos/base';

export class MeterValueClass implements Partial<MeterValueDto> {}

// todo share below code with @citrineos/base
const isOverallPhase = (phase: string | undefined | null): boolean =>
  !phase || phase === OCPP2_0_1.PhaseEnumType.N;

const TWO_HOURS = 60 * 60 * 2;

const validContexts = new Set([
  OCPP2_0_1.ReadingContextEnumType.Transaction_Begin,
  OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
  OCPP2_0_1.ReadingContextEnumType.Transaction_End,
]);

export const getTimestampToMeasurandArray = (
  sortedMeterValues: MeterValueDto[],
  measurand: MeasurandEnumType,
  validContextsArg: Set<OCPP2_0_1.ReadingContextEnumType>,
): [number, string][] => {
  if (sortedMeterValues.length === 0) return [];

  const baseTime = new Date(sortedMeterValues[0].timestamp).getTime();
  const result: [number, string][] = [];

  for (const meterValue of sortedMeterValues) {
    if (
      !meterValue.sampledValue[0].context ||
      (typeof meterValue.sampledValue[0].context === 'string' &&
        validContextsArg.has(
          meterValue.sampledValue[0].context as OCPP2_0_1.ReadingContextEnumType,
        ))
    ) {
      const overallValue = findOverallValue(
        meterValue.sampledValue as unknown as SampledValue[],
        measurand,
      );
      if (overallValue) {
        const timestampEpoch = new Date(meterValue.timestamp).getTime();
        const elapsedTime = (timestampEpoch - baseTime) / 1000;
        if (elapsedTime > TWO_HOURS) {
          // skip weird data // todo is needed?
          console.warn(
            `Skipping data for ${elapsedTime} seconds, more than 2 hours from base time`,
          );
          continue;
        }
        const normalizedValue = normalizeValue(overallValue);
        if (normalizedValue !== null) {
          result.push([elapsedTime, normalizedValue]);
        }
      }
    }
  }

  return result;
};

// Measurands that are physically additive across phases (P_total = P_L1+P_L2+P_L3,
// E_total = E_L1+E_L2+E_L3). All other measurands (Voltage, Current.*, Frequency,
// Temperature, Power.Factor, SoC, RPM) are per-phase or scalar quantities and must
// be averaged across reported phases, never summed — summing per-phase voltages
// (e.g. 230+230+230) yields meaningless inflated readings.
const isAdditiveMeasurand = (measurand: MeasurandEnumType): boolean => {
  if (measurand.startsWith('Energy.')) return true;
  if (measurand === 'Power.Active.Import' || measurand === 'Power.Active.Export') return true;
  if (measurand === 'Power.Reactive.Import' || measurand === 'Power.Reactive.Export') return true;
  if (measurand === 'Power.Offered') return true;
  // Power.Factor is a ratio, not additive.
  return false;
};

export const findOverallValue = (
  sampledValues: SampledValue[],
  measurand: MeasurandEnumType,
): SampledValue | undefined => {
  const measurandSampledValues = sampledValues.filter(
    (sv) =>
      sv.measurand === measurand ||
      (!sv.measurand && // Measurand defaults to Energy.Active.Import.Register
        measurand === MeasurandEnum['Energy.Active.Import.Register']),
  );
  if (measurandSampledValues.length === 0) {
    return undefined;
  }
  let overallSampledValue = measurandSampledValues.find((sv) => isOverallPhase(sv.phase));
  if (!overallSampledValue) {
    // No overall (phase=N or no phase) reported. Aggregate per-phase rows.
    // Accept ANY subset of L1/L2/L3: single-phase chargers report only L1, and
    // some DC chargers (vendor quirk) tag V/A/W with bare "L1" instead of "N".
    const perPhaseTags = new Set<string>([
      OCPP2_0_1.PhaseEnumType.L1,
      OCPP2_0_1.PhaseEnumType.L2,
      OCPP2_0_1.PhaseEnumType.L3,
    ]);
    const perPhaseSampledValues = measurandSampledValues.filter(
      (sv) => sv.phase && perPhaseTags.has(sv.phase),
    );
    if (perPhaseSampledValues.length === 0) {
      return undefined; // No per-phase data either; nothing to aggregate.
    }
    const sumOfPhases = perPhaseSampledValues.reduce((acc, sv) => acc + Number(sv.value), 0);
    const aggregatedValue = isAdditiveMeasurand(measurand)
      ? sumOfPhases
      : sumOfPhases / perPhaseSampledValues.length;
    overallSampledValue = {
      ...perPhaseSampledValues[0],
      value: aggregatedValue,
      phase: null,
    };
  }
  return overallSampledValue;
};

export const normalizeValue = (overallValue: SampledValue): string | null => {
  let powerOfTen = overallValue.unitOfMeasure?.multiplier ?? 0;
  const unit = overallValue.unitOfMeasure?.unit?.toUpperCase();

  if (unit === undefined || unit === 'WH' || unit === 'W') {
    powerOfTen -= 3;
  } else if (unit === 'PERCENT') {
    powerOfTen -= 2;
  }

  return (overallValue.value * 10 ** powerOfTen).toFixed(2);
};
