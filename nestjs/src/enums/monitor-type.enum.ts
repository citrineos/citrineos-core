// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/** OCPP 2.0.1 / 2.1 MonitorEnumType — used by SetMonitoringData. */
export enum MonitorEnumType {
  UpperThreshold = 'UpperThreshold',
  LowerThreshold = 'LowerThreshold',
  Delta = 'Delta',
  Periodic = 'Periodic',
  PeriodicClockAligned = 'PeriodicClockAligned',
}
