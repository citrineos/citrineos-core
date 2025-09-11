// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto, IComponentDto } from '../..';

export interface IMessageInfoDto extends IBaseDto {
  databaseId: number;
  stationId: string;
  id?: number;
  priority: any;
  state?: any;
  startDateTime?: string | null;
  endDateTime?: string | null;
  transactionId?: string | null;
  message: any;
  active: boolean;
  display: IComponentDto;
  displayComponentId?: number | null;
}
