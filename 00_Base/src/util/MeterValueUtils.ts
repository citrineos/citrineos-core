import { OCPP2_0_1 } from '../ocpp/model';

export class MeterValueUtils {
  private static readonly validContexts = new Set([
    OCPP2_0_1.ReadingContextEnumType.Transaction_Begin,
    OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
    OCPP2_0_1.ReadingContextEnumType.Transaction_End,
  ]);

  /**
   * Calculate the total Kwh
   *
   * @param {array} meterValues - meterValues of a transaction.
   * @return {number} total Kwh based on the best available energy measurement.
   */
  public static getTotalKwh(meterValues: OCPP2_0_1.MeterValueType[]): number {
    const filteredValues = this.filterValidMeterValues(meterValues);
    if (filteredValues.length === 0) {
      return 0;
    }

    const registerMap = this.getRegisterValuesMap(filteredValues);
    if (registerMap.size > 0) {
      const sorted = this.getSortedKwhByTimestampAscending(registerMap);
      return this.calculateTotalKwh(sorted);
    }

    const intervalMap = this.getIntervalValuesMap(filteredValues);
    if (intervalMap.size > 0) {
      const sorted = this.getSortedKwhByTimestampAscending(intervalMap);
      return sorted.reduce((sum, v) => sum + v, 0);
    }

    const netMap = this.getNetValuesMap(filteredValues);
    if (netMap.size > 0) {
      const latestTimestamp = Math.max(...Array.from(netMap.keys()));
      return netMap.get(latestTimestamp)!;
    }

    return 0;
  }

  /**
   * Filter out meter values whose context is not one of the valid reading contexts.
   * @param meterValues Array of MeterValueType to filter.
   * @returns Filtered array containing only meter values in Transaction_Begin, Sample_Periodic or Transaction_End contexts.
   */
  private static filterValidMeterValues(
    meterValues: OCPP2_0_1.MeterValueType[],
  ): OCPP2_0_1.MeterValueType[] {
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
  private static getRegisterValuesMap(
    meterValues: OCPP2_0_1.MeterValueType[],
  ): Map<number, number> {
    const valuesMap = new Map<number, number>();
    for (const mv of meterValues) {
      const ts = Date.parse(mv.timestamp);
      let val = this.findMeasurandValue(
        mv.sampledValue,
        OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
        false,
      );
      if (val === null) {
        val = this.sumPhasedValues(
          mv.sampledValue,
          OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
        );
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
  private static getIntervalValuesMap(
    meterValues: OCPP2_0_1.MeterValueType[],
  ): Map<number, number> {
    const valuesMap = new Map<number, number>();
    for (const mv of meterValues) {
      const ts = Date.parse(mv.timestamp);
      let val = this.findMeasurandValue(
        mv.sampledValue,
        OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval,
        false,
      );
      if (val === null) {
        val = this.sumPhasedValues(
          mv.sampledValue,
          OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval,
        );
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
  private static getNetValuesMap(meterValues: OCPP2_0_1.MeterValueType[]): Map<number, number> {
    const valuesMap = new Map<number, number>();
    for (const mv of meterValues) {
      const ts = Date.parse(mv.timestamp);
      const val = this.findMeasurandValue(
        mv.sampledValue,
        OCPP2_0_1.MeasurandEnumType.Energy_Active_Net,
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
    sampledValues: OCPP2_0_1.SampledValueType[],
    measurand: OCPP2_0_1.MeasurandEnumType,
    phased: boolean,
  ): number | null {
    const value = sampledValues.find(
      (sv) =>
        (sv.measurand === measurand ||
          (!sv.measurand && // Default to Energy.Active.Import.Register if measurand is missing
            measurand === OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register)) &&
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
    sampledValues: OCPP2_0_1.SampledValueType[],
    measurand: OCPP2_0_1.MeasurandEnumType,
  ): number | null {
    // Find all values for this measurand that have individual phases L1, L2, or L3
    const phaseValues = sampledValues.filter(
      (sv) =>
        sv.measurand === measurand &&
        sv.phase && // Must have a phase specified
        (sv.phase === OCPP2_0_1.PhaseEnumType.L1 ||
          sv.phase === OCPP2_0_1.PhaseEnumType.L2 ||
          sv.phase === OCPP2_0_1.PhaseEnumType.L3),
    );

    // If no phase values found, try phase-to-neutral as a last resort
    if (phaseValues.length === 0) {
      const phaseNeutralValues = sampledValues.filter(
        (sv) =>
          sv.measurand === measurand &&
          sv.phase && // Must have a phase specified
          (sv.phase === OCPP2_0_1.PhaseEnumType.L1_N ||
            sv.phase === OCPP2_0_1.PhaseEnumType.L2_N ||
            sv.phase === OCPP2_0_1.PhaseEnumType.L3_N),
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
  private static normalizeToKwh(value: OCPP2_0_1.SampledValueType): number | null {
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

  /**
   * Calculate the total kWh consumed from a sorted array of kWh readings.
   * @param sortedValues Array of kWh values sorted by timestamp.
   * @returns The difference between last and first reading, or 0 if fewer than two readings.
   */
  private static calculateTotalKwh(sortedValues: number[]): number {
    if (sortedValues.length < 2) {
      return 0;
    }
    return sortedValues[sortedValues.length - 1] - sortedValues[0];
  }
}
