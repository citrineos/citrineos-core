// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from '../..';

export interface ISubscriptionDto extends IBaseDto {
  id?: number;
  stationId: string;
  onConnect: boolean;
  onClose: boolean;
  onMessage: boolean;
  sentMessage: boolean;
  messageRegexFilter?: string | null;
  url: string;
}
