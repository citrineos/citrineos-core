// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { IsArray } from 'class-validator';
import { MeterValue} from '../../model/TransactionEvent';

export class MeterValueMapper extends AbstractMapper<MeterValue> {
  @IsArray()
  sampledValue: [OCPP2_0_1.SampledValueType, ...OCPP2_0_1.SampledValueType[]];
  timestamp: string;
  transactionEventId?: number | null;
  transactionDatabaseId?: number | null;
  customData?: OCPP2_0_1.CustomDataType | null;

  constructor(sampledValue: [OCPP2_0_1.SampledValueType, ...OCPP2_0_1.SampledValueType[]], timestamp: string, transactionEventId?: number | null, transactionDatabaseId?: number | null, customData?: OCPP2_0_1.CustomDataType | null) {
    super();
    this.sampledValue = sampledValue;
    this.timestamp = timestamp;
    this.transactionEventId = transactionEventId;
    this.transactionDatabaseId = transactionDatabaseId;
    this.customData = customData;
    this.validate();
    this.validateSampledValue(sampledValue, 0, '');
  }

  toModel(): MeterValue {
    return MeterValue.build({
      timestamp: this.timestamp,
      sampledValue: this.sampledValue,
      transactionEventId: this.transactionEventId,
      transactionDatabaseId: this.transactionDatabaseId,
      customData: this.customData,
    });
  }

  static fromModel(meterValue: MeterValue): MeterValueMapper {
    return new MeterValueMapper(
      meterValue.sampledValue as [OCPP2_0_1.SampledValueType, ...OCPP2_0_1.SampledValueType[]],
      meterValue.timestamp,
      meterValue.transactionEventId,
      meterValue.transactionDatabaseId,
      meterValue.customData as OCPP2_0_1.CustomDataType | null
    );
  }

  private validateSampledValue(sampledValues: [OCPP2_0_1.SampledValueType, ...OCPP2_0_1.SampledValueType[]], index: number, errors: string) {
    if (index === sampledValues.length) {
      if (errors.length > 0) {
        throw new Error(errors);
      } else {
        return;
      }
    }
    const sampledValue = sampledValues[index];
    if (!sampledValue.value) {
      errors += `sampledValue[${index}].value is not defined. `;
    }
    if (sampledValue.context && !Object.values(OCPP2_0_1.ReadingContextEnumType).includes(sampledValue.context)) {
      errors += `sampledValue[${index}].context: ${sampledValue.context} is invalid. `;
    }
    if (sampledValue.measurand && !Object.values(OCPP2_0_1.MeasurandEnumType).includes(sampledValue.measurand)) {
      errors += `sampledValue[${index}].measurand: ${sampledValue.measurand} is invalid. `;
    }
    if (sampledValue.phase && !Object.values(OCPP2_0_1.PhaseEnumType).includes(sampledValue.phase)) {
      errors += `sampledValue[${index}].phase: ${sampledValue.phase} is invalid. `;
    }
    if (sampledValue.location && !Object.values(OCPP2_0_1.LocationEnumType).includes(sampledValue.location)) {
      errors += `sampledValue[${index}].location: ${sampledValue.location} is invalid. `;
    }

    this.validateSampledValue(sampledValues, index + 1, errors);
  }
}
