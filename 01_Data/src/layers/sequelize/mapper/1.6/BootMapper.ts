// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { Boot } from '../../model/Boot';
import { IsEnum } from 'class-validator';

export class BootMapper extends AbstractMapper<Boot> {
  id: string;
  lastBootTime?: string | null;
  heartbeatInterval?: number | null;
  bootRetryInterval?: number | null;
  @IsEnum(OCPP1_6.BootNotificationResponseStatus)
  status: OCPP1_6.BootNotificationResponseStatus;
  changeConfigurationsOnPending?: boolean | null;
  getConfigurationsOnPending?: boolean | null;

  constructor(
    id: string,
    status: OCPP1_6.BootNotificationResponseStatus,
    lastBootTime?: string | null,
    heartbeatInterval?: number | null,
    bootRetryInterval?: number | null,
    changeConfigurationsOnPending?: boolean | null,
    getConfigurationsOnPending?: boolean | null,
  ) {
    super();
    this.id = id;
    this.status = status;
    this.lastBootTime = lastBootTime;
    this.heartbeatInterval = heartbeatInterval;
    this.bootRetryInterval = bootRetryInterval;
    this.changeConfigurationsOnPending = changeConfigurationsOnPending;
    this.getConfigurationsOnPending = getConfigurationsOnPending;

    this.validate();
  }

  toModel(): Boot {
    return Boot.build({
      id: this.id,
      status: this.status,
      lastBootTime: this.lastBootTime,
      heartbeatInterval: this.heartbeatInterval,
      bootRetryInterval: this.bootRetryInterval,
      changeConfigurationsOnPending: this.changeConfigurationsOnPending,
      getConfigurationsOnPending: this.getConfigurationsOnPending,
    });
  }

  static fromModel(boot: Boot): BootMapper {
    return new BootMapper(boot.id, boot.status as OCPP1_6.BootNotificationResponseStatus, boot.lastBootTime, boot.heartbeatInterval, boot.bootRetryInterval, boot.changeConfigurationsOnPending, boot.getConfigurationsOnPending);
  }
}
