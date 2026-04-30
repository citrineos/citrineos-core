// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

export const AsyncJobNameSchema = z.enum(['FETCH_OCPI_TOKENS']);

export const AsyncJobActionSchema = z.enum(['RESUME', 'STOP']);

export const AttributeEnumSchema = z.enum(['Actual', 'Target', 'MinSet', 'MaxSet']);

export const AuthorizationStatusEnumSchema = z.enum([
  'Accepted',
  'Blocked',
  'ConcurrentTx',
  'Expired',
  'Invalid',
  'NoCredit',
  'NotAllowedTypeEVSE',
  'NotAtThisLocation',
  'NotAtThisTime',
  'Unknown',
]);

export const AuthorizationWhitelistEnumSchema = z.enum(['Never', 'Allowed', 'AllowedOffline']);

export const AuthorizeCertificateStatusEnumSchema = z.enum([
  'Accepted',
  'SignatureError',
  'CertificateExpired',
  'CertificateRevoked',
  'NoCertificateAvailable',
  'CertChainError',
  'ContractCancelled',
]);

export const CancelReservationStatusEnumSchema = z.enum(['Accepted', 'Rejected']);

export const ChargingProfileStatusEnumSchema = z.enum(['Accepted', 'Rejected']);

export const ClearChargingProfileStatusEnumSchema = z.enum(['Accepted', 'Unknown']);

export const CertificateSigningUseEnumSchema = z.enum([
  'ChargingStationCertificate',
  'V2GCertificate',
  'V2G20Certificate',
]);

export const CertificateUseEnumSchema = z.enum([
  'V2GRootCertificate',
  'MORootCertificate',
  'CSMSRootCertificate',
  'V2GCertificateChain',
  'ManufacturerRootCertificate',
  'OEMRootCertificate',
]);

export const ChargingLimitSourceEnumSchema = z.enum(['EMS', 'Other', 'SO', 'CSO']);

export const ChargingProfileKindEnumSchema = z.enum(['Absolute', 'Recurring', 'Relative']);

export const ChargingProfilePurposeEnumSchema = z.enum([
  'ChargingStationExternalConstraints',
  'ChargingStationMaxProfile',
  'TxDefaultProfile',
  'TxProfile',
]);

export const ChargingRateUnitEnumSchema = z.enum(['W', 'A']);

export const ChargingStateEnumSchema = z.enum([
  'Charging',
  'EVConnected',
  'SuspendedEV',
  'SuspendedEVSE',
  'Idle',
]);

export const ChargingStationCapabilitySchema = z.enum([
  'ChargingProfileCapable',
  'ChargingPreferencesCapable',
  'ChipCardSupport',
  'ContactlessCardSupport',
  'CreditCardPayable',
  'DebitCardPayable',
  'PEDTerminal',
  'RemoteStartStopCapable',
  'Reservable',
  'RFIDReader',
  'StartSessionConnectorRequired',
  'TokenGroupCapable',
  'UnlockCapable',
]);

export const ChargingStationParkingRestrictionSchema = z.enum([
  'EVOnly',
  'Plugged',
  'Disabled',
  'Customers',
  'Motorcycles',
]);

export const ChargingStationSequenceTypeSchema = z.enum([
  'customerInformation',
  'getBaseReport',
  'getChargingProfiles',
  'getDisplayMessages',
  'getLog',
  'getMonitoringReport',
  'getReport',
  'publishFirmware',
  'remoteStartId',
  'updateFirmware',
  'transactionId',
]);

export const ClearMessageStatusEnumSchema = z.enum(['Accepted', 'Unknown', 'Rejected']);

export const ConnectorErrorCodeEnumSchema = z.enum([
  'ConnectorLockFailure',
  'EVCommunicationError',
  'GroundFailure',
  'HighTemperature',
  'InternalError',
  'LocalListConflict',
  'NoError',
  'OtherError',
  'OverCurrentFailure',
  'PowerMeterFailure',
  'PowerSwitchFailure',
  'ReaderFailure',
  'ResetFailure',
  'UnderVoltage',
  'OverVoltage',
  'WeakSignal',
]);

export const ConnectorFormatEnumSchema = z.enum(['Socket', 'Cable']);

export const ConnectorPowerTypeEnumSchema = z.enum([
  'AC1Phase',
  'AC2Phase',
  'AC2PhaseSplit',
  'AC3Phase',
  'DC',
]);

export const ConnectorStatusEnumSchema = z.enum([
  'Available',
  'Occupied',
  'Preparing',
  'Charging',
  'SuspendedEVSE',
  'SuspendedEV',
  'Finishing',
  'Reserved',
  'Unavailable',
  'Faulted',
  'Unknown',
]);

export const ConnectorTypeEnumSchema = z.enum([
  'CHAdeMO',
  'ChaoJi',
  'DomesticA',
  'DomesticB',
  'DomesticC',
  'DomesticD',
  'DomesticE',
  'DomesticF',
  'DomesticG',
  'DomesticH',
  'DomesticI',
  'DomesticJ',
  'DomesticK',
  'DomesticL',
  'DomesticM',
  'DomesticN',
  'DomesticO',
  'GBTAC',
  'GBTDC',
  'IEC603092Single16',
  'IEC603092Three16',
  'IEC603092Three32',
  'IEC603092Three64',
  'IEC62196T1',
  'IEC62196T1COMBO',
  'IEC62196T2',
  'IEC62196T2COMBO',
  'IEC62196T3A',
  'IEC62196T3C',
  'NEMA520',
  'NEMA630',
  'NEMA650',
  'NEMA1030',
  'NEMA1050',
  'NEMA1430',
  'NEMA1450',
  'PantographBottomUp',
  'PantographTopDown',
  'TeslaR',
  'TeslaS',
]);

export const DataEnumSchema = z.enum([
  'string',
  'decimal',
  'integer',
  'dateTime',
  'boolean',
  'OptionList',
  'SequenceList',
  'MemberList',
  'passwordString',
]);

export const DataTransferEnumSchema = z.enum([
  'Accepted',
  'Rejected',
  'UnknownMessageId',
  'UnknownVendorId',
]);

export const DataTransferStatusSchema = z.enum([
  'Accepted',
  'Rejected',
  'UnknownMessageId',
  'UnknownVendorId',
]);

export const DeleteCertificateStatusEnumSchema = z.enum(['Accepted', 'Failed', 'NotFound']);

export const DisplayMessageStatusEnumSchema = z.enum([
  'Accepted',
  'NotSupportedMessageFormat',
  'Rejected',
  'NotSupportedPriority',
  'NotSupportedState',
  'UnknownTransaction',
  'LanguageNotSupported',
]);

export const EventNotificationEnumSchema = z.enum([
  'HardWiredNotification',
  'HardWiredMonitor',
  'PreconfiguredMonitor',
  'CustomMonitor',
]);

export const EventTriggerEnumSchema = z.enum(['Alerting', 'Delta', 'Periodic']);

export const EnergyTransferModeEnumSchema = z.enum([
  'DC',
  'AC_single_phase',
  'AC_two_phase',
  'AC_three_phase',
]);

export const CostKindEnumSchema = z.enum([
  'CarbonDioxideEmission',
  'RelativePricePercentage',
  'RenewableGenerationPercentage',
]);

export const GetCertificateStatusEnumSchema = z.enum(['Accepted', 'Failed']);

export const GenericDeviceModelStatusEnumSchema = z.enum([
  'Accepted',
  'Rejected',
  'NotSupported',
  'EmptyResultSet',
]);

export const GenericStatusEnumSchema = z.enum(['Accepted', 'Failed', 'Rejected']);

export const GetInstalledCertificateStatusEnumSchema = z.enum(['Accepted', 'NotFound']);

export const HashAlgorithmEnumSchema = z.enum(['SHA256', 'SHA384', 'SHA512']);

export const IdTokenEnumSchema = z.enum([
  'Central',
  'DirectPayment',
  'eMAID',
  'EVCCID',
  'ISO14443',
  'ISO15693',
  'KeyCode',
  'Local',
  'MacAddress',
  'NoAuthorization',
  'Other',
  'VIN',
]);

export const InstallCertificateStatusEnumSchema = z.enum(['Accepted', 'Rejected', 'Failed']);

export const InstallCertificateUseEnumSchema = z.enum([
  'V2GRootCertificate',
  'MORootCertificate',
  'ManufacturerRootCertificate',
  'CSMSRootCertificate',
  'OEMRootCertificate',
]);

export const Iso15118EVCertificateStatusEnumSchema = z.enum(['Accepted', 'Failed']);

export const LocationEnumSchema = z.enum(['Body', 'Cable', 'EV', 'Inlet', 'Outlet']);

export const LocationFacilityEnumSchema = z.enum([
  'Hotel',
  'Restaurant',
  'Cafe',
  'Mall',
  'Supermarket',
  'Sport',
  'RecreationArea',
  'Nature',
  'Museum',
  'BikeSharing',
  'BusStop',
  'TaxiStand',
  'TramStop',
  'MetroStation',
  'TrainStation',
  'Airport',
  'ParkingLot',
  'CarpoolParking',
  'FuelStation',
  'Wifi',
]);

export const LocationParkingEnumSchema = z.enum([
  'AlongMotorway',
  'ParkingGarage',
  'ParkingLot',
  'OnDriveway',
  'OnStreet',
  'UndergroundGarage',
]);

export const MessageFormatEnumSchema = z.enum(['ASCII', 'HTML', 'URI', 'UTF8']);

export const MonitorEnumSchema = z.enum([
  'UpperThreshold',
  'LowerThreshold',
  'Delta',
  'Periodic',
  'PeriodicClockAligned',
  'TargetDelta',
  'TargetDeltaRelative',
]);

export const MessagePriorityEnumSchema = z.enum(['AlwaysFront', 'InFront', 'NormalCycle']);

export const MessageStateEnumSchema = z.enum(['Charging', 'Faulted', 'Idle', 'Unavailable']);

export const MutabilityEnumSchema = z.enum(['ReadOnly', 'WriteOnly', 'ReadWrite']);

export const MeasurandEnumSchema = z.enum([
  'Current.Export',
  'Current.Import',
  'Current.Offered',
  'Energy.Active.Export.Register',
  'Energy.Active.Import.Register',
  'Energy.Reactive.Export.Register',
  'Energy.Reactive.Import.Register',
  'Energy.Active.Export.Interval',
  'Energy.Active.Import.Interval',
  'Energy.Active.Net',
  'Energy.Reactive.Export.Interval',
  'Energy.Reactive.Import.Interval',
  'Energy.Reactive.Net',
  'Energy.Apparent.Net',
  'Energy.Apparent.Import',
  'Energy.Apparent.Export',
  'Frequency',
  'Power.Active.Export',
  'Power.Active.Import',
  'Power.Factor',
  'Power.Offered',
  'Power.Reactive.Export',
  'Power.Reactive.Import',
  'RPM',
  'SoC',
  'Temperature',
  'Voltage',
]);

export const NotifyEVChargingNeedsStatusEnumSchema = z.enum([
  'Accepted',
  'Rejected',
  'Processing',
  'NoChargingProfile',
]);

export const MonitoringCriterionEnumSchema = z.enum([
  'ThresholdMonitoring',
  'DeltaMonitoring',
  'PeriodicMonitoring',
]);

export const OCPIVersionNumberSchema = z.enum(['2.2.1']);

export const OCPPInterfaceEnumSchema = z.enum([
  'Wired0',
  'Wired1',
  'Wired2',
  'Wired3',
  'Wireless0',
  'Wireless1',
  'Wireless2',
  'Wireless3',
]);

export const OCPPTransportEnumSchema = z.enum(['JSON', 'SOAP']);

export const OCPPVersionEnumSchema = z.enum(['OCPP12', 'OCPP15', 'OCPP16', 'OCPP20']);

export const PhaseEnumSchema = z.enum([
  'L1',
  'L2',
  'L3',
  'N',
  'L1-N',
  'L2-N',
  'L3-N',
  'L1-L2',
  'L2-L3',
  'L3-L1',
]);

export const ReadingContextEnumSchema = z.enum([
  'Interruption.Begin',
  'Interruption.End',
  'Other',
  'Sample.Clock',
  'Sample.Periodic',
  'Transaction.Begin',
  'Transaction.End',
  'Trigger',
]);

export const ReasonEnumSchema = z.enum([
  'DeAuthorized',
  'EmergencyStop',
  'EnergyLimitReached',
  'EVDisconnected',
  'GroundFault',
  'ImmediateReset',
  'Local',
  'LocalOutOfCredit',
  'MasterPass',
  'Other',
  'OvercurrentFault',
  'PowerLoss',
  'PowerQuality',
  'Reboot',
  'Remote',
  'SOCLimitReached',
  'StoppedByEV',
  'TimeLimitReached',
  'Timeout',
]);

export const RecurrencyKindEnumSchema = z.enum(['Daily', 'Weekly']);

export const RegistrationStatusEnumSchema = z.enum(['Accepted', 'Pending', 'Rejected']);

export const RequestStartStopStatusEnumSchema = z.enum(['Accepted', 'Rejected']);

export const ReservationUpdateStatusEnumSchema = z.enum(['Expired', 'Removed', 'NoTransaction']);

export const ReserveNowStatusEnumSchema = z.enum([
  'Accepted',
  'Faulted',
  'Occupied',
  'Rejected',
  'Unavailable',
]);

export const ResetEnumSchema = z.enum(['Immediate', 'OnIdle', 'ImmediateAndResume']);

export const SendLocalListStatusEnumSchema = z.enum(['Accepted', 'Failed', 'VersionMismatch']);

export const SetMonitoringStatusEnumSchema = z.enum([
  'Accepted',
  'UnknownComponent',
  'UnknownVariable',
  'UnsupportedMonitorType',
  'Rejected',
  'Duplicate',
]);

export const SetNetworkProfileStatusEnumSchema = z.enum(['Accepted', 'Rejected', 'Failed']);

export const SetVariableStatusEnumSchema = z.enum([
  'Accepted',
  'Rejected',
  'UnknownComponent',
  'UnknownVariable',
  'NotSupportedAttributeType',
  'RebootRequired',
]);

export const TransactionEventEnumSchema = z.enum(['Ended', 'Started', 'Updated']);

export const TriggerReasonEnumSchema = z.enum([
  'Authorized',
  'CablePluggedIn',
  'ChargingRateChanged',
  'ChargingStateChanged',
  'Deauthorized',
  'EnergyLimitReached',
  'EVCommunicationLost',
  'EVConnectTimeout',
  'MeterValueClock',
  'MeterValuePeriodic',
  'TimeLimitReached',
  'Trigger',
  'UnlockCommand',
  'StopAuthorized',
  'EVDeparted',
  'EVDetected',
  'RemoteStop',
  'RemoteStart',
  'AbnormalCondition',
  'SignedDataReceived',
  'ResetCommand',
]);

export const TariffSetStatusEnumSchema = z.enum([
  'Accepted',
  'Rejected',
  'TooManyElements',
  'ConditionNotSupported',
  'DuplicateTariffId',
]);

export const UpdateEnumSchema = z.enum(['Differential', 'Full']);

// ============================================================================
// Enum Exports
// ============================================================================

export const AsyncJobNameEnum = AsyncJobNameSchema.enum;
export const AsyncJobActionEnum = AsyncJobActionSchema.enum;
export const AttributeEnum = AttributeEnumSchema.enum;
export const AuthorizationStatusEnum = AuthorizationStatusEnumSchema.enum;
export const AuthorizationWhitelistEnum = AuthorizationWhitelistEnumSchema.enum;
export const AuthorizeCertificateStatusEnum = AuthorizeCertificateStatusEnumSchema.enum;
export const CancelReservationStatusEnum = CancelReservationStatusEnumSchema.enum;
export const CertificateSigningUseEnum = CertificateSigningUseEnumSchema.enum;
export const ChargingProfileStatusEnum = ChargingProfileStatusEnumSchema.enum;
export const ClearChargingProfileStatusEnum = ClearChargingProfileStatusEnumSchema.enum;
export const CertificateUseEnum = CertificateUseEnumSchema.enum;
export const ChargingStateEnum = ChargingStateEnumSchema.enum;
export const ChargingStationCapabilityEnum = ChargingStationCapabilitySchema.enum;
export const ChargingStationParkingRestrictionEnum = ChargingStationParkingRestrictionSchema.enum;
export const ChargingStationSequenceTypeEnum = ChargingStationSequenceTypeSchema.enum;
export const ClearMessageStatusEnum = ClearMessageStatusEnumSchema.enum;
export const ConnectorErrorCodeEnum = ConnectorErrorCodeEnumSchema.enum;
export const ConnectorFormatEnum = ConnectorFormatEnumSchema.enum;
export const ConnectorPowerTypeEnum = ConnectorPowerTypeEnumSchema.enum;
export const ConnectorStatusEnum = ConnectorStatusEnumSchema.enum;
export const ConnectorTypeEnum = ConnectorTypeEnumSchema.enum;
export const ChargingProfileKindEnum = ChargingProfileKindEnumSchema.enum;
export const ChargingProfilePurposeEnum = ChargingProfilePurposeEnumSchema.enum;
export const ChargingRateUnitEnum = ChargingRateUnitEnumSchema.enum;
export const ChargingLimitSourceEnum = ChargingLimitSourceEnumSchema.enum;
export const CostKindEnum = CostKindEnumSchema.enum;
export const DataEnum = DataEnumSchema.enum;
export const DataTransferEnum = DataTransferEnumSchema.enum;
export const DataTransferStatusEnum = DataTransferStatusSchema.enum;
export const DeleteCertificateStatusEnum = DeleteCertificateStatusEnumSchema.enum;
export const DisplayMessageStatusEnum = DisplayMessageStatusEnumSchema.enum;
export const EnergyTransferModeEnum = EnergyTransferModeEnumSchema.enum;
export const EventNotificationEnum = EventNotificationEnumSchema.enum;
export const EventTriggerEnum = EventTriggerEnumSchema.enum;
export const GenericDeviceModelStatusEnum = GenericDeviceModelStatusEnumSchema.enum;
export const GetCertificateStatusEnum = GetCertificateStatusEnumSchema.enum;
export const GenericStatusEnum = GenericStatusEnumSchema.enum;
export const GetInstalledCertificateStatusEnum = GetInstalledCertificateStatusEnumSchema.enum;
export const HashAlgorithmEnum = HashAlgorithmEnumSchema.enum;
export const IdTokenEnum = IdTokenEnumSchema.enum;
export const InstallCertificateStatusEnum = InstallCertificateStatusEnumSchema.enum;
export const InstallCertificateUseEnum = InstallCertificateUseEnumSchema.enum;
export const Iso15118EVCertificateStatusEnum = Iso15118EVCertificateStatusEnumSchema.enum;
export const LocationEnum = LocationEnumSchema.enum;
export const LocationFacilityEnum = LocationFacilityEnumSchema.enum;
export const LocationParkingEnum = LocationParkingEnumSchema.enum;
export const MeasurandEnum = MeasurandEnumSchema.enum;
export const MessageFormatEnum = MessageFormatEnumSchema.enum;
export const MutabilityEnum = MutabilityEnumSchema.enum;
export const MonitorEnum = MonitorEnumSchema.enum;
export const MessagePriorityEnum = MessagePriorityEnumSchema.enum;
export const MessageStateEnum = MessageStateEnumSchema.enum;
export const MonitoringCriterionEnum = MonitoringCriterionEnumSchema.enum;
export const NotifyEVChargingNeedsStatusEnum = NotifyEVChargingNeedsStatusEnumSchema.enum;
export const OCPIVersionNumberEnum = OCPIVersionNumberSchema.enum;
export const OCPPInterfaceEnum = OCPPInterfaceEnumSchema.enum;
export const OCPPTransportEnum = OCPPTransportEnumSchema.enum;
export const OCPPVersionEnum = OCPPVersionEnumSchema.enum;
export const PhaseEnum = PhaseEnumSchema.enum;
export const ReadingContextEnum = ReadingContextEnumSchema.enum;
export const RecurrencyKindEnum = RecurrencyKindEnumSchema.enum;
export const ReasonEnum = ReasonEnumSchema.enum;
export const RegistrationStatusEnum = RegistrationStatusEnumSchema.enum;
export const RequestStartStopStatusEnum = RequestStartStopStatusEnumSchema.enum;
export const ReservationUpdateStatusEnum = ReservationUpdateStatusEnumSchema.enum;
export const ReserveNowStatusEnum = ReserveNowStatusEnumSchema.enum;
export const ResetEnum = ResetEnumSchema.enum;
export const SendLocalListStatusEnum = SendLocalListStatusEnumSchema.enum;
export const SetMonitoringStatusEnum = SetMonitoringStatusEnumSchema.enum;
export const SetNetworkProfileStatusEnum = SetNetworkProfileStatusEnumSchema.enum;
export const SetVariableStatusEnum = SetVariableStatusEnumSchema.enum;
export const TariffSetStatusEnum = TariffSetStatusEnumSchema.enum;
export const TransactionEventEnum = TransactionEventEnumSchema.enum;
export const TriggerReasonEnum = TriggerReasonEnumSchema.enum;
export const UpdateEnum = UpdateEnumSchema.enum;

// ============================================================================
// Type Exports
// ============================================================================

export type AsyncJobNameEnumType = z.infer<typeof AsyncJobNameSchema>;
export type AsyncJobActionEnumType = z.infer<typeof AsyncJobActionSchema>;
export type AttributeEnumType = z.infer<typeof AttributeEnumSchema>;
export type AuthorizationStatusEnumType = z.infer<typeof AuthorizationStatusEnumSchema>;
export type AuthorizationWhitelistEnumType = z.infer<typeof AuthorizationWhitelistEnumSchema>;
export type AuthorizeCertificateStatusEnumType = z.infer<
  typeof AuthorizeCertificateStatusEnumSchema
>;
export type CancelReservationStatusEnumType = z.infer<typeof CancelReservationStatusEnumSchema>;
export type CertificateSigningUseEnumType = z.infer<typeof CertificateSigningUseEnumSchema>;
export type ChargingProfileStatusEnumType = z.infer<typeof ChargingProfileStatusEnumSchema>;
export type ClearChargingProfileStatusEnumType = z.infer<
  typeof ClearChargingProfileStatusEnumSchema
>;
export type CertificateUseEnumType = z.infer<typeof CertificateUseEnumSchema>;
export type ChargingStateEnumType = z.infer<typeof ChargingStateEnumSchema>;
export type ChargingStationCapabilityEnumType = z.infer<typeof ChargingStationCapabilitySchema>;
export type ChargingStationParkingRestrictionEnumType = z.infer<
  typeof ChargingStationParkingRestrictionSchema
>;
export type ClearMessageStatusEnumType = z.infer<typeof ClearMessageStatusEnumSchema>;
export type ChargingStationSequenceTypeEnumType = z.infer<typeof ChargingStationSequenceTypeSchema>;
export type ConnectorErrorCodeEnumType = z.infer<typeof ConnectorErrorCodeEnumSchema>;
export type ConnectorFormatEnumType = z.infer<typeof ConnectorFormatEnumSchema>;
export type ConnectorPowerTypeEnumType = z.infer<typeof ConnectorPowerTypeEnumSchema>;
export type ConnectorStatusEnumType = z.infer<typeof ConnectorStatusEnumSchema>;
export type ConnectorTypeEnumType = z.infer<typeof ConnectorTypeEnumSchema>;
export type ChargingProfileKindEnumType = z.infer<typeof ChargingProfileKindEnumSchema>;
export type ChargingProfilePurposeEnumType = z.infer<typeof ChargingProfilePurposeEnumSchema>;
export type ChargingRateUnitEnumType = z.infer<typeof ChargingRateUnitEnumSchema>;
export type ChargingLimitSourceEnumType = z.infer<typeof ChargingLimitSourceEnumSchema>;
export type CostKindEnumType = z.infer<typeof CostKindEnumSchema>;
export type DataEnumType = z.infer<typeof DataEnumSchema>;
export type DataTransferEnumType = z.infer<typeof DataTransferEnumSchema>;
export type DataTransferStatusType = z.infer<typeof DataTransferStatusSchema>;
export type DeleteCertificateStatusEnumType = z.infer<typeof DeleteCertificateStatusEnumSchema>;
export type DisplayMessageStatusEnumType = z.infer<typeof DisplayMessageStatusEnumSchema>;
export type EnergyTransferModeEnumType = z.infer<typeof EnergyTransferModeEnumSchema>;
export type EventTriggerEnumType = z.infer<typeof EventTriggerEnumSchema>;
export type EventNotificationEnumType = z.infer<typeof EventNotificationEnumSchema>;
export type GenericDeviceModelStatusEnumType = z.infer<typeof GenericDeviceModelStatusEnumSchema>;
export type GenericStatusEnumType = z.infer<typeof GenericStatusEnumSchema>;
export type GetCertificateStatusEnumType = z.infer<typeof GetCertificateStatusEnumSchema>;
export type GetInstalledCertificateStatusEnumType = z.infer<
  typeof GetInstalledCertificateStatusEnumSchema
>;
export type HashAlgorithmEnumType = z.infer<typeof HashAlgorithmEnumSchema>;
export type IdTokenEnumType = z.infer<typeof IdTokenEnumSchema>;
export type InstallCertificateStatusEnumType = z.infer<typeof InstallCertificateStatusEnumSchema>;
export type InstallCertificateUseEnumType = z.infer<typeof InstallCertificateUseEnumSchema>;
export type Iso15118EVCertificateStatusEnumType = z.infer<
  typeof Iso15118EVCertificateStatusEnumSchema
>;
export type LocationEnumType = z.infer<typeof LocationEnumSchema>;
export type LocationFacilityEnumType = z.infer<typeof LocationFacilityEnumSchema>;
export type LocationParkingEnumType = z.infer<typeof LocationParkingEnumSchema>;
export type MeasurandEnumType = z.infer<typeof MeasurandEnumSchema>;
export type MessageFormatEnumType = z.infer<typeof MessageFormatEnumSchema>;
export type MutabilityEnumType = z.infer<typeof MutabilityEnumSchema>;
export type MonitorEnumType = z.infer<typeof MonitorEnumSchema>;
export type MessagePriorityEnumType = z.infer<typeof MessagePriorityEnumSchema>;
export type MessageStateEnumType = z.infer<typeof MessageStateEnumSchema>;
export type MonitoringCriterionEnumType = z.infer<typeof MonitoringCriterionEnumSchema>;
export type NotifyEVChargingNeedsStatusEnumType = z.infer<
  typeof NotifyEVChargingNeedsStatusEnumSchema
>;
export type OCPIVersionNumberEnumType = z.infer<typeof OCPIVersionNumberSchema>;
export type OCPPInterfaceEnumType = z.infer<typeof OCPPInterfaceEnumSchema>;
export type OCPPTransportEnumType = z.infer<typeof OCPPTransportEnumSchema>;
export type OCPPVersionEnumType = z.infer<typeof OCPPVersionEnumSchema>;
export type PhaseEnumType = z.infer<typeof PhaseEnumSchema>;
export type ReadingContextEnumType = z.infer<typeof ReadingContextEnumSchema>;
export type ReasonEnumType = z.infer<typeof ReasonEnumSchema>;
export type RecurrencyKindEnumType = z.infer<typeof RecurrencyKindEnumSchema>;
export type RegistrationStatusEnumType = z.infer<typeof RegistrationStatusEnumSchema>;
export type RequestStartStopStatusEnumType = z.infer<typeof RequestStartStopStatusEnumSchema>;
export type ReservationUpdateStatusEnumType = z.infer<typeof ReservationUpdateStatusEnumSchema>;
export type ReserveNowStatusEnumType = z.infer<typeof ReserveNowStatusEnumSchema>;
export type ResetEnumType = z.infer<typeof ResetEnumSchema>;
export type SendLocalListStatusEnumType = z.infer<typeof SendLocalListStatusEnumSchema>;
export type SetMonitoringStatusEnumType = z.infer<typeof SetMonitoringStatusEnumSchema>;
export type SetNetworkProfileStatusEnumType = z.infer<typeof SetNetworkProfileStatusEnumSchema>;
export type SetVariableStatusEnumType = z.infer<typeof SetVariableStatusEnumSchema>;
export type TariffSetStatusEnumType = z.infer<typeof TariffSetStatusEnumSchema>;
export type TransactionEventEnumType = z.infer<typeof TransactionEventEnumSchema>;
export type TriggerReasonEnumType = z.infer<typeof TriggerReasonEnumSchema>;
export type UpdateEnumType = z.infer<typeof UpdateEnumSchema>;
