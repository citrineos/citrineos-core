import { MeasurandEnumType, MeterValueType, ReadingContextEnumType, SampledValueType } from '../ocpp/model';

export class MeterValueUtils {
  private static readonly validContexts = new Set([
    ReadingContextEnumType.Transaction_Begin,
    ReadingContextEnumType.Sample_Periodic,
    ReadingContextEnumType.Transaction_End,
  ]);

  /**
   * Calculate the total Kwh
   *
   * @param {array} meterValues - meterValues of a transaction.
   * @return {number} total Kwh based on the overall values (i.e., without phase) in the simpledValues.
   */
  public static getTotalKwh(meterValues: MeterValueType[]): number {
    const filteredValues = this.filterValidMeterValues(meterValues);
    const timestampToKwhMap = this.getTimestampToKwhMap(filteredValues);
    const sortedValues = this.getSortedKwhByTimestampAscending(timestampToKwhMap);
    return this.calculateTotalKwh(sortedValues);
  }

  private static filterValidMeterValues(meterValues: MeterValueType[]): MeterValueType[] {
    return meterValues.filter(mv =>
      // When missing, context is by default Sample_Periodic by spec
      !mv.sampledValue[0].context || this.validContexts.has(mv.sampledValue[0].context)
    );
  }

  private static getTimestampToKwhMap(meterValues: MeterValueType[]): Map<number, number> {
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

  private static findOverallValue(sampledValues: SampledValueType[]): SampledValueType | undefined {
    return sampledValues.find(sv =>
      !sv.phase &&
      sv.measurand === MeasurandEnumType.Energy_Active_Import_Register
    );
  }

  private static normalizeToKwh(value: SampledValueType): number | null {
    const unit = value.unitOfMeasure?.unit?.toUpperCase();
    if (unit === 'KWH') {
      return value.value;
    }
    if (unit === 'WH') {
      return value.value / 1000;
    }
    return null;
  }

  private static getSortedKwhByTimestampAscending(valuesMap: Map<number, number>): number[] {
    return Array.from(valuesMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(entry => entry[1]);
  }

  private static calculateTotalKwh(sortedValues: number[]): number {
    if (sortedValues.length < 2) {
      return 0;
    }
    return sortedValues[sortedValues.length - 1] - sortedValues[0];
  }
}