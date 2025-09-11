// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IBaseDto } from '../..';

export interface IOCPPMessageDto extends IBaseDto {
  id?: number;
  stationId: string;
  correlationId?: string;
  origin: any;
  protocol: any;
  action?: any;
  message: any;
  timestamp: string;
}

export enum OCPPMessageDtoProps {
  id = 'id',
  stationId = 'stationId',
  correlationId = 'correlationId',
  origin = 'origin',
  protocol = 'protocol',
  action = 'action',
  message = 'message',
  timestamp = 'timestamp',
}
