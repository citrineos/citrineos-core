// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export enum AuthorizeResponseStatus {
  Accepted = 'Accepted',
  Blocked = 'Blocked',
  Expired = 'Expired',
  Invalid = 'Invalid',
  ConcurrentTx = 'ConcurrentTx',
}

export enum BootNotificationResponseStatus {
  Accepted = 'Accepted',
  Pending = 'Pending',
  Rejected = 'Rejected',
}

export enum CancelReservationResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum ChangeAvailabilityRequestType {
  Inoperative = 'Inoperative',
  Operative = 'Operative',
}

export enum ChangeAvailabilityResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Scheduled = 'Scheduled',
}

export enum ChangeConfigurationResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  RebootRequired = 'RebootRequired',
  NotSupported = 'NotSupported',
}

export enum ClearCacheResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum ClearChargingProfileRequestChargingProfilePurpose {
  ChargePointMaxProfile = 'ChargePointMaxProfile',
  TxDefaultProfile = 'TxDefaultProfile',
  TxProfile = 'TxProfile',
}

export enum ClearChargingProfileResponseStatus {
  Accepted = 'Accepted',
  Unknown = 'Unknown',
}

export enum DataTransferResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  UnknownMessageId = 'UnknownMessageId',
  UnknownVendorId = 'UnknownVendorId',
}

export enum DiagnosticsStatusNotificationRequestStatus {
  Idle = 'Idle',
  Uploaded = 'Uploaded',
  UploadFailed = 'UploadFailed',
  Uploading = 'Uploading',
}

export enum FirmwareStatusNotificationRequestStatus {
  Downloaded = 'Downloaded',
  DownloadFailed = 'DownloadFailed',
  Downloading = 'Downloading',
  Idle = 'Idle',
  InstallationFailed = 'InstallationFailed',
  Installing = 'Installing',
  Installed = 'Installed',
}

export enum GetCompositeScheduleRequestChargingRateUnit {
  A = 'A',
  W = 'W',
}

export enum GetCompositeScheduleResponseChargingRateUnit {
  A = 'A',
  W = 'W',
}

export enum GetCompositeScheduleResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum MeterValuesRequestContext {
  Interruption_Begin = 'Interruption.Begin',
  Interruption_End = 'Interruption.End',
  Sample_Clock = 'Sample.Clock',
  Sample_Periodic = 'Sample.Periodic',
  Transaction_Begin = 'Transaction.Begin',
  Transaction_End = 'Transaction.End',
  Trigger = 'Trigger',
  Other = 'Other',
}

export enum MeterValuesRequestFormat {
  Raw = 'Raw',
  SignedData = 'SignedData',
}

export enum MeterValuesRequestLocation {
  Cable = 'Cable',
  EV = 'EV',
  Inlet = 'Inlet',
  Outlet = 'Outlet',
  Body = 'Body',
}

export enum MeterValuesRequestMeasurand {
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

export enum MeterValuesRequestPhase {
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

export enum MeterValuesRequestUnit {
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
  Celsius = 'Celsius',
  Fahrenheit = 'Fahrenheit',
  Percent = 'Percent',
}

export enum RemoteStartTransactionRequestChargingProfileKind {
  Absolute = 'Absolute',
  Recurring = 'Recurring',
  Relative = 'Relative',
}

export enum RemoteStartTransactionRequestChargingProfilePurpose {
  ChargePointMaxProfile = 'ChargePointMaxProfile',
  TxDefaultProfile = 'TxDefaultProfile',
  TxProfile = 'TxProfile',
}

export enum RemoteStartTransactionRequestChargingRateUnit {
  A = 'A',
  W = 'W',
}

export enum RemoteStartTransactionRequestRecurrencyKind {
  Daily = 'Daily',
  Weekly = 'Weekly',
}

export enum RemoteStartTransactionResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum RemoteStopTransactionResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum ReserveNowResponseStatus {
  Accepted = 'Accepted',
  Faulted = 'Faulted',
  Occupied = 'Occupied',
  Rejected = 'Rejected',
  Unavailable = 'Unavailable',
}

export enum ResetRequestType {
  Hard = 'Hard',
  Soft = 'Soft',
}

export enum ResetResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum SendLocalListRequestStatus {
  Accepted = 'Accepted',
  Blocked = 'Blocked',
  Expired = 'Expired',
  Invalid = 'Invalid',
  ConcurrentTx = 'ConcurrentTx',
}

export enum SendLocalListRequestUpdateType {
  Differential = 'Differential',
  Full = 'Full',
}

export enum SendLocalListResponseStatus {
  Accepted = 'Accepted',
  Failed = 'Failed',
  NotSupported = 'NotSupported',
  VersionMismatch = 'VersionMismatch',
}

export enum SetChargingProfileRequestChargingProfileKind {
  Absolute = 'Absolute',
  Recurring = 'Recurring',
  Relative = 'Relative',
}

export enum SetChargingProfileRequestChargingProfilePurpose {
  ChargePointMaxProfile = 'ChargePointMaxProfile',
  TxDefaultProfile = 'TxDefaultProfile',
  TxProfile = 'TxProfile',
}

export enum SetChargingProfileRequestChargingRateUnit {
  A = 'A',
  W = 'W',
}

export enum SetChargingProfileRequestRecurrencyKind {
  Daily = 'Daily',
  Weekly = 'Weekly',
}

export enum SetChargingProfileResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  NotSupported = 'NotSupported',
}

export enum StartTransactionResponseStatus {
  Accepted = 'Accepted',
  Blocked = 'Blocked',
  Expired = 'Expired',
  Invalid = 'Invalid',
  ConcurrentTx = 'ConcurrentTx',
}

export enum StatusNotificationRequestErrorCode {
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

export enum StatusNotificationRequestStatus {
  Available = 'Available',
  Preparing = 'Preparing',
  Charging = 'Charging',
  SuspendedEVSE = 'SuspendedEVSE',
  SuspendedEV = 'SuspendedEV',
  Finishing = 'Finishing',
  Reserved = 'Reserved',
  Unavailable = 'Unavailable',
  Faulted = 'Faulted',
}

export enum StopTransactionRequestContext {
  Interruption_Begin = 'Interruption.Begin',
  Interruption_End = 'Interruption.End',
  Sample_Clock = 'Sample.Clock',
  Sample_Periodic = 'Sample.Periodic',
  Transaction_Begin = 'Transaction.Begin',
  Transaction_End = 'Transaction.End',
  Trigger = 'Trigger',
  Other = 'Other',
}

export enum StopTransactionRequestFormat {
  Raw = 'Raw',
  SignedData = 'SignedData',
}

export enum StopTransactionRequestLocation {
  Cable = 'Cable',
  EV = 'EV',
  Inlet = 'Inlet',
  Outlet = 'Outlet',
  Body = 'Body',
}

export enum StopTransactionRequestMeasurand {
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

export enum StopTransactionRequestPhase {
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

export enum StopTransactionRequestReason {
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

export enum StopTransactionRequestUnit {
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

export enum StopTransactionResponseStatus {
  Accepted = 'Accepted',
  Blocked = 'Blocked',
  Expired = 'Expired',
  Invalid = 'Invalid',
  ConcurrentTx = 'ConcurrentTx',
}

export enum TriggerMessageRequestRequestedMessage {
  BootNotification = 'BootNotification',
  DiagnosticsStatusNotification = 'DiagnosticsStatusNotification',
  FirmwareStatusNotification = 'FirmwareStatusNotification',
  Heartbeat = 'Heartbeat',
  MeterValues = 'MeterValues',
  StatusNotification = 'StatusNotification',
}

export enum TriggerMessageResponseStatus {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  NotImplemented = 'NotImplemented',
}

export enum UnlockConnectorResponseStatus {
  Unlocked = 'Unlocked',
  UnlockFailed = 'UnlockFailed',
  NotSupported = 'NotSupported',
}
