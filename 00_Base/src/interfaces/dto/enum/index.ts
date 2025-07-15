// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum ConnectorStatus {
  Available = 'Available',
  Preparing = 'Preparing',
  Charging = 'Charging',
  SuspendedEVSE = 'SuspendedEVSE',
  SuspendedEV = 'SuspendedEV',
  Finishing = 'Finishing',
  Reserved = 'Reserved',
  Unavailable = 'Unavailable',
  Faulted = 'Faulted',
  Unknown = 'Unknown',
}

export enum ConnectorErrorCode {
  ConnectorLockFailure = 'ConnectorLockFailure',
  EVCommunicationError = 'EVCommunicationError',
  GroundFailure = 'GroundFailure',
  HighTemperature = 'HighTemperature',
  InternalError = 'InternalError',
  LocalListConflict = 'LocalListConflict',
  NoError = 'NoError',
  OtherError = 'OtherError',
  OverCurrentFailure = 'OverCurrentFailure',
  PowerMeterFailure = 'PowerMeterFailure',
  PowerSwitchFailure = 'PowerSwitchFailure',
  ReaderFailure = 'ReaderFailure',
  ResetFailure = 'ResetFailure',
  UnderVoltage = 'UnderVoltage',
  OverVoltage = 'OverVoltage',
  WeakSignal = 'WeakSignal',
}

export enum ChargingStationParkingRestriction {
  EvOnly = 'EvOnly',
  Plugged = 'Plugged',
  Disabled = 'Disabled',
  Customers = 'Customers',
  Motorcycles = 'Motorcycles',
}

export enum ChargingStationCapability {
  ChargingProfileCapable = 'ChargingProfileCapable',
  ChargingPreferencesCapable = 'ChargingPreferencesCapable',
  ChipCardSupport = 'ChipCardSupport',
  ContactlessCardSupport = 'ContactlessCardSupport',
  CreditCardPayable = 'CreditCardPayable',
  DebitCardPayable = 'DebitCardPayable',
  PedTerminal = 'PedTerminal',
  RemoteStartStopCapable = 'RemoteStartStopCapable',
  Reservable = 'Reservable',
  RfidReader = 'RfidReader',
  StartSessionConnectorRequired = 'StartSessionConnectorRequired',
  TokenGroupCapable = 'TokenGroupCapable',
  UnlockCapable = 'UnlockCapable',
}
