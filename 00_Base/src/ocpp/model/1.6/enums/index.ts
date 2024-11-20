// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export enum ChargingProfileKind {
  Absolute = 'Absolute',
  Recurring = 'Recurring',
  Relative = 'Relative',
}

export enum ChargingProfilePurpose {
  ChargePointMaxProfile = 'ChargePointMaxProfile',
  TxDefaultProfile = 'TxDefaultProfile',
  TxProfile = 'TxProfile',
}

export enum ChargingRateUnit {
  A = 'A',
  W = 'W',
}

export enum Context {
  Interruption_Begin = 'Interruption.Begin',
  Interruption_End = 'Interruption.End',
  Sample_Clock = 'Sample.Clock',
  Sample_Periodic = 'Sample.Periodic',
  Transaction_Begin = 'Transaction.Begin',
  Transaction_End = 'Transaction.End',
  Trigger = 'Trigger',
  Other = 'Other',
}

export enum ErrorCode {
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

export enum Format {
  Raw = 'Raw',
  SignedData = 'SignedData',
}

export enum Location {
  Cable = 'Cable',
  EV = 'EV',
  Inlet = 'Inlet',
  Outlet = 'Outlet',
  Body = 'Body',
}

export enum Measurand {
  Energy_Active_Export_Register = 'Energy.Active.Export.Register',
  Energy_Active_Import_Register = 'Energy.Active.Import.Register',
  Energy_Reactive_Export_Register = 'Energy.Reactive.Export.Register',
  Energy_Reactive_Import_Register = 'Energy.Reactive.Import.Register',
  Energy_Active_Export_Interval = 'Energy.Active.Export.Interval',
  Energy_Active_Import_Interval = 'Energy.Active.Import.Interval',
  Energy_Reactive_Export_Interval = 'Energy.Reactive.Export.Interval',
  Energy_Reactive_Import_Interval = 'Energy.Reactive.Import.Interval',
  Power_Active_Export = 'Power.Active.Export',
  Power_Active_Import = 'Power.Active.Import',
  Power_Offered = 'Power.Offered',
  Power_Reactive_Export = 'Power.Reactive.Export',
  Power_Reactive_Import = 'Power.Reactive.Import',
  Power_Factor = 'Power.Factor',
  Current_Import = 'Current.Import',
  Current_Export = 'Current.Export',
  Current_Offered = 'Current.Offered',
  Voltage = 'Voltage',
  Frequency = 'Frequency',
  Temperature = 'Temperature',
  SoC = 'SoC',
  RPM = 'RPM',
}

export enum Phase {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  N = 'N',
  L1_N = 'L1-N',
  L2_N = 'L2-N',
  L3_N = 'L3-N',
  L1_L2 = 'L1-L2',
  L2_L3 = 'L2-L3',
  L3_L1 = 'L3-L1',
}

export enum Reason {
  EmergencyStop = 'EmergencyStop',
  EVDisconnected = 'EVDisconnected',
  HardReset = 'HardReset',
  Local = 'Local',
  Other = 'Other',
  PowerLoss = 'PowerLoss',
  Reboot = 'Reboot',
  Remote = 'Remote',
  SoftReset = 'SoftReset',
  UnlockCommand = 'UnlockCommand',
  DeAuthorized = 'DeAuthorized',
}

export enum RecurrencyKind {
  Daily = 'Daily',
  Weekly = 'Weekly',
}

export enum RequestedMessage {
  BootNotification = 'BootNotification',
  DiagnosticsStatusNotification = 'DiagnosticsStatusNotification',
  FirmwareStatusNotification = 'FirmwareStatusNotification',
  Heartbeat = 'Heartbeat',
  MeterValues = 'MeterValues',
  StatusNotification = 'StatusNotification',
}

export enum Status {
  Unlocked = 'Unlocked',
  UnlockFailed = 'UnlockFailed',
  NotSupported = 'NotSupported',
}

export enum Type {
  Hard = 'Hard',
  Soft = 'Soft',
}

export enum Unit {
  Wh = 'Wh',
  kWh = 'kWh',
  varh = 'varh',
  kvarh = 'kvarh',
  W = 'W',
  kW = 'kW',
  VA = 'VA',
  kVA = 'kVA',
  var = 'var',
  kvar = 'kvar',
  A = 'A',
  V = 'V',
  K = 'K',
  Celcius = 'Celcius',
  Fahrenheit = 'Fahrenheit',
  Percent = 'Percent',
}

export enum UpdateType {
  Differential = 'Differential',
  Full = 'Full',
}
