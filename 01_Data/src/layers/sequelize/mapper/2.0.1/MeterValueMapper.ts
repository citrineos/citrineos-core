// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  LocationEnum,
  MeasurandEnum,
  OCPP2_0_1,
  PhaseEnum,
  ReadingContextEnum,
  type MeterValueDto,
  type SampledValue,
} from '@citrineos/base';

export class MeterValueMapper {
  /**
   * Converts native ReadingContextEnum to OCPP 2.0.1 ReadingContextEnumType
   */
  static toReadingContextEnumType(
    context?: keyof typeof ReadingContextEnum | null,
  ): OCPP2_0_1.ReadingContextEnumType | undefined {
    if (!context) return undefined;

    switch (context) {
      case 'Interruption.Begin':
        return OCPP2_0_1.ReadingContextEnumType.Interruption_Begin;
      case 'Interruption.End':
        return OCPP2_0_1.ReadingContextEnumType.Interruption_End;
      case 'Other':
        return OCPP2_0_1.ReadingContextEnumType.Other;
      case 'Sample.Clock':
        return OCPP2_0_1.ReadingContextEnumType.Sample_Clock;
      case 'Sample.Periodic':
        return OCPP2_0_1.ReadingContextEnumType.Sample_Periodic;
      case 'Transaction.Begin':
        return OCPP2_0_1.ReadingContextEnumType.Transaction_Begin;
      case 'Transaction.End':
        return OCPP2_0_1.ReadingContextEnumType.Transaction_End;
      case 'Trigger':
        return OCPP2_0_1.ReadingContextEnumType.Trigger;
      default:
        return undefined;
    }
  }

  /**
   * Converts OCPP 2.0.1 ReadingContextEnumType to native ReadingContextEnum
   */
  static fromReadingContextEnumType(
    context?: OCPP2_0_1.ReadingContextEnumType | null,
  ): keyof typeof ReadingContextEnum | undefined {
    if (!context) return undefined;

    switch (context) {
      case OCPP2_0_1.ReadingContextEnumType.Interruption_Begin:
        return 'Interruption.Begin';
      case OCPP2_0_1.ReadingContextEnumType.Interruption_End:
        return 'Interruption.End';
      case OCPP2_0_1.ReadingContextEnumType.Other:
        return 'Other';
      case OCPP2_0_1.ReadingContextEnumType.Sample_Clock:
        return 'Sample.Clock';
      case OCPP2_0_1.ReadingContextEnumType.Sample_Periodic:
        return 'Sample.Periodic';
      case OCPP2_0_1.ReadingContextEnumType.Transaction_Begin:
        return 'Transaction.Begin';
      case OCPP2_0_1.ReadingContextEnumType.Transaction_End:
        return 'Transaction.End';
      case OCPP2_0_1.ReadingContextEnumType.Trigger:
        return 'Trigger';
      default:
        return 'Sample.Periodic';
    }
  }

  /**
   * Converts native MeasurandEnum to OCPP 2.0.1 MeasurandEnumType
   */
  static toMeasurandEnumType(
    measurand?: keyof typeof MeasurandEnum | null,
  ): OCPP2_0_1.MeasurandEnumType | undefined {
    if (!measurand) return undefined;

    switch (measurand) {
      case 'Current.Export':
        return OCPP2_0_1.MeasurandEnumType.Current_Export;
      case 'Current.Import':
        return OCPP2_0_1.MeasurandEnumType.Current_Import;
      case 'Current.Offered':
        return OCPP2_0_1.MeasurandEnumType.Current_Offered;
      case 'Energy.Active.Export.Register':
        return OCPP2_0_1.MeasurandEnumType.Energy_Active_Export_Register;
      case 'Energy.Active.Import.Register':
        return OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register;
      case 'Energy.Reactive.Export.Register':
        return OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Export_Register;
      case 'Energy.Reactive.Import.Register':
        return OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Import_Register;
      case 'Energy.Active.Export.Interval':
        return OCPP2_0_1.MeasurandEnumType.Energy_Active_Export_Interval;
      case 'Energy.Active.Import.Interval':
        return OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval;
      case 'Energy.Active.Net':
        return OCPP2_0_1.MeasurandEnumType.Energy_Active_Net;
      case 'Energy.Reactive.Export.Interval':
        return OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Export_Interval;
      case 'Energy.Reactive.Import.Interval':
        return OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Import_Interval;
      case 'Energy.Reactive.Net':
        return OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Net;
      case 'Energy.Apparent.Net':
        return OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Net;
      case 'Energy.Apparent.Import':
        return OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Import;
      case 'Energy.Apparent.Export':
        return OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Export;
      case 'Frequency':
        return OCPP2_0_1.MeasurandEnumType.Frequency;
      case 'Power.Active.Export':
        return OCPP2_0_1.MeasurandEnumType.Power_Active_Export;
      case 'Power.Active.Import':
        return OCPP2_0_1.MeasurandEnumType.Power_Active_Import;
      case 'Power.Factor':
        return OCPP2_0_1.MeasurandEnumType.Power_Factor;
      case 'Power.Offered':
        return OCPP2_0_1.MeasurandEnumType.Power_Offered;
      case 'Power.Reactive.Export':
        return OCPP2_0_1.MeasurandEnumType.Power_Reactive_Export;
      case 'Power.Reactive.Import':
        return OCPP2_0_1.MeasurandEnumType.Power_Reactive_Import;
      case 'SoC':
        return OCPP2_0_1.MeasurandEnumType.SoC;
      case 'Voltage':
        return OCPP2_0_1.MeasurandEnumType.Voltage;
      default:
        // Note: Native enum measurands not supported in OCPP 2.0.1:
        // Temperature, RPM - from OCPP 1.6
        return undefined;
    }
  }

  /**
   * Converts OCPP 2.0.1 MeasurandEnumType to native MeasurandEnum
   */
  static fromMeasurandEnumType(
    measurand?: OCPP2_0_1.MeasurandEnumType | null,
  ): keyof typeof MeasurandEnum | undefined {
    if (!measurand) return undefined;

    switch (measurand) {
      case OCPP2_0_1.MeasurandEnumType.Current_Export:
        return 'Current.Export';
      case OCPP2_0_1.MeasurandEnumType.Current_Import:
        return 'Current.Import';
      case OCPP2_0_1.MeasurandEnumType.Current_Offered:
        return 'Current.Offered';
      case OCPP2_0_1.MeasurandEnumType.Energy_Active_Export_Register:
        return 'Energy.Active.Export.Register';
      case OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register:
        return 'Energy.Active.Import.Register';
      case OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Export_Register:
        return 'Energy.Reactive.Export.Register';
      case OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Import_Register:
        return 'Energy.Reactive.Import.Register';
      case OCPP2_0_1.MeasurandEnumType.Energy_Active_Export_Interval:
        return 'Energy.Active.Export.Interval';
      case OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval:
        return 'Energy.Active.Import.Interval';
      case OCPP2_0_1.MeasurandEnumType.Energy_Active_Net:
        return 'Energy.Active.Net';
      case OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Export_Interval:
        return 'Energy.Reactive.Export.Interval';
      case OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Import_Interval:
        return 'Energy.Reactive.Import.Interval';
      case OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Net:
        return 'Energy.Reactive.Net';
      case OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Net:
        return 'Energy.Apparent.Net';
      case OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Import:
        return 'Energy.Apparent.Import';
      case OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Export:
        return 'Energy.Apparent.Export';
      case OCPP2_0_1.MeasurandEnumType.Frequency:
        return 'Frequency';
      case OCPP2_0_1.MeasurandEnumType.Power_Active_Export:
        return 'Power.Active.Export';
      case OCPP2_0_1.MeasurandEnumType.Power_Active_Import:
        return 'Power.Active.Import';
      case OCPP2_0_1.MeasurandEnumType.Power_Factor:
        return 'Power.Factor';
      case OCPP2_0_1.MeasurandEnumType.Power_Offered:
        return 'Power.Offered';
      case OCPP2_0_1.MeasurandEnumType.Power_Reactive_Export:
        return 'Power.Reactive.Export';
      case OCPP2_0_1.MeasurandEnumType.Power_Reactive_Import:
        return 'Power.Reactive.Import';
      case OCPP2_0_1.MeasurandEnumType.SoC:
        return 'SoC';
      case OCPP2_0_1.MeasurandEnumType.Voltage:
        return 'Voltage';
      default:
        return 'Energy.Active.Import.Register';
    }
  }

  /**
   * Converts native LocationEnum to OCPP 2.0.1 LocationEnumType
   */
  static toLocationEnumType(
    location?: keyof typeof LocationEnum | null,
  ): OCPP2_0_1.LocationEnumType | undefined {
    if (!location) return undefined;

    switch (location) {
      case 'Body':
        return OCPP2_0_1.LocationEnumType.Body;
      case 'Cable':
        return OCPP2_0_1.LocationEnumType.Cable;
      case 'EV':
        return OCPP2_0_1.LocationEnumType.EV;
      case 'Inlet':
        return OCPP2_0_1.LocationEnumType.Inlet;
      case 'Outlet':
        return OCPP2_0_1.LocationEnumType.Outlet;
      default:
        return undefined;
    }
  }

  /**
   * Converts OCPP 2.0.1 LocationEnumType to native LocationEnum
   */
  static fromLocationEnumType(
    location?: OCPP2_0_1.LocationEnumType | null,
  ): keyof typeof LocationEnum | undefined {
    if (!location) return undefined;

    switch (location) {
      case OCPP2_0_1.LocationEnumType.Body:
        return 'Body';
      case OCPP2_0_1.LocationEnumType.Cable:
        return 'Cable';
      case OCPP2_0_1.LocationEnumType.EV:
        return 'EV';
      case OCPP2_0_1.LocationEnumType.Inlet:
        return 'Inlet';
      case OCPP2_0_1.LocationEnumType.Outlet:
        return 'Outlet';
      default:
        return 'Outlet';
    }
  }

  /**
   * Converts native PhaseEnum to OCPP 2.0.1 PhaseEnumType
   */
  static toPhaseEnumType(
    phase?: keyof typeof PhaseEnum | null,
  ): OCPP2_0_1.PhaseEnumType | undefined {
    if (!phase) return undefined;

    switch (phase) {
      case 'L1':
        return OCPP2_0_1.PhaseEnumType.L1;
      case 'L2':
        return OCPP2_0_1.PhaseEnumType.L2;
      case 'L3':
        return OCPP2_0_1.PhaseEnumType.L3;
      case 'N':
        return OCPP2_0_1.PhaseEnumType.N;
      case 'L1-N':
        return OCPP2_0_1.PhaseEnumType.L1_N;
      case 'L2-N':
        return OCPP2_0_1.PhaseEnumType.L2_N;
      case 'L3-N':
        return OCPP2_0_1.PhaseEnumType.L3_N;
      case 'L1-L2':
        return OCPP2_0_1.PhaseEnumType.L1_L2;
      case 'L2-L3':
        return OCPP2_0_1.PhaseEnumType.L2_L3;
      case 'L3-L1':
        return OCPP2_0_1.PhaseEnumType.L3_L1;
      default:
        return undefined;
    }
  }

  /**
   * Converts OCPP 2.0.1 PhaseEnumType to native PhaseEnum
   */
  static fromPhaseEnumType(
    phase?: OCPP2_0_1.PhaseEnumType | null,
  ): keyof typeof PhaseEnum | undefined {
    if (!phase) return undefined;

    switch (phase) {
      case OCPP2_0_1.PhaseEnumType.L1:
        return 'L1';
      case OCPP2_0_1.PhaseEnumType.L2:
        return 'L2';
      case OCPP2_0_1.PhaseEnumType.L3:
        return 'L3';
      case OCPP2_0_1.PhaseEnumType.N:
        return 'N';
      case OCPP2_0_1.PhaseEnumType.L1_N:
        return 'L1-N';
      case OCPP2_0_1.PhaseEnumType.L2_N:
        return 'L2-N';
      case OCPP2_0_1.PhaseEnumType.L3_N:
        return 'L3-N';
      case OCPP2_0_1.PhaseEnumType.L1_L2:
        return 'L1-L2';
      case OCPP2_0_1.PhaseEnumType.L2_L3:
        return 'L2-L3';
      case OCPP2_0_1.PhaseEnumType.L3_L1:
        return 'L3-L1';
      default:
        return undefined;
    }
  }

  static toMeterValueType(meterValue: MeterValueDto): OCPP2_0_1.MeterValueType {
    return {
      timestamp: meterValue.timestamp,
      sampledValue: MeterValueMapper.toSampledValueTypes(meterValue.sampledValue),
    };
  }

  static toSampledValueTypes(
    sampledValues: SampledValue[],
  ): [OCPP2_0_1.SampledValueType, ...OCPP2_0_1.SampledValueType[]] {
    if (!(sampledValues instanceof Array) || sampledValues.length === 0) {
      throw new Error(`Invalid sampledValues: ${JSON.stringify(sampledValues)}`);
    }

    const sampledValueTypes: OCPP2_0_1.SampledValueType[] = [];
    for (const sampledValue of sampledValues) {
      const measurand = MeterValueMapper.toMeasurandEnumType(sampledValue.measurand);
      if (measurand !== undefined) {
        sampledValueTypes.push({
          value: sampledValue.value,
          context: MeterValueMapper.toReadingContextEnumType(sampledValue.context),
          measurand: measurand,
          phase: MeterValueMapper.toPhaseEnumType(sampledValue.phase),
          location: MeterValueMapper.toLocationEnumType(sampledValue.location),
          signedMeterValue: sampledValue.signedMeterValue
            ? {
                signedMeterData: sampledValue.signedMeterValue.signedMeterData,
                signingMethod: sampledValue.signedMeterValue.signingMethod,
                encodingMethod: sampledValue.signedMeterValue.encodingMethod,
                publicKey: sampledValue.signedMeterValue.publicKey,
              }
            : undefined,
          unitOfMeasure: sampledValue.unitOfMeasure
            ? {
                unit: sampledValue.unitOfMeasure.unit,
                multiplier: sampledValue.unitOfMeasure.multiplier,
              }
            : undefined,
        });
      } else {
        console.warn(`Unsupported measurand for OCPP 2.0.1: ${sampledValue.measurand}`);
      }
    }
    return sampledValueTypes as [OCPP2_0_1.SampledValueType, ...OCPP2_0_1.SampledValueType[]];
  }

  /**
   * Converts OCPP2_0_1.SampledValueType[] back to SampledValue[]
   */
  static fromSampledValueTypes(
    sampledValueTypes: OCPP2_0_1.SampledValueType[],
  ): [SampledValue, ...SampledValue[]] {
    if (!Array.isArray(sampledValueTypes) || sampledValueTypes.length === 0) {
      throw new Error(`Invalid sampledValueTypes: ${JSON.stringify(sampledValueTypes)}`);
    }

    const sampledValues: SampledValue[] = [];
    for (const sampledValueType of sampledValueTypes) {
      const sampledValue: SampledValue = {
        value: sampledValueType.value,
        context: MeterValueMapper.fromReadingContextEnumType(sampledValueType.context),
        measurand: MeterValueMapper.fromMeasurandEnumType(sampledValueType.measurand),
        phase: MeterValueMapper.fromPhaseEnumType(sampledValueType.phase),
        location: MeterValueMapper.fromLocationEnumType(sampledValueType.location),
      };

      if (sampledValueType.signedMeterValue) {
        sampledValue.signedMeterValue = {
          signedMeterData: sampledValueType.signedMeterValue.signedMeterData,
          signingMethod: sampledValueType.signedMeterValue.signingMethod,
          encodingMethod: sampledValueType.signedMeterValue.encodingMethod,
          publicKey: sampledValueType.signedMeterValue.publicKey,
        };
      }

      if (sampledValueType.unitOfMeasure) {
        sampledValue.unitOfMeasure = {
          unit:
            sampledValueType.unitOfMeasure.unit ||
            (sampledValue.measurand?.startsWith('Energy') ? 'Wh' : undefined),
          multiplier: sampledValueType.unitOfMeasure.multiplier || 0,
        };
      }

      sampledValues.push(sampledValue);
    }

    return sampledValues as [SampledValue, ...SampledValue[]];
  }

  /**
   * Converts OCPP2_0_1.MeterValueType back to a partial MeterValue structure
   */
  static fromMeterValueType(meterValueType: OCPP2_0_1.MeterValueType): MeterValueDto {
    return {
      timestamp: meterValueType.timestamp,
      sampledValue: MeterValueMapper.fromSampledValueTypes(meterValueType.sampledValue),
    };
  }
}
