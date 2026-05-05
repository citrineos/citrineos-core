// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum TriggerReasonEnumType {
  Authorized = 'Authorized',
  CablePluggedIn = 'CablePluggedIn',
  ChargingRateChanged = 'ChargingRateChanged',
  ChargingStateChanged = 'ChargingStateChanged',
  Deauthorized = 'Deauthorized',
  EnergyLimitReached = 'EnergyLimitReached',
  EVCommunicationLost = 'EVCommunicationLost',
  EVConnectTimeout = 'EVConnectTimeout',
  MeterValueClock = 'MeterValueClock',
  MeterValuePeriodic = 'MeterValuePeriodic',
  TimeLimitReached = 'TimeLimitReached',
  Trigger = 'Trigger',
  UnlockCommand = 'UnlockCommand',
  StopAuthorized = 'StopAuthorized',
  EVDeparted = 'EVDeparted',
  EVDetected = 'EVDetected',
  RemoteStop = 'RemoteStop',
  RemoteStart = 'RemoteStart',
  AbnormalCondition = 'AbnormalCondition',
  SignedDataReceived = 'SignedDataReceived',
  ResetCommand = 'ResetCommand',
}
