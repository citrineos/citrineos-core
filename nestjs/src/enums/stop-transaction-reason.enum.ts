// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum StopTransactionReasonEnumType {
  DeAuthorized = 'DeAuthorized',
  EmergencyStop = 'EmergencyStop',
  EnergyLimitReached = 'EnergyLimitReached',
  EVDisconnected = 'EVDisconnected',
  GroundFault = 'GroundFault',
  ImmediateReset = 'ImmediateReset',
  Local = 'Local',
  LocalOutOfCredit = 'LocalOutOfCredit',
  MasterPass = 'MasterPass',
  Other = 'Other',
  OvercurrentFault = 'OvercurrentFault',
  PowerLoss = 'PowerLoss',
  PowerQuality = 'PowerQuality',
  Reboot = 'Reboot',
  Remote = 'Remote',
  SOCLimitReached = 'SOCLimitReached',
  StoppedByEV = 'StoppedByEV',
  TimeLimitReached = 'TimeLimitReached',
  Timeout = 'Timeout',
}
