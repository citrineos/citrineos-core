// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum IdTokenType {
  Central = 'Central',
  eMAID = 'eMAID',
  ISO14443 = 'ISO14443',
  ISO15693 = 'ISO15693',
  KeyCode = 'KeyCode',
  Local = 'Local',
  MacAddress = 'MacAddress',
  NoAuthorization = 'NoAuthorization',
  Other = 'Other',
}

export enum AuthorizationWhitelistType {
  Never = 'Never',
  Allowed = 'Allowed',
  AllowedOffline = 'AllowedOffline',
}

export enum AuthorizationStatusType {
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
  EVOnly = 'EVOnly',
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
  PEDTerminal = 'PEDTerminal',
  RemoteStartStopCapable = 'RemoteStartStopCapable',
  Reservable = 'Reservable',
  RFIDReader = 'RFIDReader',
  StartSessionConnectorRequired = 'StartSessionConnectorRequired',
  TokenGroupCapable = 'TokenGroupCapable',
  UnlockCapable = 'UnlockCapable',
}

export enum ConnectorTypeEnum {
  CHAdeMO = 'CHAdeMO',
  ChaoJi = 'ChaoJi',
  DomesticA = 'DomesticA',
  DomesticB = 'DomesticB',
  DomesticC = 'DomesticC',
  DomesticD = 'DomesticD',
  DomesticE = 'DomesticE',
  DomesticF = 'DomesticF',
  DomesticG = 'DomesticG',
  DomesticH = 'DomesticH',
  DomesticI = 'DomesticI',
  DomesticJ = 'DomesticJ',
  DomesticK = 'DomesticK',
  DomesticL = 'DomesticL',
  DomesticM = 'DomesticM',
  DomesticN = 'DomesticN',
  DomesticO = 'DomesticO',
  GBTAC = 'GBTAC',
  GBTDC = 'GBTDC',
  IEC603092Single16 = 'IEC603092Single16',
  IEC603092Three16 = 'IEC603092Three16',
  IEC603092Three32 = 'IEC603092Three32',
  IEC603092Three64 = 'IEC603092Three64',
  IEC62196T1 = 'IEC62196T1',
  IEC62196T1COMBO = 'IEC62196T1COMBO',
  IEC62196T2 = 'IEC62196T2',
  IEC62196T2COMBO = 'IEC62196T2COMBO',
  IEC62196T3A = 'IEC62196T3A',
  IEC62196T3C = 'IEC62196T3C',
  NEMA520 = 'NEMA520',
  NEMA630 = 'NEMA630',
  NEMA650 = 'NEMA650',
  NEMA1030 = 'NEMA1030',
  NEMA1050 = 'NEMA1050',
  NEMA1430 = 'NEMA1430',
  NEMA1450 = 'NEMA1450',
  PantographBottomUp = 'PantographBottomUp',
  PantographTopDown = 'PantographTopDown',
  TeslaR = 'TeslaR',
  TeslaS = 'TeslaS',
}

export enum ConnectorFormatEnum {
  Socket = 'Socket',
  Cable = 'Cable',
}

export enum ConnectorPowerType {
  AC1Phase = 'AC1Phase',
  AC2Phase = 'AC2Phase',
  AC2PhaseSplit = 'AC2PhaseSplit',
  AC3Phase = 'AC3Phase',
  DC = 'DC',
}

export enum LocationParkingType {
  AlongMotorway = 'AlongMotorway',
  ParkingGarage = 'ParkingGarage',
  ParkingLot = 'ParkingLot',
  OnDriveway = 'OnDriveway',
  OnStreet = 'OnStreet',
  UndergroundGarage = 'UndergroundGarage',
}

export enum LocationFacilityType {
  Hotel = 'Hotel',
  Restaurant = 'Restaurant',
  Cafe = 'Cafe',
  Mall = 'Mall',
  Supermarket = 'Supermarket',
  Sport = 'Sport',
  RecreationArea = 'RecreationArea',
  Nature = 'Nature',
  Museum = 'Museum',
  BikeSharing = 'BikeSharing',
  BusStop = 'BusStop',
  TaxiStand = 'TaxiStand',
  TramStop = 'TramStop',
  MetroStation = 'MetroStation',
  TrainStation = 'TrainStation',
  Airport = 'Airport',
  ParkingLot = 'ParkingLot',
  CarpoolParking = 'CarpoolParking',
  FuelStation = 'FuelStation',
  Wifi = 'Wifi',
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
 * This contains the type of this event.
 * The first TransactionEvent of a transaction SHALL contain: "Started" The last TransactionEvent of a transaction SHALL contain: "Ended" All others SHALL contain: "Updated"
 *
 */
export enum TransactionEventEnumType {
  Ended = 'Ended',
  Started = 'Started',
  Updated = 'Updated',
}

export enum OCPIVersionNumber {
  OCPI2_2_1 = '2.2.1',
}
