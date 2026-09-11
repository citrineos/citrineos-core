// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ChargingStationDto,
  ConnectorDto,
  EvseDto,
  LocationDto,
  LocationHours,
} from '@citrineos/types';
import {
  ChargingStationCapabilityEnum,
  ChargingStationParkingRestrictionEnum,
  ConnectorFormatEnum,
  ConnectorPowerTypeEnum,
  ConnectorStatusEnum,
  ConnectorTypeEnum,
  LocationFacilityEnum,
  LocationParkingEnum,
} from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { type ILogObj, Logger } from 'tslog';

import {
  ConnectorMapper,
  EvseMapper,
  LocationMapper,
  formatCoordinate,
} from '../../src/mapper/location-mapper.js';
import { ConnectorType } from '../../src/model/connector-type.js';
import { ConnectorFormat } from '../../src/model/connector-format.js';
import { PowerType } from '../../src/model/power-type.js';
import { EvseStatus } from '../../src/model/evse-status.js';
import { Capability } from '../../src/model/capability.js';
import { ParkingRestriction } from '../../src/model/parking-restriction.js';
import { ParkingType } from '../../src/model/parking-type.js';
import { Facilities } from '../../src/model/facilities.js';

const UPDATED_AT = new Date('2026-08-20T11:00:00Z');

function mappers() {
  const logger = new Logger<ILogObj>({ type: 'hidden' });
  const warn = vi.spyOn(logger, 'warn');
  const connectorMapper = new ConnectorMapper({ logger });
  const evseMapper = new EvseMapper({ logger, connectorMapper });
  const locationMapper = new LocationMapper({ evseMapper });
  return { warn, connectorMapper, evseMapper, locationMapper };
}

function aConnector(overrides: Partial<ConnectorDto> = {}): ConnectorDto {
  return {
    id: 3,
    type: ConnectorTypeEnum.IEC62196T2,
    format: ConnectorFormatEnum.Cable,
    powerType: ConnectorPowerTypeEnum.AC3Phase,
    status: ConnectorStatusEnum.Available,
    maximumVoltage: 400,
    maximumAmperage: 32,
    maximumPowerWatts: 22000,
    tariff: { id: 7 },
    termsAndConditionsUrl: 'https://example.com/terms',
    updatedAt: UPDATED_AT,
    ...overrides,
  } as unknown as ConnectorDto;
}

function anEvse(overrides: object = {}): EvseDto {
  return {
    id: 2,
    evseId: 'GB*VLT*E2',
    physicalReference: 'Bay 4',
    connectors: [aConnector()],
    updatedAt: UPDATED_AT,
    ...overrides,
  } as unknown as EvseDto;
}

function aStation(overrides: object = {}): ChargingStationDto {
  return {
    id: 'cs-001',
    ocppConnectionName: 'cs-001',
    capabilities: [ChargingStationCapabilityEnum.RemoteStartStopCapable],
    parkingRestrictions: [ChargingStationParkingRestrictionEnum.EVOnly],
    coordinates: { coordinates: [-1.5, 53.8] },
    floorLevel: '-1',
    evses: [anEvse()],
    ...overrides,
  } as unknown as ChargingStationDto;
}

function aLocation(overrides: object = {}): LocationDto {
  return {
    id: 1,
    tenant: { countryCode: 'GB', partyId: 'VLT', name: 'Voltempo' },
    publishUpstream: true,
    name: 'Leeds Depot',
    address: '1 Depot Way',
    city: 'Leeds',
    postalCode: 'LS1 1AA',
    state: 'West Yorkshire',
    country: 'GBR',
    coordinates: { coordinates: [-1.543211234, 53.8] },
    timeZone: 'Europe/London',
    chargingPool: [aStation()],
    parkingType: LocationParkingEnum.ParkingGarage,
    facilities: [LocationFacilityEnum.Hotel, LocationFacilityEnum.Wifi],
    openingHours: {
      twentyfourSeven: false,
      regularHours: [{ weekday: 1, periodBegin: '08:00', periodEnd: '20:00' }],
      exceptionalOpenings: [{ periodBegin: '2026-12-25T10:00', periodEnd: '2026-12-25T14:00' }],
      exceptionalClosings: [{ periodBegin: '2027-01-01T00:00', periodEnd: '2027-01-02T00:00' }],
    },
    updatedAt: UPDATED_AT,
    ...overrides,
  } as unknown as LocationDto;
}

describe('formatCoordinate', () => {
  it('pads short decimals to five places', () => {
    expect(formatCoordinate(-1.5)).toBe('-1.50000');
  });

  it('pads an integer with a full decimal part', () => {
    expect(formatCoordinate(53)).toBe('53.00000');
  });

  it('keeps six decimals as-is', () => {
    expect(formatCoordinate('53.123456')).toBe('53.123456');
  });

  it('truncates beyond six decimals without rounding', () => {
    expect(formatCoordinate('53.12345678')).toBe('53.123456');
  });

  it('trims surrounding whitespace from string input', () => {
    expect(formatCoordinate(' 53.8 ')).toBe('53.80000');
  });
});

describe('ConnectorMapper', () => {
  // DomesticD/E/H/K are absent: both enums define them but the switch in src does not (see report).
  const typeCases: Array<[string, ConnectorType]> = [
    [ConnectorTypeEnum.CHAdeMO, ConnectorType.CHADEMO],
    [ConnectorTypeEnum.ChaoJi, ConnectorType.CHAOJI],
    [ConnectorTypeEnum.DomesticA, ConnectorType.DOMESTIC_A],
    [ConnectorTypeEnum.DomesticB, ConnectorType.DOMESTIC_B],
    [ConnectorTypeEnum.DomesticC, ConnectorType.DOMESTIC_C],
    [ConnectorTypeEnum.DomesticF, ConnectorType.DOMESTIC_F],
    [ConnectorTypeEnum.DomesticG, ConnectorType.DOMESTIC_G],
    [ConnectorTypeEnum.DomesticI, ConnectorType.DOMESTIC_I],
    [ConnectorTypeEnum.DomesticJ, ConnectorType.DOMESTIC_J],
    [ConnectorTypeEnum.DomesticL, ConnectorType.DOMESTIC_L],
    [ConnectorTypeEnum.DomesticM, ConnectorType.DOMESTIC_M],
    [ConnectorTypeEnum.DomesticN, ConnectorType.DOMESTIC_N],
    [ConnectorTypeEnum.DomesticO, ConnectorType.DOMESTIC_O],
    [ConnectorTypeEnum.GBTAC, ConnectorType.GBT_AC],
    [ConnectorTypeEnum.GBTDC, ConnectorType.GBT_DC],
    [ConnectorTypeEnum.IEC603092Single16, ConnectorType.IEC_60309_2_single_16],
    [ConnectorTypeEnum.IEC603092Three16, ConnectorType.IEC_60309_2_three_16],
    [ConnectorTypeEnum.IEC603092Three32, ConnectorType.IEC_60309_2_three_32],
    [ConnectorTypeEnum.IEC603092Three64, ConnectorType.IEC_60309_2_three_64],
    [ConnectorTypeEnum.IEC62196T1, ConnectorType.IEC_62196_T1],
    [ConnectorTypeEnum.IEC62196T1COMBO, ConnectorType.IEC_62196_T1_COMBO],
    [ConnectorTypeEnum.IEC62196T2, ConnectorType.IEC_62196_T2],
    [ConnectorTypeEnum.IEC62196T2COMBO, ConnectorType.IEC_62196_T2_COMBO],
    [ConnectorTypeEnum.IEC62196T3A, ConnectorType.IEC_62196_T3A],
    [ConnectorTypeEnum.IEC62196T3C, ConnectorType.IEC_62196_T3C],
    [ConnectorTypeEnum.NEMA520, ConnectorType.NEMA_5_20],
    [ConnectorTypeEnum.NEMA630, ConnectorType.NEMA_6_30],
    [ConnectorTypeEnum.NEMA650, ConnectorType.NEMA_6_50],
    [ConnectorTypeEnum.NEMA1030, ConnectorType.NEMA_10_30],
    [ConnectorTypeEnum.NEMA1050, ConnectorType.NEMA_10_50],
    [ConnectorTypeEnum.NEMA1430, ConnectorType.NEMA_14_30],
    [ConnectorTypeEnum.NEMA1450, ConnectorType.NEMA_14_50],
    [ConnectorTypeEnum.PantographBottomUp, ConnectorType.PANTOGRAPH_BOTTOM_UP],
    [ConnectorTypeEnum.PantographTopDown, ConnectorType.PANTOGRAPH_TOP_DOWN],
    [ConnectorTypeEnum.TeslaR, ConnectorType.TESLA_R],
    [ConnectorTypeEnum.TeslaS, ConnectorType.TESLA_S],
  ];

  it.each(typeCases)('maps connector type %s to %s', (input, expected) => {
    const { connectorMapper } = mappers();
    expect(connectorMapper.mapConnectorType(input as never)).toBe(expected);
  });

  it('warns and returns undefined for a missing connector type', () => {
    const { connectorMapper, warn } = mappers();

    expect(connectorMapper.mapConnectorType(null)).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('Unknown ConnectorType null');
  });

  it.each([
    [ConnectorFormatEnum.Cable, ConnectorFormat.CABLE],
    [ConnectorFormatEnum.Socket, ConnectorFormat.SOCKET],
  ])('maps connector format %s to %s', (input, expected) => {
    const { connectorMapper } = mappers();
    expect(connectorMapper.mapConnectorFormat(input as never)).toBe(expected);
  });

  it('warns and returns undefined for a missing format', () => {
    const { connectorMapper, warn } = mappers();

    expect(connectorMapper.mapConnectorFormat(undefined)).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Unknown Format undefined');
  });

  it.each([
    [ConnectorPowerTypeEnum.AC1Phase, PowerType.AC_1_PHASE],
    [ConnectorPowerTypeEnum.AC2Phase, PowerType.AC_2_PHASE],
    [ConnectorPowerTypeEnum.AC2PhaseSplit, PowerType.AC_2_PHASE_SPLIT],
    [ConnectorPowerTypeEnum.AC3Phase, PowerType.AC_3_PHASE],
    [ConnectorPowerTypeEnum.DC, PowerType.DC],
  ])('maps power type %s to %s', (input, expected) => {
    const { connectorMapper } = mappers();
    expect(connectorMapper.mapConnectorPowerType(input as never)).toBe(expected);
  });

  it('warns and returns undefined for a missing power type', () => {
    const { connectorMapper, warn } = mappers();

    expect(connectorMapper.mapConnectorPowerType(null)).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Unknown PowerType null');
  });

  it('maps a complete connector', () => {
    const { connectorMapper, warn } = mappers();

    const dto = connectorMapper.fromGraphql(aConnector());

    expect(dto).toEqual({
      id: '3',
      standard: ConnectorType.IEC_62196_T2,
      format: ConnectorFormat.CABLE,
      power_type: PowerType.AC_3_PHASE,
      max_voltage: 400,
      max_amperage: 32,
      max_electric_power: 22000,
      tariff_ids: ['7'],
      terms_and_conditions: 'https://example.com/terms',
      last_updated: UPDATED_AT,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('skips a connector missing a required field', () => {
    // maximumVoltage 0 is coerced to undefined, which fails validation
    const { connectorMapper, warn } = mappers();

    const dto = connectorMapper.fromGraphql(aConnector({ maximumVoltage: 0 }));

    expect(dto).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toBe('Connector is missing required fields, skipping');
    expect(warn.mock.calls[1][0]).toContain('Invalid connector');
  });

  it('maps a partial connector without validating', () => {
    const { connectorMapper } = mappers();

    const dto = connectorMapper.fromPartialGraphql({
      type: ConnectorTypeEnum.CHAdeMO,
      format: ConnectorFormatEnum.Socket,
      powerType: ConnectorPowerTypeEnum.DC,
      maximumVoltage: 0,
      updatedAt: UPDATED_AT,
    } as unknown as Partial<ConnectorDto>);

    expect(dto.standard).toBe(ConnectorType.CHADEMO);
    expect(dto.format).toBe(ConnectorFormat.SOCKET);
    expect(dto.power_type).toBe(PowerType.DC);
    expect(dto.max_voltage).toBeUndefined();
    expect(dto.tariff_ids).toBeUndefined();
    expect(dto.last_updated).toBe(UPDATED_AT);
  });
});

describe('EvseMapper', () => {
  it.each([
    ConnectorStatusEnum.Occupied,
    ConnectorStatusEnum.Preparing,
    ConnectorStatusEnum.Charging,
    ConnectorStatusEnum.SuspendedEVSE,
    ConnectorStatusEnum.SuspendedEV,
    ConnectorStatusEnum.Finishing,
  ])('%s on any connector wins over Available', (inUse) => {
    const { evseMapper } = mappers();
    const connectors = [{ status: ConnectorStatusEnum.Available }, { status: inUse }] as never;

    expect(evseMapper.mapEvseStatusFromConnectors(connectors)).toBe(EvseStatus.CHARGING);
  });

  it('Reserved wins over Available', () => {
    const { evseMapper } = mappers();
    const connectors = [
      { status: ConnectorStatusEnum.Available },
      { status: ConnectorStatusEnum.Reserved },
    ] as never;

    expect(evseMapper.mapEvseStatusFromConnectors(connectors)).toBe(EvseStatus.RESERVED);
  });

  it('a single Available connector makes the EVSE AVAILABLE', () => {
    const { evseMapper } = mappers();
    const connectors = [
      { status: ConnectorStatusEnum.Unavailable },
      { status: ConnectorStatusEnum.Available },
      { status: ConnectorStatusEnum.Faulted },
    ] as never;

    expect(evseMapper.mapEvseStatusFromConnectors(connectors)).toBe(EvseStatus.AVAILABLE);
  });

  it('Unavailable wins over Faulted', () => {
    const { evseMapper } = mappers();
    const connectors = [
      { status: ConnectorStatusEnum.Faulted },
      { status: ConnectorStatusEnum.Unavailable },
    ] as never;

    expect(evseMapper.mapEvseStatusFromConnectors(connectors)).toBe(EvseStatus.INOPERATIVE);
  });

  it('all Faulted maps to OUTOFORDER', () => {
    const { evseMapper } = mappers();
    const connectors = [{ status: ConnectorStatusEnum.Faulted }] as never;

    expect(evseMapper.mapEvseStatusFromConnectors(connectors)).toBe(EvseStatus.OUTOFORDER);
  });

  it('no connectors maps to UNKNOWN', () => {
    const { evseMapper } = mappers();

    expect(evseMapper.mapEvseStatusFromConnectors([])).toBe(EvseStatus.UNKNOWN);
  });

  it('an unrecognized status maps to UNKNOWN', () => {
    const { evseMapper } = mappers();
    const connectors = [{ status: ConnectorStatusEnum.Unknown }] as never;

    expect(evseMapper.mapEvseStatusFromConnectors(connectors)).toBe(EvseStatus.UNKNOWN);
  });

  it.each([
    [ChargingStationCapabilityEnum.ChargingProfileCapable, Capability.CHARGING_PROFILE_CAPABLE],
    [
      ChargingStationCapabilityEnum.ChargingPreferencesCapable,
      Capability.CHARGING_PREFERENCES_CAPABLE,
    ],
    [ChargingStationCapabilityEnum.ChipCardSupport, Capability.CHIP_CARD_SUPPORT],
    [ChargingStationCapabilityEnum.ContactlessCardSupport, Capability.CONTACTLESS_CARD_SUPPORT],
    [ChargingStationCapabilityEnum.CreditCardPayable, Capability.CREDIT_CARD_PAYABLE],
    [ChargingStationCapabilityEnum.DebitCardPayable, Capability.DEBIT_CARD_PAYABLE],
    [ChargingStationCapabilityEnum.PEDTerminal, Capability.PED_TERMINAL],
    [ChargingStationCapabilityEnum.RemoteStartStopCapable, Capability.REMOTE_START_STOP_CAPABLE],
    [ChargingStationCapabilityEnum.Reservable, Capability.RESERVABLE],
    [ChargingStationCapabilityEnum.RFIDReader, Capability.RFID_READER],
    [
      ChargingStationCapabilityEnum.StartSessionConnectorRequired,
      Capability.START_SESSION_CONNECTOR_REQUIRED,
    ],
    [ChargingStationCapabilityEnum.TokenGroupCapable, Capability.TOKEN_GROUP_CAPABLE],
    [ChargingStationCapabilityEnum.UnlockCapable, Capability.UNLOCK_CAPABLE],
  ])('maps capability %s to %s', (input, expected) => {
    const { evseMapper } = mappers();
    expect(evseMapper.mapEvseCapabilities(input as never)).toBe(expected);
  });

  it('maps an unknown capability to null', () => {
    const { evseMapper } = mappers();
    expect(evseMapper.mapEvseCapabilities('HologramSupport' as never)).toBeNull();
  });

  it.each([
    [ChargingStationParkingRestrictionEnum.EVOnly, ParkingRestriction.EV_ONLY],
    [ChargingStationParkingRestrictionEnum.Customers, ParkingRestriction.CUSTOMERS],
    [ChargingStationParkingRestrictionEnum.Disabled, ParkingRestriction.DISABLED],
    [ChargingStationParkingRestrictionEnum.Motorcycles, ParkingRestriction.MOTORCYCLES],
    [ChargingStationParkingRestrictionEnum.Plugged, ParkingRestriction.PLUGGED],
  ])('maps parking restriction %s to %s', (input, expected) => {
    const { evseMapper } = mappers();
    expect(evseMapper.mapEvseParkingRestrictions(input as never)).toBe(expected);
  });

  it('maps an unknown parking restriction to null', () => {
    const { evseMapper } = mappers();
    expect(evseMapper.mapEvseParkingRestrictions('Taxis' as never)).toBeNull();
  });

  it('maps a complete EVSE', () => {
    const { evseMapper, warn } = mappers();

    const dto = evseMapper.fromGraphql(aStation(), anEvse());

    expect(dto).toEqual({
      uid: 'cs-001::2',
      evse_id: 'GB*VLT*E2',
      status: EvseStatus.AVAILABLE,
      capabilities: [Capability.REMOTE_START_STOP_CAPABLE],
      physical_reference: 'Bay 4',
      coordinates: { longitude: '-1.50000', latitude: '53.80000' },
      parking_restrictions: [ParkingRestriction.EV_ONLY],
      connectors: [expect.objectContaining({ id: '3', standard: ConnectorType.IEC_62196_T2 })],
      floor_level: '-1',
      last_updated: UPDATED_AT,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns and maps an EVSE without connectors to an empty list and UNKNOWN', () => {
    const { evseMapper, warn } = mappers();

    const dto = evseMapper.fromGraphql(aStation(), anEvse({ connectors: undefined }));

    expect(dto!.connectors).toEqual([]);
    expect(dto!.status).toBe(EvseStatus.UNKNOWN);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('EVSE has no valid connectors', {
      stationId: 'cs-001',
      evseId: 2,
    });
  });

  it('drops an invalid connector but still derives status from its raw OCPP status', () => {
    const { evseMapper, warn } = mappers();
    const evse = anEvse({ connectors: [aConnector({ maximumVoltage: 0 })] });

    const dto = evseMapper.fromGraphql(aStation(), evse);

    expect(dto!.connectors).toEqual([]);
    expect(dto!.status).toBe(EvseStatus.AVAILABLE);
    expect(warn).toHaveBeenCalledTimes(3);
    expect(warn.mock.calls[2][0]).toBe('EVSE has no valid connectors');
  });

  it('leaves optional station fields off the EVSE', () => {
    const { evseMapper } = mappers();
    const station = aStation({
      coordinates: undefined,
      capabilities: undefined,
      parkingRestrictions: undefined,
      floorLevel: undefined,
    });

    const dto = evseMapper.fromGraphql(station, anEvse());

    expect(dto!.coordinates).toBeUndefined();
    expect(dto!.capabilities).toBeUndefined();
    expect(dto!.parking_restrictions).toBeUndefined();
    expect(dto!.floor_level).toBeUndefined();
  });

  it('maps a partial EVSE without connectors to an undefined status', () => {
    const { evseMapper } = mappers();

    const dto = evseMapper.fromPartialGraphql(
      { coordinates: { coordinates: [4.4, 51.9] } } as unknown as Partial<ChargingStationDto>,
      { evseId: 'GB*VLT*E9' } as unknown as Partial<EvseDto>,
    );

    expect(dto.evse_id).toBe('GB*VLT*E9');
    expect(dto.status).toBeUndefined();
    expect(dto.connectors).toBeUndefined();
    expect(dto.coordinates).toEqual({ longitude: '4.40000', latitude: '51.90000' });
  });

  it('maps a partial EVSE with connectors including their status', () => {
    const { evseMapper } = mappers();

    const dto = evseMapper.fromPartialGraphql(
      {} as Partial<ChargingStationDto>,
      {
        connectors: [aConnector({ status: ConnectorStatusEnum.Reserved })],
      } as unknown as Partial<EvseDto>,
    );

    expect(dto.status).toBe(EvseStatus.RESERVED);
    expect(dto.connectors).toHaveLength(1);
    expect(dto.connectors![0].id).toBe('3');
  });
});

describe('LocationMapper', () => {
  it.each([
    [LocationParkingEnum.AlongMotorway, ParkingType.ALONG_MOTORWAY],
    [LocationParkingEnum.ParkingGarage, ParkingType.PARKING_GARAGE],
    [LocationParkingEnum.ParkingLot, ParkingType.PARKING_LOT],
    [LocationParkingEnum.OnDriveway, ParkingType.ON_DRIVEWAY],
    [LocationParkingEnum.OnStreet, ParkingType.ON_STREET],
    [LocationParkingEnum.UndergroundGarage, ParkingType.UNDERGROUND_GARAGE],
  ])('maps parking type %s to %s', (input, expected) => {
    const { locationMapper } = mappers();
    expect(locationMapper.mapLocationParkingType(input as never)).toBe(expected);
  });

  it('maps a missing parking type to null', () => {
    const { locationMapper } = mappers();
    expect(locationMapper.mapLocationParkingType(null)).toBeNull();
  });

  it.each([
    [LocationFacilityEnum.Hotel, Facilities.HOTEL],
    [LocationFacilityEnum.Restaurant, Facilities.RESTAURANT],
    [LocationFacilityEnum.Cafe, Facilities.CAFE],
    [LocationFacilityEnum.Mall, Facilities.MALL],
    [LocationFacilityEnum.Supermarket, Facilities.SUPERMARKET],
    [LocationFacilityEnum.Sport, Facilities.SPORT],
    [LocationFacilityEnum.RecreationArea, Facilities.RECREATION_AREA],
    [LocationFacilityEnum.Nature, Facilities.NATURE],
    [LocationFacilityEnum.Museum, Facilities.MUSEUM],
    [LocationFacilityEnum.BikeSharing, Facilities.BIKE_SHARING],
    [LocationFacilityEnum.BusStop, Facilities.BUS_STOP],
    [LocationFacilityEnum.TaxiStand, Facilities.TAXI_STAND],
    [LocationFacilityEnum.TramStop, Facilities.TRAM_STOP],
    [LocationFacilityEnum.MetroStation, Facilities.METRO_STATION],
    [LocationFacilityEnum.TrainStation, Facilities.TRAIN_STATION],
    [LocationFacilityEnum.Airport, Facilities.AIRPORT],
    [LocationFacilityEnum.ParkingLot, Facilities.PARKING_LOT],
    [LocationFacilityEnum.CarpoolParking, Facilities.CARPOOL_PARKING],
    [LocationFacilityEnum.FuelStation, Facilities.FUEL_STATION],
    [LocationFacilityEnum.Wifi, Facilities.WIFI],
  ])('maps facility %s to %s', (input, expected) => {
    const { locationMapper } = mappers();
    expect(locationMapper.mapLocationFacility(input as never)).toBe(expected);
  });

  it('maps a missing facility to null', () => {
    const { locationMapper } = mappers();
    expect(locationMapper.mapLocationFacility(undefined)).toBeNull();
  });

  it('maps opening hours', () => {
    const { locationMapper } = mappers();

    const hours = locationMapper.mapLocationHours({
      twentyfourSeven: false,
      regularHours: [{ weekday: 1, periodBegin: '08:00', periodEnd: '20:00' }],
      exceptionalOpenings: [{ periodBegin: '2026-12-25T10:00', periodEnd: '2026-12-25T14:00' }],
      exceptionalClosings: [{ periodBegin: '2027-01-01T00:00', periodEnd: '2027-01-02T00:00' }],
    } as unknown as LocationHours);

    expect(hours).toEqual({
      twentyfourseven: false,
      regular_hours: [{ weekday: 1, period_begin: '08:00', period_end: '20:00' }],
      exceptional_openings: [{ period_begin: '2026-12-25T10:00', period_end: '2026-12-25T14:00' }],
      exceptional_closings: [{ period_begin: '2027-01-01T00:00', period_end: '2027-01-02T00:00' }],
    });
  });

  it('maps twentyfourseven-only hours without period lists', () => {
    const { locationMapper } = mappers();

    const hours = locationMapper.mapLocationHours({ twentyfourSeven: true } as LocationHours);

    expect(hours.twentyfourseven).toBe(true);
    expect(hours.regular_hours).toBeUndefined();
    expect(hours.exceptional_openings).toBeUndefined();
    expect(hours.exceptional_closings).toBeUndefined();
  });

  it('maps a complete location', () => {
    const { locationMapper, warn } = mappers();

    const dto = locationMapper.fromGraphql(aLocation());

    expect(dto.id).toBe('1');
    expect(dto.country_code).toBe('GB');
    expect(dto.party_id).toBe('VLT');
    // operator carries only the tenant name; website/logo have no tenant source
    expect(dto.operator).toEqual({ name: 'Voltempo' });
    expect(dto.publish).toBe(true);
    expect(dto.name).toBe('Leeds Depot');
    expect(dto.postal_code).toBe('LS1 1AA');
    expect(dto.coordinates).toEqual({ longitude: '-1.543211', latitude: '53.80000' });
    expect(dto.time_zone).toBe('Europe/London');
    expect(dto.parking_type).toBe(ParkingType.PARKING_GARAGE);
    expect(dto.facilities).toEqual([Facilities.HOTEL, Facilities.WIFI]);
    expect(dto.opening_times!.twentyfourseven).toBe(false);
    expect(dto.evses).toHaveLength(1);
    expect(dto.evses![0].uid).toBe('cs-001::2');
    expect(dto.last_updated).toBe(UPDATED_AT);
    expect(warn).not.toHaveBeenCalled();
  });

  it('flattens EVSEs across the charging pool', () => {
    const { locationMapper } = mappers();
    const location = aLocation({
      chargingPool: [
        aStation(),
        aStation({ id: 'cs-002', ocppConnectionName: 'cs-002', evses: [anEvse({ id: 5 })] }),
      ],
    });

    const dto = locationMapper.fromGraphql(location);

    expect(dto.evses!.map((e) => e.uid)).toEqual(['cs-001::2', 'cs-002::5']);
  });

  it('maps a station without EVSEs to an empty EVSE list', () => {
    const { locationMapper } = mappers();
    const location = aLocation({ chargingPool: [aStation({ evses: undefined })] });

    const dto = locationMapper.fromGraphql(location);

    expect(dto.evses).toEqual([]);
  });

  it('leaves optional location fields off the DTO', () => {
    const { locationMapper } = mappers();
    const location = aLocation({
      chargingPool: undefined,
      parkingType: null,
      facilities: undefined,
      openingHours: null,
      state: undefined,
    });

    const dto = locationMapper.fromGraphql(location);

    expect(dto.evses).toBeUndefined();
    expect(dto.parking_type).toBeNull();
    expect(dto.facilities).toBeUndefined();
    expect(dto.opening_times).toBeUndefined();
    expect(dto.state).toBeUndefined();
  });

  it('maps a minimal partial location', () => {
    const { locationMapper } = mappers();

    const dto = locationMapper.fromPartialGraphql({ name: 'Leeds Depot' });

    expect(dto.name).toBe('Leeds Depot');
    // a PATCH carries no tenant identity, so operator is left off rather than nulled
    expect(dto.operator).toBeUndefined();
    expect(dto.coordinates).toBeUndefined();
    expect(dto.evses).toBeUndefined();
    expect(dto.parking_type).toBeNull();
    expect(dto.opening_times).toBeUndefined();
  });

  it('maps partial-location coordinates and charging pool when present', () => {
    const { locationMapper } = mappers();

    const dto = locationMapper.fromPartialGraphql({
      coordinates: { coordinates: [4.4, 51.9] },
      chargingPool: [aStation()],
    } as unknown as Partial<LocationDto>);

    expect(dto.coordinates).toEqual({ longitude: '4.40000', latitude: '51.90000' });
    expect(dto.evses).toHaveLength(1);
    expect(dto.evses![0].uid).toBe('cs-001::2');
  });
});
