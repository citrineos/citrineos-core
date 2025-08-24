// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from '../../index.js';

export interface IEvseTypeDto extends IBaseDto {
  databaseId?: number;
  id: number;
  connectorId?: number | null;
}

export enum EvseTypeDtoProps {
  databaseId = 'databaseId',
  id = 'id',
  connectorId = 'connectorId',
}
