// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export interface BootConfig {
  /**
   *  Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  heartbeatInterval?: number | null;
  /**
   * Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  bootRetryInterval?: number | null;
  status: string;
  statusInfo?: object | null;
  /**
   * Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  getBaseReportOnPending?: boolean | null;
  /**
   * Ids of variable attributes to be sent in SetVariablesRequest on pending boot
   */
  pendingBootSetVariableIds?: number[] | null;
  /**
   * Also declared in SystemConfig. If absent, SystemConfig value is used.
   */
  bootWithRejectedVariables?: boolean | null;
  /**
   * Specifically for OCPP 1.6 which plays similar role to pendingBootSetVariableIds
   */
  changeConfigurationsOnPending?: boolean | null;
  /**
   * Specifically for OCPP 1.6 which plays similar role to getBaseReportOnPending
   */
  getConfigurationsOnPending?: boolean | null;
}

/**
 * Cache boot status is used to keep track of the overall boot process for Rejected or Pending.
 * When Accepting a boot, blacklist needs to be cleared if and only if there was a previously
 * Rejected or Pending boot. When starting to configure charger, i.e. sending GetBaseReport or
 * SetVariables, this should only be done if configuring is not still ongoing from a previous
 * BootNotificationRequest. Cache boot status mediates this behavior.
 */
export const BOOT_STATUS = 'boot_status';
