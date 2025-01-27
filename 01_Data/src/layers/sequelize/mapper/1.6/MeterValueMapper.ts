// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AbstractMapper } from '../AbstractMapper';
import { ArrayMinSize, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';
import { MeterValue } from '../../model/TransactionEvent';
import { OCPP1_6 } from '@citrineos/base';

export class MeterValueMapper extends AbstractMapper<MeterValue> {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SampleValue)
  sampledValue: SampleValue[];
  timestamp: string;
  transactionDatabaseId?: number | null;

  constructor(sampledValue: SampleValue[], timestamp: string, transactionDatabaseId?: number | null) {
    super();
    this.sampledValue = sampledValue;
    this.timestamp = timestamp;
    this.transactionDatabaseId = transactionDatabaseId;
    console.debug(`this meter value: ${JSON.stringify(this)}`);
    this.validate();
  }

  toModel(): MeterValue {
    return MeterValue.build({
      timestamp: this.timestamp,
      sampledValue: this.sampledValue as [SampleValue, ...SampleValue[]],
      transactionDatabaseId: this.transactionDatabaseId,
    });
  }

  static fromModel(meterValue: MeterValue): MeterValueMapper {
    const sampledValues = plainToInstance(SampleValue, meterValue.sampledValue);
    console.debug(`sampledValues: ${JSON.stringify(sampledValues)}`);
    return new MeterValueMapper(sampledValues, meterValue.timestamp, meterValue.transactionDatabaseId);
  }
}

export class SampleValue {
  value: string;
  @IsEnum(OCPP1_6.MeterValuesRequestContext, { message: 'Invalid context value.' })
  context?: OCPP1_6.MeterValuesRequestContext | null;
  @IsEnum(OCPP1_6.MeterValuesRequestFormat, { message: 'Invalid format value.' })
  format?: OCPP1_6.MeterValuesRequestFormat | null;
  @IsEnum(OCPP1_6.MeterValuesRequestMeasurand, { message: 'Invalid measurand value.' })
  measurand?: OCPP1_6.MeterValuesRequestMeasurand | null;
  @IsEnum(OCPP1_6.MeterValuesRequestPhase, { message: 'Invalid phase value.' })
  phase?: OCPP1_6.MeterValuesRequestPhase | null;
  @IsEnum(OCPP1_6.MeterValuesRequestLocation, { message: 'Invalid location value.' })
  location?: OCPP1_6.MeterValuesRequestLocation | null;
  @IsEnum(OCPP1_6.MeterValuesRequestUnit, { message: 'Invalid unit value.' })
  unit?: OCPP1_6.MeterValuesRequestUnit | null;

  constructor(
    value: string,
    context?: OCPP1_6.MeterValuesRequestContext,
    format?: OCPP1_6.MeterValuesRequestFormat,
    measurand?: OCPP1_6.MeterValuesRequestMeasurand,
    phase?: OCPP1_6.MeterValuesRequestPhase,
    location?: OCPP1_6.MeterValuesRequestLocation,
    unit?: OCPP1_6.MeterValuesRequestUnit,
  ) {
    this.value = value;
    this.context = context;
    this.format = format;
    this.measurand = measurand;
    this.phase = phase;
    this.location = location;
    this.unit = unit;
  }
}
