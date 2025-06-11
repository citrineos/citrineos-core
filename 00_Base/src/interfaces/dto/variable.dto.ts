// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';

export interface IVariableDto extends IBaseDto {
  id: number;
  name: string;
  instance?: string | null;
}

export enum VariableDtoProps {
  id = 'id',
  name = 'name',
  instance = 'instance',
}
