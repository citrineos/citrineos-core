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
   * @return {number} total Kwh based on the overall values (i.e., without phase) in the simpledValues.
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
      const overallValue = this.findOverallValue(meterValue.sampledValue);
      if (overallValue) {
        const timestamp = Date.parse(meterValue.timestamp);
        const normalizedValue = this.normalizeToKwh(overallValue);
        if (normalizedValue !== null) {
          valuesMap.set(timestamp, normalizedValue);
        }
      }
    }
    return valuesMap;
  }

  private static findOverallValue(
    sampledValues: OCPP2_0_1.SampledValueType[],
  ): OCPP2_0_1.SampledValueType | undefined {
    return sampledValues.find(
      (sv) =>
        !sv.phase && sv.measurand === OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
    );
  }

  private static normalizeToKwh(overallValue: OCPP2_0_1.SampledValueType): number | null {
    let powerOfTen = overallValue.unitOfMeasure?.multiplier ?? 0;
    const unit = overallValue.unitOfMeasure?.unit?.toUpperCase();
    switch (unit) {
      case 'KWH':
        break;
      case 'WH':
      case undefined:
        powerOfTen -= 3;
        break;
      default:
        throw new Error('Unknown unit for Energy.Active.Import.Register: ' + unit);
    }

    return overallValue.value * 10 ** powerOfTen;
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
