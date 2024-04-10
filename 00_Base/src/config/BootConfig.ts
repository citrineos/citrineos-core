// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { RegistrationStatusEnumType, StatusInfoType } from '../ocpp/model';

export interface BootConfig {
  /**
   *  Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  heartbeatInterval?: number;
  /**
   * Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  bootRetryInterval?: number;
  status: RegistrationStatusEnumType;
  statusInfo?: StatusInfoType;
  /**
   * Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  getBaseReportOnPending?: boolean;
  /**
   * Ids of variable attributes to be sent in SetVariablesRequest on pending boot
   */
  pendingBootSetVariableIds?: number[];
  /**
   * Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  bootWithRejectedVariables?: boolean;
}

/**
 * Cache boot status is used to keep track of the overall boot process for Rejected or Pending.
 * When Accepting a boot, blacklist needs to be cleared if and only if there was a previously
 * Rejected or Pending boot. When starting to configure charger, i.e. sending GetBaseReport or
 * SetVariables, this should only be done if configuring is not still ongoing from a previous
 * BootNotificationRequest. Cache boot status mediates this behavior.
 */
export const BOOT_STATUS = "boot_status";
