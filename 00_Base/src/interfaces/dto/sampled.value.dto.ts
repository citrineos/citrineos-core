// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto.js';
import {
  LocationEnumType,
  MeasurandEnumType,
  PhaseEnumType,
  ReadingContextEnumType,
} from '../../ocpp/model/2.0.1/index.js';

export interface ISampledValueDto extends IBaseDto {
  value: number;
  context?: ReadingContextEnumType;
  measurand?: MeasurandEnumType;
  phase?: PhaseEnumType | null;
  location?: LocationEnumType;
  signedMeterValue?: ISignedMeterValue;
  unitOfMeasure?: IUnitOfMeasure;
}

export interface ISignedMeterValue {
  signedMeterData: string;
  signingMethod: string;
  encodingMethod: string;
  publicKey: string;
}

export interface IUnitOfMeasure {
  unit?: string;
  multiplier?: number;
}

export enum SampledValueDtoProps {
  value = 'value',
  context = 'context',
  measurand = 'measurand',
  phase = 'phase',
  location = 'location',
  signedMeterValue = 'signedMeterValue',
  unitOfMeasure = 'unitOfMeasure',
}
