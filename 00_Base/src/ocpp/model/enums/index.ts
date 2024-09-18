// Copyright 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * APN. APN_ Authentication. APN_ Authentication_ Code
 * urn:x-oca:ocpp:uid:1:568828
 * Authentication method.
 *
 */
export enum APNAuthenticationEnumType {
  CHAP = 'CHAP',
  NONE = 'NONE',
  PAP = 'PAP',
  AUTO = 'AUTO',
}

/**
 * Accepted if the Charging Station has executed the request, otherwise rejected.
 *
 */
export enum ClearCacheStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

/**
 * Applicable Network Interface.
 *
 */
export enum OCPPInterfaceEnumType {
  Wired0 = 'Wired0',
  Wired1 = 'Wired1',
  Wired2 = 'Wired2',
  Wired3 = 'Wired3',
  Wireless0 = 'Wireless0',
  Wireless1 = 'Wireless1',
  Wireless2 = 'Wireless2',
  Wireless3 = 'Wireless3',
}

/**
 * Certificate status information.
 * - if all certificates are valid: return 'Accepted'.
 * - if one of the certificates was revoked, return 'CertificateRevoked'.
 *
 */
export enum AuthorizeCertificateStatusEnumType {
  Accepted = 'Accepted',
  SignatureError = 'SignatureError',
  CertificateExpired = 'CertificateExpired',
  CertificateRevoked = 'CertificateRevoked',
  NoCertificateAvailable = 'NoCertificateAvailable',
  CertChainError = 'CertChainError',
  ContractCancelled = 'ContractCancelled',
}

/**
 * Charging Station indicates if installation was successful.
 *
 */
export enum InstallCertificateStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Failed = 'Failed',
}

/**
 * Charging Station indicates if it can process the request.
 *
 */
export enum DeleteCertificateStatusEnumType {
  Accepted = 'Accepted',
  Failed = 'Failed',
  NotFound = 'NotFound',
}

/**
 * Charging Station indicates if it can process the request.
 *
 */
export enum GetInstalledCertificateStatusEnumType {
  Accepted = 'Accepted',
  NotFound = 'NotFound',
}

/**
 * Charging_ Needs. Requested. Energy_ Transfer_ Mode_ Code
 * urn:x-oca:ocpp:uid:1:569209
 * Mode of energy transfer requested by the EV.
 *
 */
export enum EnergyTransferModeEnumType {
  DC = 'DC',
  AC_single_phase = 'AC_single_phase',
  AC_two_phase = 'AC_two_phase',
  AC_three_phase = 'AC_three_phase',
}

/**
 * Charging_ Profile. Charging_ Profile_ Kind. Charging_ Profile_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569232
 * Indicates the kind of schedule.
 *
 */
export enum ChargingProfileKindEnumType {
  Absolute = 'Absolute',
  Recurring = 'Recurring',
  Relative = 'Relative',
}

/**
 * Charging_ Profile. Charging_ Profile_ Purpose. Charging_ Profile_ Purpose_ Code
 * urn:x-oca:ocpp:uid:1:569231
 * Defines the purpose of the schedule transferred by this profile
 *
 */
export enum ChargingProfilePurposeEnumType {
  ChargingStationExternalConstraints = 'ChargingStationExternalConstraints',
  ChargingStationMaxProfile = 'ChargingStationMaxProfile',
  TxDefaultProfile = 'TxDefaultProfile',
  TxProfile = 'TxProfile',
}

/**
 * Charging_ Profile. Recurrency_ Kind. Recurrency_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569233
 * Indicates the start point of a recurrence.
 *
 */
export enum RecurrencyKindEnumType {
  Daily = 'Daily',
  Weekly = 'Weekly',
}

/**
 * Charging_ Schedule. Charging_ Rate_ Unit. Charging_ Rate_ Unit_ Code
 * urn:x-oca:ocpp:uid:1:569238
 * The unit of measure Limit is expressed in.
 *
 */
export enum ChargingRateUnitEnumType {
  W = 'W',
  A = 'A',
}

/**
 * Communication_ Function. OCPP_ Transport. OCPP_ Transport_ Code
 * urn:x-oca:ocpp:uid:1:569356
 * Defines the transport protocol (e.g. SOAP or JSON). Note: SOAP is not supported in OCPP 2.0, but is supported by other versions of OCPP.
 *
 */
export enum OCPPTransportEnumType {
  JSON = 'JSON',
  SOAP = 'SOAP',
}

/**
 * Communication_ Function. OCPP_ Version. OCPP_ Version_ Code
 * urn:x-oca:ocpp:uid:1:569355
 * Defines the OCPP version used for this communication function.
 *
 */
export enum OCPPVersionEnumType {
  OCPP12 = 'OCPP12',
  OCPP15 = 'OCPP15',
  OCPP16 = 'OCPP16',
  OCPP20 = 'OCPP20',
}

/**
 * Cost. Cost_ Kind. Cost_ Kind_ Code
 * urn:x-oca:ocpp:uid:1:569243
 * The kind of cost referred to in the message element amount
 *
 */
export enum CostKindEnumType {
  CarbonDioxideEmission = 'CarbonDioxideEmission',
  RelativePricePercentage = 'RelativePricePercentage',
  RenewableGenerationPercentage = 'RenewableGenerationPercentage',
}

/**
 * Data type of this variable.
 *
 */
export enum DataEnumType {
  string = 'string',
  decimal = 'decimal',
  integer = 'integer',
  dateTime = 'dateTime',
  boolean = 'boolean',
  OptionList = 'OptionList',
  SequenceList = 'SequenceList',
  MemberList = 'MemberList',
  passwordString = 'passwordString',
}

/**
 * Defines the mutability of this attribute. Default is ReadWrite when omitted.
 *
 */
export enum MutabilityEnumType {
  ReadOnly = 'ReadOnly',
  WriteOnly = 'WriteOnly',
  ReadWrite = 'ReadWrite',
}

/**
 * Defines whether certificate needs to be installed or updated.
 *
 */
export enum CertificateActionEnumType {
  Install = 'Install',
  Update = 'Update',
}

/**
 * Enumeration of possible idToken types.
 *
 */
export enum IdTokenEnumType {
  Central = 'Central',
  eMAID = 'eMAID',
  ISO14443 = 'ISO14443',
  ISO15693 = 'ISO15693',
  KeyCode = 'KeyCode',
  Local = 'Local',
  MacAddress = 'MacAddress',
  NoAuthorization = 'NoAuthorization',
}

/**
 * ID_ Token. Status. Authorization_ Status
 * urn:x-oca:ocpp:uid:1:569372
 * Current status of the ID Token.
 *
 */
export enum AuthorizationStatusEnumType {
  Accepted = 'Accepted',
  Blocked = 'Blocked',
  ConcurrentTx = 'ConcurrentTx',
  Expired = 'Expired',
  Invalid = 'Invalid',
  NoCredit = 'NoCredit',
  NotAllowedTypeEVSE = 'NotAllowedTypeEVSE',
  NotAtThisLocation = 'NotAtThisLocation',
  NotAtThisTime = 'NotAtThisTime',
  Unknown = 'Unknown',
}

/**
 * Indicates if the Charging Station has Display Messages that match the request criteria in the &lt;&lt;getdisplaymessagesrequest,GetDisplayMessagesRequest&gt;&gt;
 *
 */
export enum GetDisplayMessagesStatusEnumType {
  Accepted = 'Accepted',
  Unknown = 'Unknown',
}

/**
 * Indicates if the Charging Station was able to execute the request.
 *
 */
export enum ClearChargingProfileStatusEnumType {
  Accepted = 'Accepted',
  Unknown = 'Unknown',
}

/**
 * Indicates the certificate type that is sent.
 *
 */
export enum InstallCertificateUseEnumType {
  V2GRootCertificate = 'V2GRootCertificate',
  MORootCertificate = 'MORootCertificate',
  CSMSRootCertificate = 'CSMSRootCertificate',
  ManufacturerRootCertificate = 'ManufacturerRootCertificate',
}

/**
 * Indicates the type of certificate that is to be signed. When omitted the certificate is to be used for both the 15118 connection (if implemented) and the Charging Station to CSMS connection.
 *
 *
 */
export enum CertificateSigningUseEnumType {
  ChargingStationCertificate = 'ChargingStationCertificate',
  V2GCertificate = 'V2GCertificate',
}

/**
 * Indicates the type of the requested certificate(s).
 *
 */
export enum GetCertificateIdUseEnumType {
  V2GRootCertificate = 'V2GRootCertificate',
  MORootCertificate = 'MORootCertificate',
  CSMSRootCertificate = 'CSMSRootCertificate',
  V2GCertificateChain = 'V2GCertificateChain',
  ManufacturerRootCertificate = 'ManufacturerRootCertificate',
}

/**
 * Indicates whether the Charging Station was able to accept the request.
 *
 */
export enum GenericDeviceModelStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  NotSupported = 'NotSupported',
  EmptyResultSet = 'EmptyResultSet',
}

/**
 * Indicates whether the Charging Station will send the requested notification or not.
 *
 */
export enum TriggerMessageStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  NotImplemented = 'NotImplemented',
}

/**
 * Indicates whether the Local Controller succeeded in unpublishing the firmware.
 *
 */
export enum UnpublishFirmwareStatusEnumType {
  DownloadOngoing = 'DownloadOngoing',
  NoFirmware = 'NoFirmware',
  Unpublished = 'Unpublished',
}

/**
 * Indicates whether the message was processed properly.
 *
 */
export enum Iso15118EVCertificateStatusEnumType {
  Accepted = 'Accepted',
  Failed = 'Failed',
}

/**
 * Indicates whether the request was accepted.
 *
 */
export enum CustomerInformationStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Invalid = 'Invalid',
}

/**
 * Message_ Content. Format. Message_ Format_ Code
 * urn:x-enexis:ecdm:uid:1:570848
 * Format of the message.
 *
 */
export enum MessageFormatEnumType {
  ASCII = 'ASCII',
  HTML = 'HTML',
  URI = 'URI',
  UTF8 = 'UTF8',
}

/**
 * Message_ Info. Priority. Message_ Priority_ Code
 * urn:x-enexis:ecdm:uid:1:569253
 * With what priority should this message be shown
 *
 */
export enum MessagePriorityEnumType {
  AlwaysFront = 'AlwaysFront',
  InFront = 'InFront',
  NormalCycle = 'NormalCycle',
}

/**
 * Message_ Info. State. Message_ State_ Code
 * urn:x-enexis:ecdm:uid:1:569254
 * During what state should this message be shown. When omitted this message should be shown in any state of the Charging Station.
 *
 */
export enum MessageStateEnumType {
  Charging = 'Charging',
  Faulted = 'Faulted',
  Idle = 'Idle',
  Unavailable = 'Unavailable',
}

/**
 * Reason the Charging Station sends this message to the CSMS
 *
 */
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

/**
 * Result of operation.
 *
 */
export enum SetNetworkProfileStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Failed = 'Failed',
}

/**
 * Result of the clear request for this monitor, identified by its Id.
 *
 *
 */
export enum ClearMonitoringStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  NotFound = 'NotFound',
}

/**
 * Result status of getting the variable.
 *
 *
 */
export enum GetVariableStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  UnknownComponent = 'UnknownComponent',
  UnknownVariable = 'UnknownVariable',
  NotSupportedAttributeType = 'NotSupportedAttributeType',
}

/**
 * Result status of setting the variable.
 *
 */
export enum SetVariableStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  UnknownComponent = 'UnknownComponent',
  UnknownVariable = 'UnknownVariable',
  NotSupportedAttributeType = 'NotSupportedAttributeType',
  RebootRequired = 'RebootRequired',
}

/**
 * Returns whether certificate signing has been accepted, otherwise rejected.
 *
 */
export enum CertificateSignedStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

/**
 * Returns whether the CSMS has been able to process the message successfully. It does not imply that the evChargingNeeds can be met with the current charging profile.
 *
 */
export enum NotifyEVChargingNeedsStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Processing = 'Processing',
}

/**
 * Returns whether the Charging Station has been able to process the message successfully. This does not guarantee the schedule will be followed to the letter. There might be other constraints the Charging Station may need to take into account.
 *
 */
export enum ChargingProfileStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

/**
 * Returns whether the Charging Station has been able to remove the message.
 *
 */
export enum ClearMessageStatusEnumType {
  Accepted = 'Accepted',
  Unknown = 'Unknown',
}

/**
 * Sampled_ Value. Context. Reading_ Context_ Code
 * urn:x-oca:ocpp:uid:1:569261
 * Type of detail value: start, end or sample. Default = "Sample.Periodic"
 *
 */
export enum ReadingContextEnumType {
  Interruption_Begin = 'Interruption.Begin',
  Interruption_End = 'Interruption.End',
  Other = 'Other',
  Sample_Clock = 'Sample.Clock',
  Sample_Periodic = 'Sample.Periodic',
  Transaction_Begin = 'Transaction.Begin',
  Transaction_End = 'Transaction.End',
  Trigger = 'Trigger',
}

/**
 * Sampled_ Value. Location. Location_ Code
 * urn:x-oca:ocpp:uid:1:569265
 * Indicates where the measured value has been sampled. Default =  "Outlet"
 *
 *
 */
export enum LocationEnumType {
  Body = 'Body',
  Cable = 'Cable',
  EV = 'EV',
  Inlet = 'Inlet',
  Outlet = 'Outlet',
}

/**
 * Sampled_ Value. Measurand. Measurand_ Code
 * urn:x-oca:ocpp:uid:1:569263
 * Type of measurement. Default = "Energy.Active.Import.Register"
 *
 */
export enum MeasurandEnumType {
  Current_Export = 'Current.Export',
  Current_Import = 'Current.Import',
  Current_Offered = 'Current.Offered',
  Energy_Active_Export_Register = 'Energy.Active.Export.Register',
  Energy_Active_Import_Register = 'Energy.Active.Import.Register',
  Energy_Reactive_Export_Register = 'Energy.Reactive.Export.Register',
  Energy_Reactive_Import_Register = 'Energy.Reactive.Import.Register',
  Energy_Active_Export_Interval = 'Energy.Active.Export.Interval',
  Energy_Active_Import_Interval = 'Energy.Active.Import.Interval',
  Energy_Active_Net = 'Energy.Active.Net',
  Energy_Reactive_Export_Interval = 'Energy.Reactive.Export.Interval',
  Energy_Reactive_Import_Interval = 'Energy.Reactive.Import.Interval',
  Energy_Reactive_Net = 'Energy.Reactive.Net',
  Energy_Apparent_Net = 'Energy.Apparent.Net',
  Energy_Apparent_Import = 'Energy.Apparent.Import',
  Energy_Apparent_Export = 'Energy.Apparent.Export',
  Frequency = 'Frequency',
  Power_Active_Export = 'Power.Active.Export',
  Power_Active_Import = 'Power.Active.Import',
  Power_Factor = 'Power.Factor',
  Power_Offered = 'Power.Offered',
  Power_Reactive_Export = 'Power.Reactive.Export',
  Power_Reactive_Import = 'Power.Reactive.Import',
  SoC = 'SoC',
  Voltage = 'Voltage',
}

/**
 * Sampled_ Value. Phase. Phase_ Code
 * urn:x-oca:ocpp:uid:1:569264
 * Indicates how the measured value is to be interpreted. For instance between L1 and neutral (L1-N) Please note that not all values of phase are applicable to all Measurands. When phase is absent, the measured value is interpreted as an overall value.
 *
 */
export enum PhaseEnumType {
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

/**
 * Source that has installed this charging profile.
 *
 */
export enum ChargingLimitSourceEnumType {
  EMS = 'EMS',
  Other = 'Other',
  SO = 'SO',
  CSO = 'CSO',
}

/**
 * Specifies the event notification type of the message.
 *
 *
 */
export enum EventNotificationEnumType {
  HardWiredNotification = 'HardWiredNotification',
  HardWiredMonitor = 'HardWiredMonitor',
  PreconfiguredMonitor = 'PreconfiguredMonitor',
  CustomMonitor = 'CustomMonitor',
}

/**
 * Specifies whether the CSMS can process the request.
 *
 */
export enum GenericStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

/**
 * Specify which monitoring base will be set
 *
 */
export enum MonitoringBaseEnumType {
  All = 'All',
  FactoryDefault = 'FactoryDefault',
  HardWiredOnly = 'HardWiredOnly',
}

/**
 * Status indicating whether Charging Station accepts the request to stop a transaction.
 *
 */
export enum RequestStartStopStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

/**
 * Status is OK if a value could be returned. Otherwise this will indicate the reason why a value could not be returned.
 *
 */
export enum SetMonitoringStatusEnumType {
  Accepted = 'Accepted',
  UnknownComponent = 'UnknownComponent',
  UnknownVariable = 'UnknownVariable',
  UnsupportedMonitorType = 'UnsupportedMonitorType',
  Rejected = 'Rejected',
  Duplicate = 'Duplicate',
}

/**
 * The type of this monitor, e.g. a threshold, delta or periodic monitor.
 *
 *
 */
export enum MonitorEnumType {
  UpperThreshold = 'UpperThreshold',
  LowerThreshold = 'LowerThreshold',
  Delta = 'Delta',
  Periodic = 'Periodic',
  PeriodicClockAligned = 'PeriodicClockAligned',
}

/**
 * The updated reservation status.
 *
 */
export enum ReservationUpdateStatusEnumType {
  Expired = 'Expired',
  Removed = 'Removed',
}

/**
 * This contains the current status of the Connector.
 *
 */
export enum ConnectorStatusEnumType {
  Available = 'Available',
  Occupied = 'Occupied',
  Reserved = 'Reserved',
  Unavailable = 'Unavailable',
  Faulted = 'Faulted',
}

/**
 * This contains the progress status of the firmware installation.
 *
 */
export enum FirmwareStatusEnumType {
  Downloaded = 'Downloaded',
  DownloadFailed = 'DownloadFailed',
  Downloading = 'Downloading',
  DownloadScheduled = 'DownloadScheduled',
  DownloadPaused = 'DownloadPaused',
  Idle = 'Idle',
  InstallationFailed = 'InstallationFailed',
  Installing = 'Installing',
  Installed = 'Installed',
  InstallRebooting = 'InstallRebooting',
  InstallScheduled = 'InstallScheduled',
  InstallVerificationFailed = 'InstallVerificationFailed',
  InvalidSignature = 'InvalidSignature',
  SignatureVerified = 'SignatureVerified',
}

/**
 * This contains the progress status of the publishfirmware
 * installation.
 *
 */
export enum PublishFirmwareStatusEnumType {
  Idle = 'Idle',
  DownloadScheduled = 'DownloadScheduled',
  Downloading = 'Downloading',
  Downloaded = 'Downloaded',
  Published = 'Published',
  DownloadFailed = 'DownloadFailed',
  DownloadPaused = 'DownloadPaused',
  InvalidChecksum = 'InvalidChecksum',
  ChecksumVerified = 'ChecksumVerified',
  PublishFailed = 'PublishFailed',
}

/**
 * This contains the reason for sending this message to the CSMS.
 *
 */
export enum BootReasonEnumType {
  ApplicationReset = 'ApplicationReset',
  FirmwareUpdate = 'FirmwareUpdate',
  LocalReset = 'LocalReset',
  PowerUp = 'PowerUp',
  RemoteReset = 'RemoteReset',
  ScheduledReset = 'ScheduledReset',
  Triggered = 'Triggered',
  Unknown = 'Unknown',
  Watchdog = 'Watchdog',
}

/**
 * This contains the status of the log upload.
 *
 */
export enum UploadLogStatusEnumType {
  BadMessage = 'BadMessage',
  Idle = 'Idle',
  NotSupportedOperation = 'NotSupportedOperation',
  PermissionDenied = 'PermissionDenied',
  Uploaded = 'Uploaded',
  UploadFailure = 'UploadFailure',
  Uploading = 'Uploading',
  AcceptedCanceled = 'AcceptedCanceled',
}

/**
 * This contains the type of availability change that the Charging Station should perform.
 *
 *
 */
export enum OperationalStatusEnumType {
  Inoperative = 'Inoperative',
  Operative = 'Operative',
}

/**
 * This contains the type of log file that the Charging Station
 * should send.
 *
 */
export enum LogEnumType {
  DiagnosticsLog = 'DiagnosticsLog',
  SecurityLog = 'SecurityLog',
}

/**
 * This contains the type of reset that the Charging Station or EVSE should perform.
 *
 */
export enum ResetEnumType {
  Immediate = 'Immediate',
  OnIdle = 'OnIdle',
}

/**
 * This contains the type of this event.
 * The first TransactionEvent of a transaction SHALL contain: "Started" The last TransactionEvent of a transaction SHALL contain: "Ended" All others SHALL contain: "Updated"
 *
 */
export enum TransactionEventEnumType {
  Ended = 'Ended',
  Started = 'Started',
  Updated = 'Updated',
}

/**
 * This contains the type of update (full or differential) of this request.
 *
 */
export enum UpdateEnumType {
  Differential = 'Differential',
  Full = 'Full',
}

/**
 * This contains whether the Charging Station has been registered
 * within the CSMS.
 *
 */
export enum RegistrationStatusEnumType {
  Accepted = 'Accepted',
  Pending = 'Pending',
  Rejected = 'Rejected',
}

/**
 * This field indicates whether the Charging Station was able to accept the request.
 *
 *
 */
export enum UpdateFirmwareStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  AcceptedCanceled = 'AcceptedCanceled',
  InvalidCertificate = 'InvalidCertificate',
  RevokedCertificate = 'RevokedCertificate',
}

/**
 * This field indicates whether the Charging Station was able to accept the request.
 *
 */
export enum LogStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  AcceptedCanceled = 'AcceptedCanceled',
}

/**
 * This field specifies the connector type.
 *
 */
export enum ConnectorEnumType {
  cCCS1 = 'cCCS1',
  cCCS2 = 'cCCS2',
  cG105 = 'cG105',
  cTesla = 'cTesla',
  cType1 = 'cType1',
  cType2 = 'cType2',
  s309_1P_16A = 's309-1P-16A',
  s309_1P_32A = 's309-1P-32A',
  s309_3P_16A = 's309-3P-16A',
  s309_3P_32A = 's309-3P-32A',
  sBS1361 = 'sBS1361',
  sCEE_7_7 = 'sCEE-7-7',
  sType2 = 'sType2',
  sType3 = 'sType3',
  Other1PhMax16A = 'Other1PhMax16A',
  Other1PhOver16A = 'Other1PhOver16A',
  Other3Ph = 'Other3Ph',
  Pan = 'Pan',
  wInductive = 'wInductive',
  wResonant = 'wResonant',
  Undetermined = 'Undetermined',
  Unknown = 'Unknown',
}

/**
 * This field specifies the report base.
 *
 */
export enum ReportBaseEnumType {
  ConfigurationInventory = 'ConfigurationInventory',
  FullInventory = 'FullInventory',
  SummaryInventory = 'SummaryInventory',
}

/**
 * This indicates the success or failure of the canceling of a reservation by CSMS.
 *
 */
export enum CancelReservationStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

/**
 * This indicates the success or failure of the data transfer.
 *
 */
export enum DataTransferStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  UnknownMessageId = 'UnknownMessageId',
  UnknownVendorId = 'UnknownVendorId',
}

/**
 * This indicates the success or failure of the reservation.
 *
 */
export enum ReserveNowStatusEnumType {
  Accepted = 'Accepted',
  Faulted = 'Faulted',
  Occupied = 'Occupied',
  Rejected = 'Rejected',
  Unavailable = 'Unavailable',
}

/**
 * This indicates whether the Charging Station has successfully received and applied the update of the Local Authorization List.
 *
 */
export enum SendLocalListStatusEnumType {
  Accepted = 'Accepted',
  Failed = 'Failed',
  VersionMismatch = 'VersionMismatch',
}

/**
 * This indicates whether the Charging Station has unlocked the connector.
 *
 */
export enum UnlockStatusEnumType {
  Unlocked = 'Unlocked',
  UnlockFailed = 'UnlockFailed',
  OngoingAuthorizedTransaction = 'OngoingAuthorizedTransaction',
  UnknownConnector = 'UnknownConnector',
}

/**
 * This indicates whether the Charging Station is able to display the message.
 *
 */
export enum DisplayMessageStatusEnumType {
  Accepted = 'Accepted',
  NotSupportedMessageFormat = 'NotSupportedMessageFormat',
  Rejected = 'Rejected',
  NotSupportedPriority = 'NotSupportedPriority',
  NotSupportedState = 'NotSupportedState',
  UnknownTransaction = 'UnknownTransaction',
}

/**
 * This indicates whether the Charging Station is able to perform the availability change.
 *
 */
export enum ChangeAvailabilityStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Scheduled = 'Scheduled',
}

/**
 * This indicates whether the Charging Station is able to perform the reset.
 *
 */
export enum ResetStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Scheduled = 'Scheduled',
}

/**
 * This indicates whether the Charging Station is able to process this request and will send &lt;&lt;reportchargingprofilesrequest, ReportChargingProfilesRequest&gt;&gt; messages.
 *
 */
export enum GetChargingProfileStatusEnumType {
  Accepted = 'Accepted',
  NoProfiles = 'NoProfiles',
}

/**
 * This indicates whether the charging station was able to retrieve the OCSP certificate status.
 *
 */
export enum GetCertificateStatusEnumType {
  Accepted = 'Accepted',
  Failed = 'Failed',
}

/**
 * Transaction. State. Transaction_ State_ Code
 * urn:x-oca:ocpp:uid:1:569419
 * Current charging state, is required when state
 * has changed.
 *
 */
export enum ChargingStateEnumType {
  Charging = 'Charging',
  EVConnected = 'EVConnected',
  SuspendedEV = 'SuspendedEV',
  SuspendedEVSE = 'SuspendedEVSE',
  Idle = 'Idle',
}

/**
 * Transaction. Stopped_ Reason. EOT_ Reason_ Code
 * urn:x-oca:ocpp:uid:1:569413
 * This contains the reason why the transaction was stopped. MAY only be omitted when Reason is "Local".
 *
 */
export enum ReasonEnumType {
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

/**
 * Type of attribute: Actual, Target, MinSet, MaxSet. Default is Actual when omitted.
 *
 */
export enum AttributeEnumType {
  Actual = 'Actual',
  Target = 'Target',
  MinSet = 'MinSet',
  MaxSet = 'MaxSet',
}

/**
 * Type of message to be triggered.
 *
 */
export enum MessageTriggerEnumType {
  BootNotification = 'BootNotification',
  LogStatusNotification = 'LogStatusNotification',
  FirmwareStatusNotification = 'FirmwareStatusNotification',
  Heartbeat = 'Heartbeat',
  MeterValues = 'MeterValues',
  SignChargingStationCertificate = 'SignChargingStationCertificate',
  SignV2GCertificate = 'SignV2GCertificate',
  StatusNotification = 'StatusNotification',
  TransactionEvent = 'TransactionEvent',
  SignCombinedCertificate = 'SignCombinedCertificate',
  PublishFirmwareStatusNotification = 'PublishFirmwareStatusNotification',
}

/**
 * Type of monitor that triggered this event, e.g. exceeding a threshold value.
 *
 *
 */
export enum EventTriggerEnumType {
  Alerting = 'Alerting',
  Delta = 'Delta',
  Periodic = 'Periodic',
}

/**
 * Used algorithms for the hashes provided.
 *
 */
export enum HashAlgorithmEnumType {
  SHA256 = 'SHA256',
  SHA384 = 'SHA384',
  SHA512 = 'SHA512',
}

/**
 * VPN. Type. VPN_ Code
 * urn:x-oca:ocpp:uid:1:569277
 * Type of VPN
 *
 */
export enum VPNEnumType {
  IKEv2 = 'IKEv2',
  IPSec = 'IPSec',
  L2TP = 'L2TP',
  PPTP = 'PPTP',
}

export enum ComponentCriterionEnumType {
  Active = 'Active',
  Available = 'Available',
  Enabled = 'Enabled',
  Problem = 'Problem',
}

export enum MonitoringCriterionEnumType {
  ThresholdMonitoring = 'ThresholdMonitoring',
  DeltaMonitoring = 'DeltaMonitoring',
  PeriodicMonitoring = 'PeriodicMonitoring',
}
