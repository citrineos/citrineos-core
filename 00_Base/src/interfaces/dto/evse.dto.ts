// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';

export interface IEvseDto extends IBaseDto {
  databaseId: number;
  id: number;
  connectorId?: number | null;
  // customData?: CustomDataType | null; // Uncomment and define if needed
}

export enum EvseDtoProps {
  databaseId = 'databaseId',
  id = 'id',
  connectorId = 'connectorId',
}
