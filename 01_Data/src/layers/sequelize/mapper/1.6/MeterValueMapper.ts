// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  LocationEnum,
  MeasurandEnum,
  OCPP1_6,
  PhaseEnum,
  ReadingContextEnum,
  type MeterValueDto,
  type SampledValue,
} from '@citrineos/base';

export class MeterValueMapper {
  /**
   * Converts native ReadingContextEnum to OCPP 1.6 MeterValuesRequestContext
   */
  static toReadingContextEnumType(
    context?: keyof typeof ReadingContextEnum | null,
  ): OCPP1_6.MeterValuesRequestContext | undefined {
    if (!context) return undefined;

    switch (context) {
      case 'Interruption.Begin':
        return OCPP1_6.MeterValuesRequestContext.Interruption_Begin;
      case 'Interruption.End':
        return OCPP1_6.MeterValuesRequestContext.Interruption_End;
      case 'Other':
        return OCPP1_6.MeterValuesRequestContext.Other;
      case 'Sample.Clock':
        return OCPP1_6.MeterValuesRequestContext.Sample_Clock;
      case 'Sample.Periodic':
        return OCPP1_6.MeterValuesRequestContext.Sample_Periodic;
      case 'Transaction.Begin':
        return OCPP1_6.MeterValuesRequestContext.Transaction_Begin;
      case 'Transaction.End':
        return OCPP1_6.MeterValuesRequestContext.Transaction_End;
      case 'Trigger':
        return OCPP1_6.MeterValuesRequestContext.Trigger;
      default:
        return undefined;
    }
  }

  /**
   * Converts OCPP 1.6 MeterValuesRequestContext to native ReadingContextEnum
   */
  static fromReadingContextEnumType(
    context?: OCPP1_6.MeterValuesRequestContext | null,
  ): keyof typeof ReadingContextEnum | undefined {
    if (!context) return undefined;

    switch (context) {
      case OCPP1_6.MeterValuesRequestContext.Interruption_Begin:
        return 'Interruption.Begin';
      case OCPP1_6.MeterValuesRequestContext.Interruption_End:
        return 'Interruption.End';
      case OCPP1_6.MeterValuesRequestContext.Other:
        return 'Other';
      case OCPP1_6.MeterValuesRequestContext.Sample_Clock:
        return 'Sample.Clock';
      case OCPP1_6.MeterValuesRequestContext.Sample_Periodic:
        return 'Sample.Periodic';
      case OCPP1_6.MeterValuesRequestContext.Transaction_Begin:
        return 'Transaction.Begin';
      case OCPP1_6.MeterValuesRequestContext.Transaction_End:
        return 'Transaction.End';
      case OCPP1_6.MeterValuesRequestContext.Trigger:
        return 'Trigger';
      default:
        return 'Sample.Periodic';
    }
  }

  /**
   * Converts native MeasurandEnum to OCPP 1.6 MeterValuesRequestMeasurand
   */
  static toMeasurandEnumType(
    measurand?: keyof typeof MeasurandEnum | null,
  ): OCPP1_6.MeterValuesRequestMeasurand | undefined {
    if (!measurand) return undefined;

    switch (measurand) {
      case 'Current.Export':
        return OCPP1_6.MeterValuesRequestMeasurand.Current_Export;
      case 'Current.Import':
        return OCPP1_6.MeterValuesRequestMeasurand.Current_Import;
      case 'Current.Offered':
        return OCPP1_6.MeterValuesRequestMeasurand.Current_Offered;
      case 'Energy.Active.Export.Register':
        return OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Export_Register;
      case 'Energy.Active.Import.Register':
        return OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register;
      case 'Energy.Reactive.Export.Register':
        return OCPP1_6.MeterValuesRequestMeasurand.Energy_Reactive_Export_Register;
      case 'Energy.Reactive.Import.Register':
        return OCPP1_6.MeterValuesRequestMeasurand.Energy_Reactive_Import_Register;
      case 'Energy.Active.Export.Interval':
        return OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Export_Interval;
      case 'Energy.Active.Import.Interval':
        return OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Interval;
      case 'Energy.Reactive.Export.Interval':
        return OCPP1_6.MeterValuesRequestMeasurand.Energy_Reactive_Export_Interval;
      case 'Energy.Reactive.Import.Interval':
        return OCPP1_6.MeterValuesRequestMeasurand.Energy_Reactive_Import_Interval;
      case 'Frequency':
        return OCPP1_6.MeterValuesRequestMeasurand.Frequency;
      case 'Power.Active.Export':
        return OCPP1_6.MeterValuesRequestMeasurand.Power_Active_Export;
      case 'Power.Active.Import':
        return OCPP1_6.MeterValuesRequestMeasurand.Power_Active_Import;
      case 'Power.Factor':
        return OCPP1_6.MeterValuesRequestMeasurand.Power_Factor;
      case 'Power.Offered':
        return OCPP1_6.MeterValuesRequestMeasurand.Power_Offered;
      case 'Power.Reactive.Export':
        return OCPP1_6.MeterValuesRequestMeasurand.Power_Reactive_Export;
      case 'Power.Reactive.Import':
        return OCPP1_6.MeterValuesRequestMeasurand.Power_Reactive_Import;
      case 'SoC':
        return OCPP1_6.MeterValuesRequestMeasurand.SoC;
      case 'Voltage':
        return OCPP1_6.MeterValuesRequestMeasurand.Voltage;
      default:
        // Note: OCPP 2.0.1 measurands not supported in 1.6:
        // Energy.Active.Net, Energy.Reactive.Net, Energy.Apparent.Net,
        // Energy.Apparent.Import, Energy.Apparent.Export
        return undefined;
    }
  }

  /**
   * Converts OCPP 1.6 MeterValuesRequestMeasurand to native MeasurandEnum
   */
  static fromMeasurandEnumType(
    measurand?: OCPP1_6.MeterValuesRequestMeasurand | null,
  ): keyof typeof MeasurandEnum | undefined {
    if (!measurand) return undefined;

    switch (measurand) {
      case OCPP1_6.MeterValuesRequestMeasurand.Current_Export:
        return 'Current.Export';
      case OCPP1_6.MeterValuesRequestMeasurand.Current_Import:
        return 'Current.Import';
      case OCPP1_6.MeterValuesRequestMeasurand.Current_Offered:
        return 'Current.Offered';
      case OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Export_Register:
        return 'Energy.Active.Export.Register';
      case OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register:
        return 'Energy.Active.Import.Register';
      case OCPP1_6.MeterValuesRequestMeasurand.Energy_Reactive_Export_Register:
        return 'Energy.Reactive.Export.Register';
      case OCPP1_6.MeterValuesRequestMeasurand.Energy_Reactive_Import_Register:
        return 'Energy.Reactive.Import.Register';
      case OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Export_Interval:
        return 'Energy.Active.Export.Interval';
      case OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Interval:
        return 'Energy.Active.Import.Interval';
      case OCPP1_6.MeterValuesRequestMeasurand.Energy_Reactive_Export_Interval:
        return 'Energy.Reactive.Export.Interval';
      case OCPP1_6.MeterValuesRequestMeasurand.Energy_Reactive_Import_Interval:
        return 'Energy.Reactive.Import.Interval';
      case OCPP1_6.MeterValuesRequestMeasurand.Frequency:
        return 'Frequency';
      case OCPP1_6.MeterValuesRequestMeasurand.Power_Active_Export:
        return 'Power.Active.Export';
      case OCPP1_6.MeterValuesRequestMeasurand.Power_Active_Import:
        return 'Power.Active.Import';
      case OCPP1_6.MeterValuesRequestMeasurand.Power_Factor:
        return 'Power.Factor';
      case OCPP1_6.MeterValuesRequestMeasurand.Power_Offered:
        return 'Power.Offered';
      case OCPP1_6.MeterValuesRequestMeasurand.Power_Reactive_Export:
        return 'Power.Reactive.Export';
      case OCPP1_6.MeterValuesRequestMeasurand.Power_Reactive_Import:
        return 'Power.Reactive.Import';
      case OCPP1_6.MeterValuesRequestMeasurand.RPM:
        return 'RPM';
      case OCPP1_6.MeterValuesRequestMeasurand.SoC:
        return 'SoC';
      case OCPP1_6.MeterValuesRequestMeasurand.Temperature:
        return 'Temperature';
      case OCPP1_6.MeterValuesRequestMeasurand.Voltage:
        return 'Voltage';
      default:
        return 'Energy.Active.Import.Register';
    }
  }

  /**
   * Converts native LocationEnum to OCPP 1.6 MeterValuesRequestLocation
   */
  static toLocationEnumType(
    location?: keyof typeof LocationEnum | null,
  ): OCPP1_6.MeterValuesRequestLocation | undefined {
    if (!location) return undefined;

    switch (location) {
      case 'Body':
        return OCPP1_6.MeterValuesRequestLocation.Body;
      case 'Cable':
        return OCPP1_6.MeterValuesRequestLocation.Cable;
      case 'EV':
        return OCPP1_6.MeterValuesRequestLocation.EV;
      case 'Inlet':
        return OCPP1_6.MeterValuesRequestLocation.Inlet;
      case 'Outlet':
        return OCPP1_6.MeterValuesRequestLocation.Outlet;
      default:
        return undefined;
    }
  }

  /**
   * Converts OCPP 1.6 MeterValuesRequestLocation to native LocationEnum
   */
  static fromLocationEnumType(
    location?: OCPP1_6.MeterValuesRequestLocation | null,
  ): keyof typeof LocationEnum | undefined {
    if (!location) return undefined;

    switch (location) {
      case OCPP1_6.MeterValuesRequestLocation.Body:
        return 'Body';
      case OCPP1_6.MeterValuesRequestLocation.Cable:
        return 'Cable';
      case OCPP1_6.MeterValuesRequestLocation.EV:
        return 'EV';
      case OCPP1_6.MeterValuesRequestLocation.Inlet:
        return 'Inlet';
      case OCPP1_6.MeterValuesRequestLocation.Outlet:
        return 'Outlet';
      default:
        return 'Outlet';
    }
  }

  /**
   * Converts native PhaseEnum to OCPP 1.6 MeterValuesRequestPhase
   */
  static toPhaseEnumType(
    phase?: keyof typeof PhaseEnum | null,
  ): OCPP1_6.MeterValuesRequestPhase | undefined {
    if (!phase) return undefined;

    switch (phase) {
      case 'L1':
        return OCPP1_6.MeterValuesRequestPhase.L1;
      case 'L2':
        return OCPP1_6.MeterValuesRequestPhase.L2;
      case 'L3':
        return OCPP1_6.MeterValuesRequestPhase.L3;
      case 'N':
        return OCPP1_6.MeterValuesRequestPhase.N;
      case 'L1-N':
        return OCPP1_6.MeterValuesRequestPhase.L1_N;
      case 'L2-N':
        return OCPP1_6.MeterValuesRequestPhase.L2_N;
      case 'L3-N':
        return OCPP1_6.MeterValuesRequestPhase.L3_N;
      case 'L1-L2':
        return OCPP1_6.MeterValuesRequestPhase.L1_L2;
      case 'L2-L3':
        return OCPP1_6.MeterValuesRequestPhase.L2_L3;
      case 'L3-L1':
        return OCPP1_6.MeterValuesRequestPhase.L3_L1;
      default:
        return undefined;
    }
  }

  /**
   * Converts OCPP 1.6 MeterValuesRequestPhase to native PhaseEnum
   */
  static fromPhaseEnumType(
    phase?: OCPP1_6.MeterValuesRequestPhase | null,
  ): keyof typeof PhaseEnum | undefined {
    if (!phase) return undefined;

    switch (phase) {
      case OCPP1_6.MeterValuesRequestPhase.L1:
        return 'L1';
      case OCPP1_6.MeterValuesRequestPhase.L2:
        return 'L2';
      case OCPP1_6.MeterValuesRequestPhase.L3:
        return 'L3';
      case OCPP1_6.MeterValuesRequestPhase.N:
        return 'N';
      case OCPP1_6.MeterValuesRequestPhase.L1_N:
        return 'L1-N';
      case OCPP1_6.MeterValuesRequestPhase.L2_N:
        return 'L2-N';
      case OCPP1_6.MeterValuesRequestPhase.L3_N:
        return 'L3-N';
      case OCPP1_6.MeterValuesRequestPhase.L1_L2:
        return 'L1-L2';
      case OCPP1_6.MeterValuesRequestPhase.L2_L3:
        return 'L2-L3';
      case OCPP1_6.MeterValuesRequestPhase.L3_L1:
        return 'L3-L1';
      default:
        return undefined;
    }
  }

  /**
   * Converts native UnitOfMeasure to OCPP 1.6 MeterValuesRequestUnit
   */
  static toUnitEnumType(unit?: string | null): OCPP1_6.MeterValuesRequestUnit | undefined {
    if (!unit) return undefined;

    switch (unit) {
      case 'Wh':
        return OCPP1_6.MeterValuesRequestUnit.Wh;
      case 'kWh':
        return OCPP1_6.MeterValuesRequestUnit.kWh;
      case 'varh':
        return OCPP1_6.MeterValuesRequestUnit.varh;
      case 'kvarh':
        return OCPP1_6.MeterValuesRequestUnit.kvarh;
      case 'W':
        return OCPP1_6.MeterValuesRequestUnit.W;
      case 'kW':
        return OCPP1_6.MeterValuesRequestUnit.kW;
      case 'VA':
        return OCPP1_6.MeterValuesRequestUnit.VA;
      case 'kVA':
        return OCPP1_6.MeterValuesRequestUnit.kVA;
      case 'var':
        return OCPP1_6.MeterValuesRequestUnit.var;
      case 'kvar':
        return OCPP1_6.MeterValuesRequestUnit.kvar;
      case 'A':
        return OCPP1_6.MeterValuesRequestUnit.A;
      case 'V':
        return OCPP1_6.MeterValuesRequestUnit.V;
      case 'K':
        return OCPP1_6.MeterValuesRequestUnit.K;
      case 'Celsius':
        return OCPP1_6.MeterValuesRequestUnit.Celsius;
      case 'Fahrenheit':
        return OCPP1_6.MeterValuesRequestUnit.Fahrenheit;
      case 'Percent':
        return OCPP1_6.MeterValuesRequestUnit.Percent;
      default:
        return undefined;
    }
  }

  /**
   * Converts OCPP 1.6 MeterValuesRequestUnit to native unit string
   */
  static fromUnitEnumType(unit?: OCPP1_6.MeterValuesRequestUnit | null): string | undefined {
    if (!unit) return undefined;

    switch (unit) {
      case OCPP1_6.MeterValuesRequestUnit.Wh:
        return 'Wh';
      case OCPP1_6.MeterValuesRequestUnit.kWh:
        return 'kWh';
      case OCPP1_6.MeterValuesRequestUnit.varh:
        return 'varh';
      case OCPP1_6.MeterValuesRequestUnit.kvarh:
        return 'kvarh';
      case OCPP1_6.MeterValuesRequestUnit.W:
        return 'W';
      case OCPP1_6.MeterValuesRequestUnit.kW:
        return 'kW';
      case OCPP1_6.MeterValuesRequestUnit.VA:
        return 'VA';
      case OCPP1_6.MeterValuesRequestUnit.kVA:
        return 'kVA';
      case OCPP1_6.MeterValuesRequestUnit.var:
        return 'var';
      case OCPP1_6.MeterValuesRequestUnit.kvar:
        return 'kvar';
      case OCPP1_6.MeterValuesRequestUnit.A:
        return 'A';
      case OCPP1_6.MeterValuesRequestUnit.V:
        return 'V';
      case OCPP1_6.MeterValuesRequestUnit.K:
        return 'K';
      case OCPP1_6.MeterValuesRequestUnit.Celcius:
      case OCPP1_6.MeterValuesRequestUnit.Celsius:
        return 'Celsius';
      case OCPP1_6.MeterValuesRequestUnit.Fahrenheit:
        return 'Fahrenheit';
      case OCPP1_6.MeterValuesRequestUnit.Percent:
        return 'Percent';
      default:
        return undefined;
    }
  }

  /**
   * OCPP 1.6 SampledValue type (inline from MeterValuesRequest)
   */
  static toSampledValueType(
    sampledValue: SampledValue,
  ): OCPP1_6.MeterValuesRequest['meterValue'][0]['sampledValue'][0] {
    return {
      value: String(sampledValue.value * 10 ** (sampledValue.unitOfMeasure?.multiplier ?? 0)),
      context: MeterValueMapper.toReadingContextEnumType(sampledValue.context),
      measurand: MeterValueMapper.toMeasurandEnumType(sampledValue.measurand),
      phase: MeterValueMapper.toPhaseEnumType(sampledValue.phase),
      location: MeterValueMapper.toLocationEnumType(sampledValue.location),
      unit: MeterValueMapper.toUnitEnumType(sampledValue.unitOfMeasure?.unit),
      // Note: no support for OCPP 1.6 signedMeterValues
    };
  }

  static toMeterValueType(meterValue: MeterValueDto): OCPP1_6.MeterValuesRequest['meterValue'][0] {
    return {
      timestamp: meterValue.timestamp,
      sampledValue: MeterValueMapper.toSampledValueTypes(meterValue.sampledValue),
    };
  }

  static toSampledValueTypes(
    sampledValues: SampledValue[],
  ): OCPP1_6.MeterValuesRequest['meterValue'][0]['sampledValue'] {
    return sampledValues.map((sv) => MeterValueMapper.toSampledValueType(sv));
  }

  /**
   * Validates the format field for OCPP 1.6 sampledValue.
   */
  static validateFormat(format?: OCPP1_6.MeterValuesRequestFormat | null): boolean {
    return format === undefined || format === OCPP1_6.MeterValuesRequestFormat.Raw;
  }

  /**
   * Converts OCPP 1.6 sampledValue to native SampledValue
   */
  static fromSampledValueType(
    sampledValueType: OCPP1_6.MeterValuesRequest['meterValue'][0]['sampledValue'][0],
  ): SampledValue | undefined {
    // Validate format - return undefined if not Raw or undefined
    if (!MeterValueMapper.validateFormat(sampledValueType.format)) {
      console.warn(`Unsupported OCPP 1.6 sampledValue format: ${sampledValueType.format}`);
      return undefined;
    }

    const sampledValue: SampledValue = {
      value: parseFloat(sampledValueType.value),
      context: MeterValueMapper.fromReadingContextEnumType(sampledValueType.context),
      measurand: MeterValueMapper.fromMeasurandEnumType(sampledValueType.measurand),
      phase: MeterValueMapper.fromPhaseEnumType(sampledValueType.phase),
      location: MeterValueMapper.fromLocationEnumType(sampledValueType.location),
    };

    const unit = MeterValueMapper.fromUnitEnumType(sampledValueType.unit);
    if (unit) {
      sampledValue.unitOfMeasure = {
        unit,
        multiplier: 0, // OCPP 1.6 does not have multiplier
      };
    }

    return sampledValue;
  }

  /**
   * Converts OCPP 1.6 SampledValueType[] back to SampledValue[]
   */
  static fromSampledValueTypes(
    sampledValueTypes: OCPP1_6.MeterValuesRequest['meterValue'][0]['sampledValue'],
  ): [SampledValue, ...SampledValue[]] {
    const sampledValues = sampledValueTypes.map((svt) =>
      MeterValueMapper.fromSampledValueType(svt),
    );

    return sampledValues as [SampledValue, ...SampledValue[]];
  }

  /**
   * Converts OCPP 1.6 MeterValueType back to a partial MeterValue structure
   */
  static fromMeterValueType(
    meterValueType: OCPP1_6.MeterValuesRequest['meterValue'][0],
  ): MeterValueDto {
    return {
      timestamp: meterValueType.timestamp,
      sampledValue: MeterValueMapper.fromSampledValueTypes(meterValueType.sampledValue),
    };
  }
}
