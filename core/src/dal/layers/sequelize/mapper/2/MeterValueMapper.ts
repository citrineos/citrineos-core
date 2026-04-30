// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  LocationEnum,
  MeasurandEnum,
  OCPP2_0_1,
  OCPP2_1,
  OCPP2_common_types,
  PhaseEnum,
  ReadingContextEnum,
  type MeterValueDto,
  type SampledValue,
} from '@citrineos/base';

export class MeterValueMapper {
  static fromMeterValueType(meterValueType: OCPP2_common_types.MeterValueType): MeterValueDto {
    return {
      timestamp: meterValueType.timestamp,
      sampledValue: MeterValueMapper.fromSampledValueTypes(
        meterValueType.sampledValue as [
          OCPP2_common_types.SampledValueType,
          ...OCPP2_common_types.SampledValueType[],
        ],
      ),
    };
  }

  static fromSampledValueTypes(
    sampledValueTypes: [
      OCPP2_common_types.SampledValueType,
      ...OCPP2_common_types.SampledValueType[],
    ],
  ): [SampledValue, ...SampledValue[]] {
    if (!Array.isArray(sampledValueTypes) || sampledValueTypes.length === 0) {
      throw new Error(`Invalid sampledValueTypes: ${JSON.stringify(sampledValueTypes)}`);
    }

    const sampledValues: SampledValue[] = [];
    for (const sv of sampledValueTypes) {
      const sampledValue: SampledValue = {
        value: sv.value,
        context: MeterValueMapper.fromReadingContextEnumType(sv.context),
        measurand: MeterValueMapper.fromMeasurandEnumType(sv.measurand),
        phase: MeterValueMapper.fromPhaseEnumType(sv.phase),
        location: MeterValueMapper.fromLocationEnumType(sv.location),
      };

      if (sv.signedMeterValue) {
        sampledValue.signedMeterValue = {
          signedMeterData: sv.signedMeterValue.signedMeterData,
          // 2.1 makes signingMethod/publicKey optional; fall back to empty string to satisfy internal schema
          signingMethod: sv.signedMeterValue.signingMethod ?? '',
          encodingMethod: sv.signedMeterValue.encodingMethod,
          publicKey: sv.signedMeterValue.publicKey ?? '',
        };
      }

      if (sv.unitOfMeasure) {
        sampledValue.unitOfMeasure = {
          unit:
            sv.unitOfMeasure.unit ||
            (sampledValue.measurand?.startsWith('Energy') ? 'Wh' : undefined),
          multiplier: sv.unitOfMeasure.multiplier || 0,
        };
      }

      sampledValues.push(sampledValue);
    }

    return sampledValues as [SampledValue, ...SampledValue[]];
  }

  static fromReadingContextEnumType(
    context?: OCPP2_0_1.ReadingContextEnumType | OCPP2_1.ReadingContextEnumType | null,
  ): keyof typeof ReadingContextEnum | undefined {
    if (!context) return undefined;
    switch (context) {
      case OCPP2_0_1.ReadingContextEnumType.Interruption_Begin:
      case OCPP2_1.ReadingContextEnumType.Interruption_Begin:
        return 'Interruption.Begin';
      case OCPP2_0_1.ReadingContextEnumType.Interruption_End:
      case OCPP2_1.ReadingContextEnumType.Interruption_End:
        return 'Interruption.End';
      case OCPP2_0_1.ReadingContextEnumType.Other:
      case OCPP2_1.ReadingContextEnumType.Other:
        return 'Other';
      case OCPP2_0_1.ReadingContextEnumType.Sample_Clock:
      case OCPP2_1.ReadingContextEnumType.Sample_Clock:
        return 'Sample.Clock';
      case OCPP2_0_1.ReadingContextEnumType.Sample_Periodic:
      case OCPP2_1.ReadingContextEnumType.Sample_Periodic:
        return 'Sample.Periodic';
      case OCPP2_0_1.ReadingContextEnumType.Transaction_Begin:
      case OCPP2_1.ReadingContextEnumType.Transaction_Begin:
        return 'Transaction.Begin';
      case OCPP2_0_1.ReadingContextEnumType.Transaction_End:
      case OCPP2_1.ReadingContextEnumType.Transaction_End:
        return 'Transaction.End';
      case OCPP2_0_1.ReadingContextEnumType.Trigger:
      case OCPP2_1.ReadingContextEnumType.Trigger:
        return 'Trigger';
      default:
        return 'Sample.Periodic';
    }
  }

  static fromMeasurandEnumType(
    measurand?: OCPP2_0_1.MeasurandEnumType | OCPP2_1.MeasurandEnumType | null,
  ): keyof typeof MeasurandEnum | undefined {
    if (!measurand) return undefined;
    switch (measurand) {
      case OCPP2_0_1.MeasurandEnumType.Current_Export:
      case OCPP2_1.MeasurandEnumType.Current_Export:
        return 'Current.Export';
      case OCPP2_0_1.MeasurandEnumType.Current_Import:
      case OCPP2_1.MeasurandEnumType.Current_Import:
        return 'Current.Import';
      case OCPP2_0_1.MeasurandEnumType.Current_Offered:
      case OCPP2_1.MeasurandEnumType.Current_Offered:
        return 'Current.Offered';
      case OCPP2_0_1.MeasurandEnumType.Energy_Active_Export_Register:
      case OCPP2_1.MeasurandEnumType.Energy_Active_Export_Register:
        return 'Energy.Active.Export.Register';
      case OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register:
      case OCPP2_1.MeasurandEnumType.Energy_Active_Import_Register:
        return 'Energy.Active.Import.Register';
      case OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Export_Register:
      case OCPP2_1.MeasurandEnumType.Energy_Reactive_Export_Register:
        return 'Energy.Reactive.Export.Register';
      case OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Import_Register:
      case OCPP2_1.MeasurandEnumType.Energy_Reactive_Import_Register:
        return 'Energy.Reactive.Import.Register';
      case OCPP2_0_1.MeasurandEnumType.Energy_Active_Export_Interval:
      case OCPP2_1.MeasurandEnumType.Energy_Active_Export_Interval:
        return 'Energy.Active.Export.Interval';
      case OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval:
      case OCPP2_1.MeasurandEnumType.Energy_Active_Import_Interval:
        return 'Energy.Active.Import.Interval';
      case OCPP2_0_1.MeasurandEnumType.Energy_Active_Net:
      case OCPP2_1.MeasurandEnumType.Energy_Active_Net:
        return 'Energy.Active.Net';
      case OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Export_Interval:
      case OCPP2_1.MeasurandEnumType.Energy_Reactive_Export_Interval:
        return 'Energy.Reactive.Export.Interval';
      case OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Import_Interval:
      case OCPP2_1.MeasurandEnumType.Energy_Reactive_Import_Interval:
        return 'Energy.Reactive.Import.Interval';
      case OCPP2_0_1.MeasurandEnumType.Energy_Reactive_Net:
      case OCPP2_1.MeasurandEnumType.Energy_Reactive_Net:
        return 'Energy.Reactive.Net';
      case OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Net:
      case OCPP2_1.MeasurandEnumType.Energy_Apparent_Net:
        return 'Energy.Apparent.Net';
      case OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Import:
      case OCPP2_1.MeasurandEnumType.Energy_Apparent_Import:
        return 'Energy.Apparent.Import';
      case OCPP2_0_1.MeasurandEnumType.Energy_Apparent_Export:
      case OCPP2_1.MeasurandEnumType.Energy_Apparent_Export:
        return 'Energy.Apparent.Export';
      case OCPP2_0_1.MeasurandEnumType.Frequency:
      case OCPP2_1.MeasurandEnumType.Frequency:
        return 'Frequency';
      case OCPP2_0_1.MeasurandEnumType.Power_Active_Export:
      case OCPP2_1.MeasurandEnumType.Power_Active_Export:
        return 'Power.Active.Export';
      case OCPP2_0_1.MeasurandEnumType.Power_Active_Import:
      case OCPP2_1.MeasurandEnumType.Power_Active_Import:
        return 'Power.Active.Import';
      case OCPP2_0_1.MeasurandEnumType.Power_Factor:
      case OCPP2_1.MeasurandEnumType.Power_Factor:
        return 'Power.Factor';
      case OCPP2_0_1.MeasurandEnumType.Power_Offered:
      case OCPP2_1.MeasurandEnumType.Power_Offered:
        return 'Power.Offered';
      case OCPP2_0_1.MeasurandEnumType.Power_Reactive_Export:
      case OCPP2_1.MeasurandEnumType.Power_Reactive_Export:
        return 'Power.Reactive.Export';
      case OCPP2_0_1.MeasurandEnumType.Power_Reactive_Import:
      case OCPP2_1.MeasurandEnumType.Power_Reactive_Import:
        return 'Power.Reactive.Import';
      case OCPP2_0_1.MeasurandEnumType.SoC:
      case OCPP2_1.MeasurandEnumType.SoC:
        return 'SoC';
      case OCPP2_0_1.MeasurandEnumType.Voltage:
      case OCPP2_1.MeasurandEnumType.Voltage:
        return 'Voltage';
      default:
        return 'Energy.Active.Import.Register';
    }
  }

  static fromPhaseEnumType(
    phase?: OCPP2_0_1.PhaseEnumType | OCPP2_1.PhaseEnumType | null,
  ): keyof typeof PhaseEnum | undefined {
    if (!phase) return undefined;
    switch (phase) {
      case OCPP2_0_1.PhaseEnumType.L1:
      case OCPP2_1.PhaseEnumType.L1:
        return 'L1';
      case OCPP2_0_1.PhaseEnumType.L2:
      case OCPP2_1.PhaseEnumType.L2:
        return 'L2';
      case OCPP2_0_1.PhaseEnumType.L3:
      case OCPP2_1.PhaseEnumType.L3:
        return 'L3';
      case OCPP2_0_1.PhaseEnumType.N:
      case OCPP2_1.PhaseEnumType.N:
        return 'N';
      case OCPP2_0_1.PhaseEnumType.L1_N:
      case OCPP2_1.PhaseEnumType.L1_N:
        return 'L1-N';
      case OCPP2_0_1.PhaseEnumType.L2_N:
      case OCPP2_1.PhaseEnumType.L2_N:
        return 'L2-N';
      case OCPP2_0_1.PhaseEnumType.L3_N:
      case OCPP2_1.PhaseEnumType.L3_N:
        return 'L3-N';
      case OCPP2_0_1.PhaseEnumType.L1_L2:
      case OCPP2_1.PhaseEnumType.L1_L2:
        return 'L1-L2';
      case OCPP2_0_1.PhaseEnumType.L2_L3:
      case OCPP2_1.PhaseEnumType.L2_L3:
        return 'L2-L3';
      case OCPP2_0_1.PhaseEnumType.L3_L1:
      case OCPP2_1.PhaseEnumType.L3_L1:
        return 'L3-L1';
      default:
        return undefined;
    }
  }

  static fromLocationEnumType(
    location?: OCPP2_0_1.LocationEnumType | OCPP2_1.LocationEnumType | null,
  ): keyof typeof LocationEnum | undefined {
    if (!location) return undefined;
    switch (location) {
      case OCPP2_0_1.LocationEnumType.Body:
      case OCPP2_1.LocationEnumType.Body:
        return 'Body';
      case OCPP2_0_1.LocationEnumType.Cable:
      case OCPP2_1.LocationEnumType.Cable:
        return 'Cable';
      case OCPP2_0_1.LocationEnumType.EV:
      case OCPP2_1.LocationEnumType.EV:
        return 'EV';
      case OCPP2_0_1.LocationEnumType.Inlet:
      case OCPP2_1.LocationEnumType.Inlet:
        return 'Inlet';
      case OCPP2_0_1.LocationEnumType.Outlet:
      case OCPP2_1.LocationEnumType.Outlet:
        return 'Outlet';
      default:
        return 'Outlet';
    }
  }
}
