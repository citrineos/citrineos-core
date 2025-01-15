// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { Boot } from '../../model/Boot';

export class BootMapper extends AbstractMapper {
  lastBootTime?: string;
  heartbeatInterval?: number;
  bootRetryInterval?: number;
  status: OCPP1_6.BootNotificationResponseStatus;
  changeConfigurationsOnPending?: boolean;
  getConfigurationsOnPending?: boolean;

  constructor(boot: Boot) {
    super();
    try {
      this.status = boot.status as OCPP1_6.BootNotificationResponseStatus;
      this.lastBootTime = boot.lastBootTime;
      this.heartbeatInterval = boot.heartbeatInterval;
      this.bootRetryInterval = boot.bootRetryInterval;
      this.changeConfigurationsOnPending = boot.changeConfigurationsOnPending;
      this.getConfigurationsOnPending = boot.getConfigurationsOnPending;
    } catch (error) {
      throw new Error(`Generate BootMapper from Boot failed: ${error}`);
    }
  }

  toModel(): Boot {
    return {
      lastBootTime: this.lastBootTime,
      heartbeatInterval: this.heartbeatInterval,
      bootRetryInterval: this.bootRetryInterval,
      status: this.status,
      changeConfigurationsOnPending: this.changeConfigurationsOnPending,
      getConfigurationsOnPending: this.getConfigurationsOnPending,
    } as Boot;
  }
}
