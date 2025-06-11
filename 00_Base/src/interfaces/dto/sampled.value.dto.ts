// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';

export interface ISampledValueDto extends IBaseDto {
  value: number;
  context?: any; // Use ReadingContextEnumType if available
  measurand?: any; // Use MeasurandEnumType if available
  phase?: any; // Use PhaseEnumType if available
  location?: any; // Use LocationEnumType if available
  signedMeterValue?: any; // Use SignedMeterValue if available
  unitOfMeasure?: any; // Use UnitOfMeasure if available
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
