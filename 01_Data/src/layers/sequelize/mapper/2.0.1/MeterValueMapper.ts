// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { MeterValue } from '../../model/TransactionEvent';

export class MeterValueMapper {
  static toMeterValueType(meterValue: MeterValue): OCPP2_0_1.MeterValueType {
    return {
      timestamp: meterValue.timestamp,
      sampledValue: MeterValueMapper.toSampledValueTypes(meterValue.sampledValue),
    }
  }

  static toSampledValueTypes(sampledValues: any): [OCPP2_0_1.SampledValueType, ...OCPP2_0_1.SampledValueType[]] {
    if (!(sampledValues instanceof Array) || sampledValues.length === 0) {
      throw new Error(`Invalid sampledValues: ${JSON.stringify(sampledValues)}`);
    }

    const sampledValueTypes: OCPP2_0_1.SampledValueType[] = [];
    for (const sampledValue of sampledValues) {
      sampledValueTypes.push({
        value: sampledValue.value,
        context: sampledValue.context,
        measurand: sampledValue.measurand,
        phase: sampledValue.phase,
        location: sampledValue.location,
        signedMeterValue: sampledValue.signedMeterValue ? {
          signedMeterData: sampledValue.signedMeterValue.signedMeterData,
          signingMethod: sampledValue.signedMeterValue.signingMethod,
          encodingMethod: sampledValue.signedMeterValue.encodingMethod,
          publicKey: sampledValue.signedMeterValue.publicKey,
        } : undefined,
        unitOfMeasure: sampledValue.unitOfMeasure ? {
          unit: sampledValue.unitOfMeasure.unit,
          multiplier: sampledValue.unitOfMeasure.multiplier,
        }: undefined,
      });
    }
    return sampledValueTypes as [OCPP2_0_1.SampledValueType, ...OCPP2_0_1.SampledValueType[]];
  }
}