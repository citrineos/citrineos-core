// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { MeterValueDto } from '../interfaces/dto/meter.value.dto.js';
import {
  MeasurandEnum,
  PhaseEnum,
  ReadingContextEnum,
  type MeasurandEnumType,
  type ReadingContextEnumType,
} from '../interfaces/dto/types/enums.js';
import type { SampledValue } from '../interfaces/dto/types/sampled.value.dto.js';

export class MeterValueUtils {
  private static readonly validContexts = new Set<ReadingContextEnumType>([
    ReadingContextEnum['Transaction.Begin'],
    ReadingContextEnum['Sample.Periodic'],
    ReadingContextEnum['Transaction.End'],
  ]);

  /**
   * Calculate the total Kwh
   *
   * @param {array} meterValues - meterValues of a transaction.
   * @return {number} total Kwh based on the best available energy measurement.
   */
  public static getTotalKwh(
    meterValues: MeterValueDto[],
    currentTotal: number,
    meterStart?: number,
  ): number {
    const filteredValues = this.filterValidMeterValues(meterValues);
    if (filteredValues.length === 0) {
      return 0;
    }

    const registerMap = this.getRegisterValuesMap(filteredValues);
    if (registerMap.size > 0) {
      const sorted = this.getSortedKwhByTimestampAscending(registerMap);
      if (meterStart === undefined) {
        return sorted[sorted.length - 1] - sorted[0];
      }
      return sorted[sorted.length - 1] - meterStart;
    }

    const intervalMap = this.getIntervalValuesMap(filteredValues);
    if (intervalMap.size > 0) {
      const sorted = this.getSortedKwhByTimestampAscending(intervalMap);
      return sorted.reduce((sum, v) => sum + v, currentTotal);
    }

    const netMap = this.getNetValuesMap(filteredValues);
    if (netMap.size > 0) {
      const latestTimestamp = Math.max(...Array.from(netMap.keys()));
      return netMap.get(latestTimestamp)!;
    }

    return 0;
  }

  public static getMeterStart(meterValues: MeterValueDto[]): number | null {
    const filteredValues = this.filterValidMeterValues(meterValues);
    if (filteredValues.length === 0) {
      return null;
    }

    const registerMap = this.getRegisterValuesMap(filteredValues);
    if (registerMap.size > 0) {
      const sorted = this.getSortedKwhByTimestampAscending(registerMap);
      return sorted[0];
    }

    return null;
  }

  /**
   * Filter out meter values whose context is not one of the valid reading contexts.
   * @param meterValues Array of MeterValueType to filter.
   * @returns Filtered array containing only meter values in Transaction_Begin, Sample_Periodic or Transaction_End contexts.
   */
  private static filterValidMeterValues(meterValues: MeterValueDto[]): MeterValueDto[] {
    return meterValues.filter(
      (mv) =>
        // When missing, context is by default Sample_Periodic by spec
        !mv.sampledValue[0].context || this.validContexts.has(mv.sampledValue[0].context),
    );
  }

  /**
   * Extracts Energy.Active.Import.Register measurand values into a timestamp-to-kWh map.
   * @param meterValues Array of MeterValueType to search for register readings.
   * @returns Map where each key is the reading timestamp (ms since epoch) and each value is the normalized kWh.
   */
  private static getRegisterValuesMap(meterValues: MeterValueDto[]): Map<number, number> {
    const valuesMap = new Map<number, number>();
    for (const mv of meterValues) {
      const ts = Date.parse(mv.timestamp);
      let val = this.findMeasurandValue(
        mv.sampledValue,
        MeasurandEnum['Energy.Active.Import.Register'],
        false,
      );
      if (val === null) {
        val = this.sumPhasedValues(mv.sampledValue, MeasurandEnum['Energy.Active.Import.Register']);
      }
      if (val !== null) {
        valuesMap.set(ts, val);
      }
    }
    return valuesMap;
  }

  /**
   * Extracts Energy.Active.Import.Interval measurand values into a timestamp-to-kWh map.
   * @param meterValues Array of MeterValueType to search for interval readings.
   * @returns Map where each key is the reading timestamp (ms since epoch) and each value is the normalized kWh.
   */
  private static getIntervalValuesMap(meterValues: MeterValueDto[]): Map<number, number> {
    const valuesMap = new Map<number, number>();
    for (const mv of meterValues) {
      const ts = Date.parse(mv.timestamp);
      let val = this.findMeasurandValue(
        mv.sampledValue,
        MeasurandEnum['Energy.Active.Import.Interval'],
        false,
      );
      if (val === null) {
        val = this.sumPhasedValues(mv.sampledValue, MeasurandEnum['Energy.Active.Import.Interval']);
      }
      if (val !== null) {
        valuesMap.set(ts, val);
      }
    }
    return valuesMap;
  }

  /**
   * Extracts Energy.Active.Net measurand values into a timestamp-to-kWh map.
   * @param meterValues Array of MeterValueType to search for net readings.
   * @returns Map where each key is the reading timestamp (ms since epoch) and each value is the normalized kWh.
   */
  private static getNetValuesMap(meterValues: MeterValueDto[]): Map<number, number> {
    const valuesMap = new Map<number, number>();
    for (const mv of meterValues) {
      const ts = Date.parse(mv.timestamp);
      const val = this.findMeasurandValue(
        mv.sampledValue,
        MeasurandEnum['Energy.Active.Net'],
        false,
      );
      if (val !== null) {
        valuesMap.set(ts, val);
      }
    }
    return valuesMap;
  }

  /**
   * Find a specific measurand value from sampledValues
   * @param sampledValues Array of sampled values
   * @param measurand The measurand type to look for
   * @param phased Whether to look for phased values (true) or non-phased values (false)
   * @returns The normalized value in kWh, or null if not found
   */
  private static findMeasurandValue(
    sampledValues: SampledValue[],
    measurand: MeasurandEnumType,
    phased: boolean,
  ): number | null {
    const value = sampledValues.find(
      (sv) =>
        (sv.measurand === measurand ||
          (!sv.measurand && // Default to Energy.Active.Import.Register if measurand is missing
            measurand === MeasurandEnum['Energy.Active.Import.Register'])) &&
        !phased === !sv.phase,
    );
    return value ? this.normalizeToKwh(value) : null;
  }

  /**
   * Sum phased values for a specific measurand
   * @param sampledValues Array of sampled values
   * @param measurand The measurand type to sum
   * @returns The sum of phase values in kWh, or null if no valid phase values found
   */
  private static sumPhasedValues(
    sampledValues: SampledValue[],
    measurand: MeasurandEnumType,
  ): number | null {
    // Find all values for this measurand that have individual phases L1, L2, or L3
    const phaseValues = sampledValues.filter(
      (sv) =>
        sv.measurand === measurand &&
        sv.phase && // Must have a phase specified
        (sv.phase === PhaseEnum.L1 || sv.phase === PhaseEnum.L2 || sv.phase === PhaseEnum.L3),
    );

    // If no phase values found, try phase-to-neutral as a last resort
    if (phaseValues.length === 0) {
      const phaseNeutralValues = sampledValues.filter(
        (sv) =>
          sv.measurand === measurand &&
          sv.phase && // Must have a phase specified
          (sv.phase === PhaseEnum['L1-N'] ||
            sv.phase === PhaseEnum['L2-N'] ||
            sv.phase === PhaseEnum['L3-N']),
      );

      if (phaseNeutralValues.length === 0) {
        return null;
      }

      let sum = 0;
      for (const value of phaseNeutralValues) {
        const normalizedValue = this.normalizeToKwh(value);
        if (normalizedValue !== null) {
          sum += normalizedValue;
        }
      }

      return sum;
    }

    // Sum all the normalized phase values
    let sum = 0;
    for (const value of phaseValues) {
      const normalizedValue = this.normalizeToKwh(value);
      if (normalizedValue !== null) {
        sum += normalizedValue;
      }
    }

    return sum;
  }

  /**
   * Convert a sampled value to kWh, applying unit multipliers.
   * @param value A SampledValueType entry.
   * @returns The converted value in kWh, or null if unit is missing.
   */
  private static normalizeToKwh(value: SampledValue): number | null {
    let powerOfTen = value.unitOfMeasure?.multiplier ?? 0;
    const unit = value.unitOfMeasure?.unit?.toUpperCase();

    switch (unit) {
      case 'KWH':
      case 'KVARH': // For reactive energy
      case 'KVAH': // For apparent energy
        break;
      case 'WH':
      case 'VARH': // For reactive energy
      case 'VAH': // For apparent energy
      case undefined:
        powerOfTen -= 3;
        break;
      default:
        throw new Error(`Unknown unit for energy measurement: ${unit}`);
    }

    return value.value * 10 ** powerOfTen;
  }

  /**
   * Sort the entries of a timestamp-to-kWh map ascending by timestamp and return the kWh values.
   * @param valuesMap Map of timestamp (ms since epoch) to kWh.
   * @returns Array of kWh values sorted by timestamp.
   */
  private static getSortedKwhByTimestampAscending(valuesMap: Map<number, number>): number[] {
    return Array.from(valuesMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v);
  }
}
