// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IBaseDto } from './base.dto.js';

export interface IIdTokenDto extends IBaseDto {
  id: number;
  idToken: string;
  type?: any;
}

export enum IdTokenDtoProps {
  id = 'id',
  idToken = 'idToken',
  type = 'type',
}
