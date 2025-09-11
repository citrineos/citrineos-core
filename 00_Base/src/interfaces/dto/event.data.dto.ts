// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from './base.dto';
import { OCPP2_0_1 } from '../..';
import { IVariableDto, IComponentDto } from '.';

export interface IEventDataDto extends IBaseDto {
  id?: number;
  stationId: string;
  eventId: number;
  trigger: OCPP2_0_1.EventTriggerEnumType;
  cause?: number | null;
  timestamp: string;
  actualValue: string;
  techCode?: string | null;
  techInfo?: string | null;
  cleared?: boolean | null;
  transactionId?: string | null;
  variableMonitoringId?: number | null;
  eventNotificationType: OCPP2_0_1.EventNotificationEnumType;
  variable: IVariableDto;
  variableId?: number;
  component: IComponentDto;
  componentId?: number;
  //   customData?: OCPP2_0_1.CustomDataType | null;
}

export enum EventDataDtoProps {
  stationId = 'stationId',
  eventId = 'eventId',
  trigger = 'trigger',
  cause = 'cause',
  timestamp = 'timestamp',
  actualValue = 'actualValue',
  techCode = 'techCode',
  techInfo = 'techInfo',
  cleared = 'cleared',
  transactionId = 'transactionId',
  variableMonitoringId = 'variableMonitoringId',
  eventNotificationType = 'eventNotificationType',
  variable = 'variable',
  variableId = 'variableId',
  component = 'component',
  componentId = 'componentId',
  customData = 'customData',
}
