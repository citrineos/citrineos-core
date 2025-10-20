// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const IdTokenTypeSchema = z.enum([
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

export const AuthorizationWhitelistTypeSchema = z.enum(['Never', 'Allowed', 'AllowedOffline']);

export const AuthorizationStatusTypeSchema = z.enum([
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

export const ConnectorStatusSchema = z.enum([
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

export const ConnectorTypeSchema = z.enum([
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

export const ConnectorFormatSchema = z.enum(['Socket', 'Cable']);

export const ConnectorErrorCodeSchema = z.enum([
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

export const ConnectorPowerTypeSchema = z.enum([
  'AC1Phase',
  'AC2Phase',
  'AC2PhaseSplit',
  'AC3Phase',
  'DC',
]);

export const LocationParkingTypeSchema = z.enum([
  'AlongMotorway',
  'ParkingGarage',
  'ParkingLot',
  'OnDriveway',
  'OnStreet',
  'UndergroundGarage',
]);

export const LocationFacilityTypeSchema = z.enum([
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

export const MeasurandSchema = z.enum([
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
  'SoC',
  'Voltage',
]);

export const AttributeEnumSchema = z.string().default('Actual');
export const DataEnumSchema = z.string().default('string');
export const MutabilityEnumSchema = z.string().default('ReadWrite');

export const ChargingStationParkingRestrictionSchema = z.string();
export const ChargingStationCapabilitySchema = z.string();
export const OCPPVersionSchema = z.string();
export const MessageOriginSchema = z.string();
export const CallActionSchema = z.string();

export const TriggerReasonSchema = z.enum([
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

export const TransactionEventEnumSchema = z.enum(['Ended', 'Started', 'Updated']);

export const ChargingStateEnumSchema = z.enum([
  'Charging',
  'EVConnected',
  'SuspendedEV',
  'SuspendedEVSE',
  'Idle',
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

export const CostKindEnumSchema = z.enum([
  'CarbonDioxideEmission',
  'RelativePricePercentage',
  'RenewableGenerationPercentage',
]);

export type TriggerReason = z.infer<typeof TriggerReasonSchema>;
export type TransactionEventEnum = z.infer<typeof TransactionEventEnumSchema>;
export type ChargingStateEnum = z.infer<typeof ChargingStateEnumSchema>;
export type ReasonEnum = z.infer<typeof ReasonEnumSchema>;
export type CostKindEnum = z.infer<typeof CostKindEnumSchema>;
export type IdTokenType = z.infer<typeof IdTokenTypeSchema>;
export type AuthorizationWhitelistType = z.infer<typeof AuthorizationWhitelistTypeSchema>;
export type AuthorizationStatusType = z.infer<typeof AuthorizationStatusTypeSchema>;
export type ConnectorStatusType = z.infer<typeof ConnectorStatusSchema>;
export type ConnectorTypeType = z.infer<typeof ConnectorTypeSchema>;
export type ConnectorFormatType = z.infer<typeof ConnectorFormatSchema>;
export type ConnectorErrorCodeType = z.infer<typeof ConnectorErrorCodeSchema>;
export type ConnectorPowerTypeType = z.infer<typeof ConnectorPowerTypeSchema>;
export type LocationParkingType = z.infer<typeof LocationParkingTypeSchema>;
export type LocationFacilityType = z.infer<typeof LocationFacilityTypeSchema>;
export type MeasurandType = z.infer<typeof MeasurandSchema>;
export type AttributeEnumType = z.infer<typeof AttributeEnumSchema>;
export type DataEnumType = z.infer<typeof DataEnumSchema>;
export type MutabilityEnumType = z.infer<typeof MutabilityEnumSchema>;
export type ChargingStationParkingRestrictionType = z.infer<
  typeof ChargingStationParkingRestrictionSchema
>;
export type ChargingStationCapabilityType = z.infer<typeof ChargingStationCapabilitySchema>;
export type OCPPVersionType = z.infer<typeof OCPPVersionSchema>;
export type MessageOriginType = z.infer<typeof MessageOriginSchema>;
export type CallActionType = z.infer<typeof CallActionSchema>;
