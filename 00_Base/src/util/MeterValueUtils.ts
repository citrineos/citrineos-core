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
    const timestampToKwhMap = this.getTimestampToKwhMap(filteredValues);
    const sortedValues = this.getSortedKwhByTimestampAscending(timestampToKwhMap);
    return this.calculateTotalKwh(sortedValues);
  }

  private static filterValidMeterValues(
    meterValues: OCPP2_0_1.MeterValueType[],
  ): OCPP2_0_1.MeterValueType[] {
    return meterValues.filter(
      (mv) =>
        // When missing, context is by default Sample_Periodic by spec
        !mv.sampledValue[0].context || this.validContexts.has(mv.sampledValue[0].context),
    );
  }

  private static getTimestampToKwhMap(
    meterValues: OCPP2_0_1.MeterValueType[],
  ): Map<number, number> {
    const valuesMap = new Map<number, number>();

    for (const meterValue of meterValues) {
      const timestamp = Date.parse(meterValue.timestamp);
      let energyValue = null;

      // Try strategies in order of preference

      // 1. Overall Energy.Active.Import.Register
      energyValue = this.findMeasurandValue(
        meterValue.sampledValue,
        OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
        false,
      );

      // 2. Energy.Active.Import.Interval
      if (energyValue === null) {
        energyValue = this.findMeasurandValue(
          meterValue.sampledValue,
          OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval,
          false,
        );
      }

      // 3. Energy.Active.Net
      if (energyValue === null) {
        energyValue = this.findMeasurandValue(
          meterValue.sampledValue,
          OCPP2_0_1.MeasurandEnumType.Energy_Active_Net,
          false,
        );
      }

      // 4. Sum of phased Energy.Active.Import.Register values
      if (energyValue === null) {
        energyValue = this.sumPhasedValues(
          meterValue.sampledValue,
          OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
        );
      }

      // 5. Sum of phased Energy.Active.Import.Interval values
      if (energyValue === null) {
        energyValue = this.sumPhasedValues(
          meterValue.sampledValue,
          OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval,
        );
      }

      // Store the value if we found one
      if (energyValue !== null) {
        valuesMap.set(timestamp, energyValue);
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
    const value = sampledValues.find((sv) => sv.measurand === measurand && !phased === !sv.phase);

    if (value) {
      return this.normalizeToKwh(value);
    }

    return null;
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

  private static getSortedKwhByTimestampAscending(valuesMap: Map<number, number>): number[] {
    return Array.from(valuesMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map((entry) => entry[1]);
  }

  private static calculateTotalKwh(sortedValues: number[]): number {
    if (sortedValues.length < 2) {
      return 0;
    }
    return sortedValues[sortedValues.length - 1] - sortedValues[0];
  }
}
