// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

export const AsyncJobNameSchema = z.enum(['FETCH_OCPI_TOKENS']);

export const AsyncJobActionSchema = z.enum(['RESUME', 'STOP']);

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

export const CertificateUseEnumSchema = z.enum([
  'V2GRootCertificate',
  'MORootCertificate',
  'CSMSRootCertificate',
  'V2GCertificateChain',
  'ManufacturerRootCertificate',
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

export const HashAlgorithmEnumSchema = z.enum(['SHA256', 'SHA384', 'SHA512']);

export const IdTokenEnumSchema = z.enum([
  'Central',
  'eMAID',
  'ISO14443',
  'ISO15693',
  'KeyCode',
  'Local',
  'MacAddress',
  'NoAuthorization',
  'Other',
]);

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
]);

export const MessagePriorityEnumSchema = z.enum(['AlwaysFront', 'InFront', 'NormalCycle']);

export const MessageStateEnumSchema = z.enum(['Charging', 'Faulted', 'Idle', 'Unavailable']);

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

// ============================================================================
// Enum Exports
// ============================================================================

export const AsyncJobNameEnum = AsyncJobNameSchema.enum;
export const AsyncJobActionEnum = AsyncJobActionSchema.enum;
export const AuthorizationStatusEnum = AuthorizationStatusEnumSchema.enum;
export const AuthorizationWhitelistEnum = AuthorizationWhitelistEnumSchema.enum;
export const CertificateUseEnum = CertificateUseEnumSchema.enum;
export const ChargingStateEnum = ChargingStateEnumSchema.enum;
export const ChargingStationCapabilityEnum = ChargingStationCapabilitySchema.enum;
export const ChargingStationParkingRestrictionEnum = ChargingStationParkingRestrictionSchema.enum;
export const ChargingStationSequenceTypeEnum = ChargingStationSequenceTypeSchema.enum;
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
export const EnergyTransferModeEnum = EnergyTransferModeEnumSchema.enum;
export const EventNotificationEnum = EventNotificationEnumSchema.enum;
export const EventTriggerEnum = EventTriggerEnumSchema.enum;
export const HashAlgorithmEnum = HashAlgorithmEnumSchema.enum;
export const IdTokenEnum = IdTokenEnumSchema.enum;
export const LocationEnum = LocationEnumSchema.enum;
export const LocationFacilityEnum = LocationFacilityEnumSchema.enum;
export const LocationParkingEnum = LocationParkingEnumSchema.enum;
export const MeasurandEnum = MeasurandEnumSchema.enum;
export const MessageFormatEnum = MessageFormatEnumSchema.enum;
export const MonitorEnum = MonitorEnumSchema.enum;
export const MessagePriorityEnum = MessagePriorityEnumSchema.enum;
export const MessageStateEnum = MessageStateEnumSchema.enum;
export const OCPIVersionNumberEnum = OCPIVersionNumberSchema.enum;
export const OCPPInterfaceEnum = OCPPInterfaceEnumSchema.enum;
export const OCPPTransportEnum = OCPPTransportEnumSchema.enum;
export const OCPPVersionEnum = OCPPVersionEnumSchema.enum;
export const PhaseEnum = PhaseEnumSchema.enum;
export const ReadingContextEnum = ReadingContextEnumSchema.enum;
export const RecurrencyKindEnum = RecurrencyKindEnumSchema.enum;
export const ReasonEnum = ReasonEnumSchema.enum;
export const TransactionEventEnum = TransactionEventEnumSchema.enum;
export const TriggerReasonEnum = TriggerReasonEnumSchema.enum;

// ============================================================================
// Type Exports
// ============================================================================

export type AsyncJobNameEnumType = z.infer<typeof AsyncJobNameSchema>;
export type AsyncJobActionEnumType = z.infer<typeof AsyncJobActionSchema>;
export type AuthorizationStatusEnumType = z.infer<typeof AuthorizationStatusEnumSchema>;
export type AuthorizationWhitelistEnumType = z.infer<typeof AuthorizationWhitelistEnumSchema>;
export type CertificateUseEnumType = z.infer<typeof CertificateUseEnumSchema>;
export type ChargingStateEnumType = z.infer<typeof ChargingStateEnumSchema>;
export type ChargingStationCapabilityEnumType = z.infer<typeof ChargingStationCapabilitySchema>;
export type ChargingStationParkingRestrictionEnumType = z.infer<
  typeof ChargingStationParkingRestrictionSchema
>;
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
export type EnergyTransferModeEnumType = z.infer<typeof EnergyTransferModeEnumSchema>;
export type EventTriggerEnumType = z.infer<typeof EventTriggerEnumSchema>;
export type EventNotificationEnumType = z.infer<typeof EventNotificationEnumSchema>;
export type HashAlgorithmEnumType = z.infer<typeof HashAlgorithmEnumSchema>;
export type IdTokenEnumType = z.infer<typeof IdTokenEnumSchema>;
export type LocationEnumType = z.infer<typeof LocationEnumSchema>;
export type LocationFacilityEnumType = z.infer<typeof LocationFacilityEnumSchema>;
export type LocationParkingEnumType = z.infer<typeof LocationParkingEnumSchema>;
export type MeasurandEnumType = z.infer<typeof MeasurandEnumSchema>;
export type MessageFormatEnumType = z.infer<typeof MessageFormatEnumSchema>;
export type MonitorEnumType = z.infer<typeof MonitorEnumSchema>;
export type MessagePriorityEnumType = z.infer<typeof MessagePriorityEnumSchema>;
export type MessageStateEnumType = z.infer<typeof MessageStateEnumSchema>;
export type OCPIVersionNumberEnumType = z.infer<typeof OCPIVersionNumberSchema>;
export type OCPPInterfaceEnumType = z.infer<typeof OCPPInterfaceEnumSchema>;
export type OCPPTransportEnumType = z.infer<typeof OCPPTransportEnumSchema>;
export type OCPPVersionEnumType = z.infer<typeof OCPPVersionEnumSchema>;
export type PhaseEnumType = z.infer<typeof PhaseEnumSchema>;
export type ReadingContextEnumType = z.infer<typeof ReadingContextEnumSchema>;
export type ReasonEnumType = z.infer<typeof ReasonEnumSchema>;
export type RecurrencyKindEnumType = z.infer<typeof RecurrencyKindEnumSchema>;
export type TransactionEventEnumType = z.infer<typeof TransactionEventEnumSchema>;
export type TriggerReasonEnumType = z.infer<typeof TriggerReasonEnumSchema>;
