// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * *(2.1)* Indicates whether EV wants to operate in Dynamic or Scheduled mode. When absent, Scheduled mode is assumed for backwards compatibility. +
 * *ISO 15118-20:* +
 * ServiceSelectionReq(SelectedEnergyTransferService)
 *
 */
export enum ControlModeEnumType {
  ScheduledControl = 'ScheduledControl',
  DynamicControl = 'DynamicControl',
}

/**
 * *(2.1)* The _operationMode_ that is currently in effect for the transaction.
 *
 */
export enum OperationModeEnumType {
  Idle = 'Idle',
  ChargingOnly = 'ChargingOnly',
  CentralSetpoint = 'CentralSetpoint',
  ExternalSetpoint = 'ExternalSetpoint',
  ExternalLimits = 'ExternalLimits',
  CentralFrequency = 'CentralFrequency',
  LocalFrequency = 'LocalFrequency',
  LocalLoadBalancing = 'LocalLoadBalancing',
}

/**
 * *(2.1)* The current preconditioning status of the BMS in the EV. Default value is Unknown.
 *
 */
export enum PreconditioningStatusEnumType {
  Unknown = 'Unknown',
  Ready = 'Ready',
  NotReady = 'NotReady',
  Preconditioning = 'Preconditioning',
}

/**
 * *(2.1)* This field is ignored, since the OCPP version to use is determined during the websocket handshake. The field is only kept for backwards compatibility with the OCPP 2.0.1 JSON schema.
 *
 */
export enum OCPPVersionEnumType {
  OCPP12 = 'OCPP12',
  OCPP15 = 'OCPP15',
  OCPP16 = 'OCPP16',
  OCPP20 = 'OCPP20',
  OCPP201 = 'OCPP201',
  OCPP21 = 'OCPP21',
}

/**
 * *(2.1)* Type of monitor.
 *
 */
export enum EventNotificationEnumType {
  HardWiredNotification = 'HardWiredNotification',
  HardWiredMonitor = 'HardWiredMonitor',
  PreconfiguredMonitor = 'PreconfiguredMonitor',
  CustomMonitor = 'CustomMonitor',
}

/**
 * *(2.1)* Value of EVCC indicates that EV determines min/target SOC and departure time. +
 * A value of EVCC_SECC indicates that charging station or CSMS may also update min/target SOC and departure time. +
 * *ISO 15118-20:* +
 * ServiceSelectionReq(SelectedEnergyTransferService)
 *
 */
export enum MobilityNeedsModeEnumType {
  EVCC = 'EVCC',
  EVCC_SECC = 'EVCC_SECC',
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
 * Applicable Network Interface. Charging Station is allowed to use a different network interface to connect if the given one does not work.
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
  Any = 'Any',
}

/**
 * Authentication method.
 *
 */
export enum APNAuthenticationEnumType {
  PAP = 'PAP',
  CHAP = 'CHAP',
  NONE = 'NONE',
  AUTO = 'AUTO',
}

/**
 * Battery in/out
 *
 */
export enum BatterySwapEventEnumType {
  BatteryIn = 'BatteryIn',
  BatteryOut = 'BatteryOut',
  BatteryOutTimeout = 'BatteryOutTimeout',
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
 * Current charging state, is required when state
 * has changed. Omitted when there is no communication between EVSE and EV, because no cable is plugged in.
 *
 */
export enum ChargingStateEnumType {
  EVConnected = 'EVConnected',
  Charging = 'Charging',
  SuspendedEV = 'SuspendedEV',
  SuspendedEVSE = 'SuspendedEVSE',
  Idle = 'Idle',
}

/**
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
 * Defines the purpose of the schedule transferred by this profile
 *
 */
export enum ChargingProfilePurposeEnumType {
  ChargingStationExternalConstraints = 'ChargingStationExternalConstraints',
  ChargingStationMaxProfile = 'ChargingStationMaxProfile',
  TxDefaultProfile = 'TxDefaultProfile',
  TxProfile = 'TxProfile',
  PriorityCharging = 'PriorityCharging',
  LocalGeneration = 'LocalGeneration',
}

/**
 * Defines the transport protocol (e.g. SOAP or JSON). Note: SOAP is not supported in OCPP 2.x, but is supported by earlier versions of OCPP.
 *
 */
export enum OCPPTransportEnumType {
  SOAP = 'SOAP',
  JSON = 'JSON',
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
 * During what state should this message be shown. When omitted this message should be shown in any state of the Charging Station.
 *
 */
export enum MessageStateEnumType {
  Charging = 'Charging',
  Faulted = 'Faulted',
  Idle = 'Idle',
  Unavailable = 'Unavailable',
  Suspended = 'Suspended',
  Discharging = 'Discharging',
}

/**
 * Format of the message.
 *
 */
export enum MessageFormatEnumType {
  ASCII = 'ASCII',
  HTML = 'HTML',
  URI = 'URI',
  UTF8 = 'UTF8',
  QRCODE = 'QRCODE',
}

/**
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
  ManufacturerRootCertificate = 'ManufacturerRootCertificate',
  CSMSRootCertificate = 'CSMSRootCertificate',
  OEMRootCertificate = 'OEMRootCertificate',
}

/**
 * Indicates the kind of schedule.
 *
 */
export enum ChargingProfileKindEnumType {
  Absolute = 'Absolute',
  Recurring = 'Recurring',
  Relative = 'Relative',
  Dynamic = 'Dynamic',
}

/**
 * Indicates the start point of a recurrence.
 *
 */
export enum RecurrencyKindEnumType {
  Daily = 'Daily',
  Weekly = 'Weekly',
}

/**
 * Indicates the type of certificate that is to be signed. When omitted the certificate is to be used for both the 15118 connection (if implemented) and the Charging Station to CSMS connection.
 *
 *
 */
export enum CertificateSigningUseEnumType {
  ChargingStationCertificate = 'ChargingStationCertificate',
  V2GCertificate = 'V2GCertificate',
  V2G20Certificate = 'V2G20Certificate',
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
  OEMRootCertificate = 'OEMRootCertificate',
}

/**
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
  Upstream = 'Upstream',
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
 * Kind of tariff (driver/default)
 *
 */
export enum TariffKindEnumType {
  DefaultTariff = 'DefaultTariff',
  DriverTariff = 'DriverTariff',
}

/**
 * Mode of energy transfer requested by the EV.
 *
 */
export enum EnergyTransferModeEnumType {
  AC_single_phase = 'AC_single_phase',
  AC_two_phase = 'AC_two_phase',
  AC_three_phase = 'AC_three_phase',
  DC = 'DC',
  AC_BPT = 'AC_BPT',
  AC_BPT_DER = 'AC_BPT_DER',
  AC_DER = 'AC_DER',
  DC_BPT = 'DC_BPT',
  DC_ACDP = 'DC_ACDP',
  DC_ACDP_BPT = 'DC_ACDP_BPT',
  WPT = 'WPT',
}

/**
 * Parameter is only sent, if the EV has to feed-in power or reactive power during fault-ride through (FRT) as defined by HVMomCess curve and LVMomCess curve.
 *
 *
 *
 */
export enum PowerDuringCessationEnumType {
  Active = 'Active',
  Reactive = 'Reactive',
}

/**
 * Reason the Charging Station sends this message to the CSMS
 *
 */
export enum TriggerReasonEnumType {
  AbnormalCondition = 'AbnormalCondition',
  Authorized = 'Authorized',
  CablePluggedIn = 'CablePluggedIn',
  ChargingRateChanged = 'ChargingRateChanged',
  ChargingStateChanged = 'ChargingStateChanged',
  CostLimitReached = 'CostLimitReached',
  Deauthorized = 'Deauthorized',
  EnergyLimitReached = 'EnergyLimitReached',
  EVCommunicationLost = 'EVCommunicationLost',
  EVConnectTimeout = 'EVConnectTimeout',
  EVDeparted = 'EVDeparted',
  EVDetected = 'EVDetected',
  LimitSet = 'LimitSet',
  MeterValueClock = 'MeterValueClock',
  MeterValuePeriodic = 'MeterValuePeriodic',
  OperationModeChanged = 'OperationModeChanged',
  RemoteStart = 'RemoteStart',
  RemoteStop = 'RemoteStop',
  ResetCommand = 'ResetCommand',
  RunningCost = 'RunningCost',
  SignedDataReceived = 'SignedDataReceived',
  SoCLimitReached = 'SoCLimitReached',
  StopAuthorized = 'StopAuthorized',
  TariffChanged = 'TariffChanged',
  TariffNotAccepted = 'TariffNotAccepted',
  TimeLimitReached = 'TimeLimitReached',
  Trigger = 'Trigger',
  TxResumed = 'TxResumed',
  UnlockCommand = 'UnlockCommand',
}

/**
 * Result of operation.
 *
 *
 */
export enum DERControlStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  NotSupported = 'NotSupported',
  NotFound = 'NotFound',
}

/**
 * Result of operation.
 *
 */
export enum GenericStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
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
 * Result of the request.
 *
 */
export enum PriorityChargingStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  NoProfile = 'NoProfile',
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
 * Returns whether message was processed successfully.
 *
 */
export enum ChargingProfileStatusEnumType {
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
  NoChargingProfile = 'NoChargingProfile',
}

/**
 * Returns whether the Charging Station has been able to remove the message.
 *
 */
export enum ClearMessageStatusEnumType {
  Accepted = 'Accepted',
  Unknown = 'Unknown',
  Rejected = 'Rejected',
}

/**
 * Source of status: OCSP, CRL
 *
 */
export enum CertificateStatusSourceEnumType {
  CRL = 'CRL',
  OCSP = 'OCSP',
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
 * Status of certificate: good, revoked or unknown.
 *
 */
export enum CertificateStatusEnumType {
  Good = 'Good',
  Revoked = 'Revoked',
  Unknown = 'Unknown',
  Failed = 'Failed',
}

/**
 * Status of operation
 *
 */
export enum TariffGetStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  NoTariff = 'NoTariff',
}

/**
 * Status of the operation
 *
 */
export enum TariffChangeStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  TooManyElements = 'TooManyElements',
  ConditionNotSupported = 'ConditionNotSupported',
  TxNotFound = 'TxNotFound',
  NoCurrencyChange = 'NoCurrencyChange',
}

/**
 * The _stoppedReason_ is the reason/event that initiated the process of stopping the transaction. It will normally be the user stopping authorization via card (Local or MasterPass) or app (Remote), but it can also be CSMS revoking authorization (DeAuthorized), or disconnecting the EV when TxStopPoint = EVConnected (EVDisconnected). Most other reasons are related to technical faults or energy limitations. +
 * MAY only be omitted when _stoppedReason_ is "Local"
 *
 *
 *
 */
export enum ReasonEnumType {
  DeAuthorized = 'DeAuthorized',
  EmergencyStop = 'EmergencyStop',
  EnergyLimitReached = 'EnergyLimitReached',
  EVDisconnected = 'EVDisconnected',
  GroundFault = 'GroundFault',
  ImmediateReset = 'ImmediateReset',
  MasterPass = 'MasterPass',
  Local = 'Local',
  LocalOutOfCredit = 'LocalOutOfCredit',
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
  ReqEnergyTransferRejected = 'ReqEnergyTransferRejected',
}

/**
 * The kind of cost referred to in the message element amount
 *
 */
export enum CostKindEnumType {
  CarbonDioxideEmission = 'CarbonDioxideEmission',
  RelativePricePercentage = 'RelativePricePercentage',
  RenewableGenerationPercentage = 'RenewableGenerationPercentage',
}

/**
 * The status of the settlement attempt.
 *
 *
 */
export enum PaymentStatusEnumType {
  Settled = 'Settled',
  Canceled = 'Canceled',
  Rejected = 'Rejected',
  Failed = 'Failed',
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
  TargetDelta = 'TargetDelta',
  TargetDeltaRelative = 'TargetDeltaRelative',
}

/**
 * The unit of measure in which limits and setpoints are expressed.
 *
 */
export enum ChargingRateUnitEnumType {
  W = 'W',
  A = 'A',
}

/**
 * The updated reservation status.
 *
 */
export enum ReservationUpdateStatusEnumType {
  Expired = 'Expired',
  Removed = 'Removed',
  NoTransaction = 'NoTransaction',
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
  DataCollectorLog = 'DataCollectorLog',
}

/**
 * This contains the type of reset that the Charging Station or EVSE should perform.
 *
 */
export enum ResetEnumType {
  Immediate = 'Immediate',
  OnIdle = 'OnIdle',
  ImmediateAndResume = 'ImmediateAndResume',
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
  LanguageNotSupported = 'LanguageNotSupported',
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
 * Type of EVSE (AC, DC) this tariff applies to.
 *
 */
export enum EvseKindEnumType {
  AC = 'AC',
  DC = 'DC',
}

/**
 * Type of VPN
 *
 */
export enum VPNEnumType {
  IKEv2 = 'IKEv2',
  IPSec = 'IPSec',
  L2TP = 'L2TP',
  PPTP = 'PPTP',
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
 * Type of control.  Determines which setting field below is used.
 *
 *
 */
export enum DERControlEnumType {
  EnterService = 'EnterService',
  FreqDroop = 'FreqDroop',
  FreqWatt = 'FreqWatt',
  FixedPFAbsorb = 'FixedPFAbsorb',
  FixedPFInject = 'FixedPFInject',
  FixedVar = 'FixedVar',
  Gradients = 'Gradients',
  HFMustTrip = 'HFMustTrip',
  HFMayTrip = 'HFMayTrip',
  HVMustTrip = 'HVMustTrip',
  HVMomCess = 'HVMomCess',
  HVMayTrip = 'HVMayTrip',
  LimitMaxDischarge = 'LimitMaxDischarge',
  LFMustTrip = 'LFMustTrip',
  LVMustTrip = 'LVMustTrip',
  LVMomCess = 'LVMomCess',
  LVMayTrip = 'LVMayTrip',
  PowerMonitoringMustTrip = 'PowerMonitoringMustTrip',
  VoltVar = 'VoltVar',
  VoltWatt = 'VoltWatt',
  WattPF = 'WattPF',
  WattVar = 'WattVar',
}

/**
 * Type of cost dimension: energy, power, time, etc.
 *
 *
 */
export enum CostDimensionEnumType {
  Energy = 'Energy',
  MaxCurrent = 'MaxCurrent',
  MinCurrent = 'MinCurrent',
  MaxPower = 'MaxPower',
  MinPower = 'MinPower',
  IdleTIme = 'IdleTIme',
  ChargingTime = 'ChargingTime',
}

/**
 * Type of cost: normal or the minimum or maximum cost.
 *
 */
export enum TariffCostEnumType {
  NormalCost = 'NormalCost',
  MinCost = 'MinCost',
  MaxCost = 'MaxCost',
}

/**
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
 * Type of grid event that caused this
 *
 *
 */
export enum GridEventFaultEnumType {
  CurrentImbalance = 'CurrentImbalance',
  LocalEmergency = 'LocalEmergency',
  LowInputPower = 'LowInputPower',
  OverCurrent = 'OverCurrent',
  OverFrequency = 'OverFrequency',
  OverVoltage = 'OverVoltage',
  PhaseRotation = 'PhaseRotation',
  RemoteEmergency = 'RemoteEmergency',
  UnderFrequency = 'UnderFrequency',
  UnderVoltage = 'UnderVoltage',
  VoltageImbalance = 'VoltageImbalance',
}

/**
 * Type of measurement. Default = "Energy.Active.Import.Register"
 *
 */
export enum MeasurandEnumType {
  Current_Export = 'Current.Export',
  Current_Export_Offered = 'Current.Export.Offered',
  Current_Export_Minimum = 'Current.Export.Minimum',
  Current_Import = 'Current.Import',
  Current_Import_Offered = 'Current.Import.Offered',
  Current_Import_Minimum = 'Current.Import.Minimum',
  Current_Offered = 'Current.Offered',
  Display_PresentSOC = 'Display.PresentSOC',
  Display_MinimumSOC = 'Display.MinimumSOC',
  Display_TargetSOC = 'Display.TargetSOC',
  Display_MaximumSOC = 'Display.MaximumSOC',
  Display_RemainingTimeToMinimumSOC = 'Display.RemainingTimeToMinimumSOC',
  Display_RemainingTimeToTargetSOC = 'Display.RemainingTimeToTargetSOC',
  Display_RemainingTimeToMaximumSOC = 'Display.RemainingTimeToMaximumSOC',
  Display_ChargingComplete = 'Display.ChargingComplete',
  Display_BatteryEnergyCapacity = 'Display.BatteryEnergyCapacity',
  Display_InletHot = 'Display.InletHot',
  Energy_Active_Export_Interval = 'Energy.Active.Export.Interval',
  Energy_Active_Export_Register = 'Energy.Active.Export.Register',
  Energy_Active_Import_Interval = 'Energy.Active.Import.Interval',
  Energy_Active_Import_Register = 'Energy.Active.Import.Register',
  Energy_Active_Import_CableLoss = 'Energy.Active.Import.CableLoss',
  Energy_Active_Import_LocalGeneration_Register = 'Energy.Active.Import.LocalGeneration.Register',
  Energy_Active_Net = 'Energy.Active.Net',
  Energy_Active_Setpoint_Interval = 'Energy.Active.Setpoint.Interval',
  Energy_Apparent_Export = 'Energy.Apparent.Export',
  Energy_Apparent_Import = 'Energy.Apparent.Import',
  Energy_Apparent_Net = 'Energy.Apparent.Net',
  Energy_Reactive_Export_Interval = 'Energy.Reactive.Export.Interval',
  Energy_Reactive_Export_Register = 'Energy.Reactive.Export.Register',
  Energy_Reactive_Import_Interval = 'Energy.Reactive.Import.Interval',
  Energy_Reactive_Import_Register = 'Energy.Reactive.Import.Register',
  Energy_Reactive_Net = 'Energy.Reactive.Net',
  EnergyRequest_Target = 'EnergyRequest.Target',
  EnergyRequest_Minimum = 'EnergyRequest.Minimum',
  EnergyRequest_Maximum = 'EnergyRequest.Maximum',
  EnergyRequest_Minimum_V2X = 'EnergyRequest.Minimum.V2X',
  EnergyRequest_Maximum_V2X = 'EnergyRequest.Maximum.V2X',
  EnergyRequest_Bulk = 'EnergyRequest.Bulk',
  Frequency = 'Frequency',
  Power_Active_Export = 'Power.Active.Export',
  Power_Active_Import = 'Power.Active.Import',
  Power_Active_Setpoint = 'Power.Active.Setpoint',
  Power_Active_Residual = 'Power.Active.Residual',
  Power_Export_Minimum = 'Power.Export.Minimum',
  Power_Export_Offered = 'Power.Export.Offered',
  Power_Factor = 'Power.Factor',
  Power_Import_Offered = 'Power.Import.Offered',
  Power_Import_Minimum = 'Power.Import.Minimum',
  Power_Offered = 'Power.Offered',
  Power_Reactive_Export = 'Power.Reactive.Export',
  Power_Reactive_Import = 'Power.Reactive.Import',
  SoC = 'SoC',
  Voltage = 'Voltage',
  Voltage_Minimum = 'Voltage.Minimum',
  Voltage_Maximum = 'Voltage.Maximum',
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
  SignV2G20Certificate = 'SignV2G20Certificate',
  StatusNotification = 'StatusNotification',
  TransactionEvent = 'TransactionEvent',
  SignCombinedCertificate = 'SignCombinedCertificate',
  PublishFirmwareStatusNotification = 'PublishFirmwareStatusNotification',
  CustomTrigger = 'CustomTrigger',
}

/**
 * Type of trigger for this event, e.g. exceeding a threshold value.
 *
 *
 */
export enum EventTriggerEnumType {
  Alerting = 'Alerting',
  Delta = 'Delta',
  Periodic = 'Periodic',
}

/**
 * Unit of the setpoint.
 *
 */
export enum DERUnitEnumType {
  Not_Applicable = 'Not_Applicable',
  PctMaxW = 'PctMaxW',
  PctMaxVar = 'PctMaxVar',
  PctWAvail = 'PctWAvail',
  PctVarAvail = 'PctVarAvail',
  PctEffectiveV = 'PctEffectiveV',
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
 * With what priority should this message be shown
 *
 */
export enum MessagePriorityEnumType {
  AlwaysFront = 'AlwaysFront',
  InFront = 'InFront',
  NormalCycle = 'NormalCycle',
}

export enum ComponentCriterionEnumType {
  Active = 'Active',
  Available = 'Available',
  Enabled = 'Enabled',
  Problem = 'Problem',
}

export enum DayOfWeekEnumType {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday',
}

export enum GetVariableStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  UnknownComponent = 'UnknownComponent',
  UnknownVariable = 'UnknownVariable',
  NotSupportedAttributeType = 'NotSupportedAttributeType',
}

export enum IslandingDetectionEnumType {
  NoAntiIslandingSupport = 'NoAntiIslandingSupport',
  RoCoF = 'RoCoF',
  UVP_OVP = 'UVP_OVP',
  UFP_OFP = 'UFP_OFP',
  VoltageVectorShift = 'VoltageVectorShift',
  ZeroCrossingDetection = 'ZeroCrossingDetection',
  OtherPassive = 'OtherPassive',
  ImpedanceMeasurement = 'ImpedanceMeasurement',
  ImpedanceAtFrequency = 'ImpedanceAtFrequency',
  SlipModeFrequencyShift = 'SlipModeFrequencyShift',
  SandiaFrequencyShift = 'SandiaFrequencyShift',
  SandiaVoltageShift = 'SandiaVoltageShift',
  FrequencyJump = 'FrequencyJump',
  RCLQFactor = 'RCLQFactor',
  OtherActive = 'OtherActive',
}

export enum MonitoringCriterionEnumType {
  ThresholdMonitoring = 'ThresholdMonitoring',
  DeltaMonitoring = 'DeltaMonitoring',
  PeriodicMonitoring = 'PeriodicMonitoring',
}

export enum NotifyAllowedEnergyTransferStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum TariffClearStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  NoTariff = 'NoTariff',
}

export enum TariffSetStatusEnumType {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  TooManyElements = 'TooManyElements',
  ConditionNotSupported = 'ConditionNotSupported',
  DuplicateTariffId = 'DuplicateTariffId',
}
