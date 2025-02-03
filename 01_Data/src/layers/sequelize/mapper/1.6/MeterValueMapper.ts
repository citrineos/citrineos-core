// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AbstractMapper } from '../AbstractMapper';
import { ArrayMinSize, IsArray, IsEnum, ValidateIf, ValidateNested } from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';
import { MeterValue } from '../../model/TransactionEvent';
import { OCPP1_6 } from '@citrineos/base';

export class MeterValueMapper extends AbstractMapper<MeterValue> {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SampledValue)
  sampledValue: SampledValue[];
  timestamp: string;
  transactionDatabaseId?: number | null;
  connectorDatabaseId?: number | null;

  constructor(sampledValue: SampledValue[], timestamp: string, transactionDatabaseId?: number | null, connectorDatabaseId?: number | null) {
    super();
    this.sampledValue = sampledValue;
    this.timestamp = timestamp;
    this.transactionDatabaseId = transactionDatabaseId;
    this.connectorDatabaseId = connectorDatabaseId;
    this.validate();
  }

  toModel(): MeterValue {
    return MeterValue.build({
      timestamp: this.timestamp,
      sampledValue: this.sampledValue as [SampledValue, ...SampledValue[]],
      transactionDatabaseId: this.transactionDatabaseId,
      connectorDatabaseId: this.connectorDatabaseId,
    });
  }

  static fromModel(meterValue: MeterValue): MeterValueMapper {
    const sampledValues = plainToInstance(SampledValue, meterValue.sampledValue);
    return new MeterValueMapper(sampledValues, meterValue.timestamp, meterValue.transactionDatabaseId, meterValue.connectorDatabaseId);
  }

  static fromRequest(request: OCPP1_6.MeterValuesRequest): MeterValueMapper[] {
    const mappers: MeterValueMapper[] = [];
    for (const value of request.meterValue) {
      const sampledValues = plainToInstance(SampledValue, value.sampledValue);
      mappers.push(new MeterValueMapper(sampledValues, value.timestamp));
    }
    return mappers;
  }
}

export class SampledValue {
  value: string;
  @ValidateIf((o) => o.context)
  @IsEnum(OCPP1_6.MeterValuesRequestContext, { message: 'Invalid context value.' })
  context?: OCPP1_6.MeterValuesRequestContext | null;
  @ValidateIf((o) => o.format)
  @IsEnum(OCPP1_6.MeterValuesRequestFormat, { message: 'Invalid format value.' })
  format?: OCPP1_6.MeterValuesRequestFormat | null;
  @ValidateIf((o) => o.measurand)
  @IsEnum(OCPP1_6.MeterValuesRequestMeasurand, { message: 'Invalid measurand value.' })
  measurand?: OCPP1_6.MeterValuesRequestMeasurand | null;
  @ValidateIf((o) => o.phase)
  @IsEnum(OCPP1_6.MeterValuesRequestPhase, { message: 'Invalid phase value.' })
  phase?: OCPP1_6.MeterValuesRequestPhase | null;
  @ValidateIf((o) => o.location)
  @IsEnum(OCPP1_6.MeterValuesRequestLocation, { message: 'Invalid location value.' })
  location?: OCPP1_6.MeterValuesRequestLocation | null;
  @ValidateIf((o) => o.unit)
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
