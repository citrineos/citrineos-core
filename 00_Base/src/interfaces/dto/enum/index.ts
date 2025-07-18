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
