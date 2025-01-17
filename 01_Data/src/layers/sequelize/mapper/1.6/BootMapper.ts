// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { Boot } from '../../model/Boot';
import { IsEnum } from 'class-validator';

export class BootMapper extends AbstractMapper {
  id: string;
  lastBootTime?: string | null;
  heartbeatInterval?: number | null;
  bootRetryInterval?: number | null;
  @IsEnum(OCPP1_6.BootNotificationResponseStatus)
  status: OCPP1_6.BootNotificationResponseStatus;
  changeConfigurationsOnPending?: boolean | null;
  getConfigurationsOnPending?: boolean | null;

  constructor(boot: Boot) {
    super();
    this.id = boot.id;
    this.status = boot.status as OCPP1_6.BootNotificationResponseStatus;
    this.lastBootTime = boot.lastBootTime;
    this.heartbeatInterval = boot.heartbeatInterval;
    this.bootRetryInterval = boot.bootRetryInterval;
    this.changeConfigurationsOnPending = boot.changeConfigurationsOnPending;
    this.getConfigurationsOnPending = boot.getConfigurationsOnPending;
    this.validate();
  }

  toModel(): Boot {
    return {
      id: this.id,
      lastBootTime: this.lastBootTime,
      heartbeatInterval: this.heartbeatInterval,
      bootRetryInterval: this.bootRetryInterval,
      status: this.status,
      changeConfigurationsOnPending: this.changeConfigurationsOnPending,
      getConfigurationsOnPending: this.getConfigurationsOnPending,
    } as Boot;
  }
}
