// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type {
  IAuthorizationRepository,
  IChargingStationRepository,
  IChargingStationSequenceRepository,
  IConnectorRepository,
  IEvseRepository,
  ILocationRepository,
  ITariffRepository,
  ITenantRepository,
  ITransactionRepository,
  TariffData,
} from '@citrineos/dal';
import type {
  ChargingStationDto,
  ConnectorDto,
  EvseDto,
  LocationDto,
  TariffDto,
  TenantDto,
  TransactionDto,
} from '@citrineos/types';
import {
  AuthorizationStatusEnum,
  ChargingStationSequenceTypeEnum,
  ConnectorStatusEnum,
  IdTokenEnum,
} from '@citrineos/types';

/** A row Core has saved: its primary key and tenant are set. */
type Saved = { id: number; tenantId: number };

export type ConnectorView = Pick<
  ConnectorDto,
  'connectorId' | 'evseTypeConnectorId' | 'status' | 'type' | 'powerType' | 'maximumPowerWatts'
> &
  Pick<Saved, 'id'>;

/** Where an EVSE stands, as the driver is told. */
export type LocationView = Pick<
  LocationDto,
  'name' | 'address' | 'city' | 'postalCode' | 'state' | 'country'
>;

export type StationView = Pick<ChargingStationDto, 'ocppConnectionName' | 'protocol' | 'isOnline'>;

export type EvseView = Pick<EvseDto, 'evseId' | 'evseTypeId' | 'removed'> &
  Saved & {
    station: StationView;
    connectors: ConnectorView[];
    /** The station's location, if it has one. */
    location: LocationView | null;
    /** The tenant's name: who operates the EVSE. None for the default tenant: it has no real name. */
    operatorName: TenantDto['name'] | null;
  };

/** Where a remote start for a connector goes. */
export type ConnectorTarget = Pick<ConnectorDto, 'evseId' | 'connectorId'> &
  Pick<EvseDto, 'evseTypeId'> &
  Pick<ChargingStationDto, 'ocppConnectionName' | 'protocol'>;

export type TransactionView = Pick<
  TransactionDto,
  | 'transactionId'
  | 'isActive'
  | 'startTime'
  | 'endTime'
  | 'totalKwh'
  | 'timeSpentCharging'
  | 'authorizationId'
  | 'evseId'
  | 'connectorId'
> &
  Pick<Saved, 'id'>;

/** Everything this app reads from, or writes to, Core's data. */
export interface ICoreData {
  /** Not tenant-scoped: an EVSE id is all a driver brings. */
  resolveEvseTenant(evseDatabaseId: number): Promise<number | undefined>;
  /**
   * Not tenant-scoped either: the database ids of the EVSEs printed with this eMI3 id, compared
   * without its optional `*` separators and case, as eMI3 allows.
   */
  findEvsesByEmi3Id(emi3EvseId: string): Promise<number[]>;
  readEvse(tenantId: number, evseDatabaseId: number): Promise<EvseView | undefined>;
  readConnectorTarget(tenantId: number, connectorId: number): Promise<ConnectorTarget | undefined>;
  readTariffForConnector(tenantId: number, connectorId: number): Promise<TariffData | undefined>;
  /** Makes Core accept `idToken` when the station presents it, and returns its Authorization id. */
  ensureAuthorization(tenantId: number, idToken: string): Promise<number>;
  readAuthorizationId(tenantId: number, idToken: string): Promise<number | undefined>;
  nextRemoteStartId(tenantId: number, ocppConnectionName: string): Promise<number>;
  readActiveTransactionForAuthorization(
    tenantId: number,
    authorizationId: number,
  ): Promise<TransactionView | undefined>;
  readTransaction(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string,
  ): Promise<TransactionView | undefined>;
  readTransactionById(tenantId: number, id: number): Promise<TransactionView | undefined>;
  /**
   * The newest transaction an Authorization started since `since`, active or not. An idToken can
   * outlive a checkout, so its Authorization may name transactions older than the checkout.
   */
  readLatestTransactionForAuthorization(
    tenantId: number,
    authorizationId: number,
    since: Date,
  ): Promise<TransactionView | undefined>;
}

export interface CoreDataDependencies {
  evseRepository: IEvseRepository;
  connectorRepository: IConnectorRepository;
  chargingStationRepository: IChargingStationRepository;
  locationRepository: ILocationRepository;
  tenantRepository: ITenantRepository;
  tariffRepository: ITariffRepository;
  authorizationRepository: IAuthorizationRepository;
  chargingStationSequenceRepository: IChargingStationSequenceRepository;
  transactionRepository: ITransactionRepository;
}

function toStationView(station: ChargingStationDto): StationView {
  return {
    ocppConnectionName: station.ocppConnectionName,
    protocol: station.protocol ?? null,
    isOnline: station.isOnline === true,
  };
}

function toLocationView(location: LocationDto): LocationView {
  return {
    name: location.name,
    address: location.address,
    city: location.city,
    postalCode: location.postalCode,
    state: location.state,
    country: location.country,
  };
}

function toTransactionView(transaction: TransactionDto): TransactionView {
  if (transaction.id == null) {
    throw new Error(`Transaction ${transaction.transactionId} has no id`);
  }
  return {
    id: transaction.id,
    transactionId: transaction.transactionId,
    isActive: transaction.isActive,
    startTime: transaction.startTime,
    endTime: transaction.endTime,
    // DECIMAL and BIGINT columns: pg hands them over as strings, whatever TransactionDto declares.
    totalKwh: transaction.totalKwh == null ? null : Number(transaction.totalKwh),
    timeSpentCharging:
      transaction.timeSpentCharging == null ? null : Number(transaction.timeSpentCharging),
    authorizationId: transaction.authorizationId,
    evseId: transaction.evseId,
    connectorId: transaction.connectorId,
  };
}

export function toTariffData(tariff: TariffDto): TariffData {
  if (tariff.id == null) {
    throw new Error('Tariff has no id');
  }
  return {
    id: tariff.id,
    currency: tariff.currency,
    pricePerKwh: tariff.pricePerKwh,
    pricePerMin: tariff.pricePerMin ?? null,
    pricePerSession: tariff.pricePerSession ?? null,
    taxRate: tariff.taxRate ?? null,
    authorizationAmount: tariff.authorizationAmount ?? null,
    paymentFee: tariff.paymentFee ?? null,
    tariffId: tariff.tariffId ?? null,
    validFrom: tariff.validFrom ?? null,
    description: tariff.description ?? null,
    energy: tariff.energy ?? null,
    chargingTime: tariff.chargingTime ?? null,
    idleTime: tariff.idleTime ?? null,
    fixedFee: tariff.fixedFee ?? null,
    reservationTime: tariff.reservationTime ?? null,
    reservationFixed: tariff.reservationFixed ?? null,
    minCost: tariff.minCost ?? null,
    maxCost: tariff.maxCost ?? null,
  };
}

export class CoreData implements ICoreData {
  private readonly _evses: IEvseRepository;
  private readonly _connectors: IConnectorRepository;
  private readonly _stations: IChargingStationRepository;
  private readonly _locations: ILocationRepository;
  private readonly _tenants: ITenantRepository;
  private readonly _tariffs: ITariffRepository;
  private readonly _authorizations: IAuthorizationRepository;
  private readonly _sequences: IChargingStationSequenceRepository;
  private readonly _transactions: ITransactionRepository;

  constructor(dependencies: CoreDataDependencies) {
    this._evses = dependencies.evseRepository;
    this._connectors = dependencies.connectorRepository;
    this._stations = dependencies.chargingStationRepository;
    this._locations = dependencies.locationRepository;
    this._tenants = dependencies.tenantRepository;
    this._tariffs = dependencies.tariffRepository;
    this._authorizations = dependencies.authorizationRepository;
    this._sequences = dependencies.chargingStationSequenceRepository;
    this._transactions = dependencies.transactionRepository;
  }

  resolveEvseTenant(evseDatabaseId: number): Promise<number | undefined> {
    return this._evses.readTenantIdByEvseDatabaseId(evseDatabaseId);
  }

  async findEvsesByEmi3Id(emi3EvseId: string): Promise<number[]> {
    if (!emi3EvseId.replaceAll('*', '')) {
      return [];
    }
    const evses = await this._evses.readEvsesByEmi3Id(emi3EvseId);
    return evses.flatMap((evse) => (evse.id == null ? [] : [evse.id]));
  }

  async readEvse(tenantId: number, evseDatabaseId: number): Promise<EvseView | undefined> {
    const evse = await this._evses.readEvseById(tenantId, evseDatabaseId);
    if (!evse || evse.id == null) {
      return undefined;
    }
    const station = await this._stations.readChargingStationById(tenantId, evse.stationId);
    if (!station) {
      return undefined;
    }
    const location =
      station.locationId == null
        ? undefined
        : await this._locations.readLocationById(tenantId, station.locationId);
    const tenant =
      tenantId === DEFAULT_TENANT_ID
        ? undefined
        : await this._tenants.readByKey(tenantId, tenantId);
    return {
      id: evse.id,
      tenantId,
      evseId: evse.evseId ?? null,
      evseTypeId: evse.evseTypeId,
      removed: evse.removed === true,
      station: toStationView(station),
      connectors: (evse.connectors ?? [])
        .flatMap((connector): ConnectorView[] =>
          connector.id != null && connector.tenantId === tenantId
            ? [
                {
                  id: connector.id,
                  connectorId: connector.connectorId,
                  evseTypeConnectorId: connector.evseTypeConnectorId,
                  status: connector.status ?? ConnectorStatusEnum.Unknown,
                  type: connector.type ?? null,
                  powerType: connector.powerType ?? null,
                  maximumPowerWatts: connector.maximumPowerWatts ?? null,
                },
              ]
            : [],
        )
        .sort((a, b) => a.id - b.id),
      location: location ? toLocationView(location) : null,
      operatorName: tenant?.name ?? null,
    };
  }

  async readConnectorTarget(
    tenantId: number,
    connectorId: number,
  ): Promise<ConnectorTarget | undefined> {
    const connector = await this._connectors.readConnectorById(tenantId, connectorId);
    if (!connector) {
      return undefined;
    }
    const [station, evse] = await Promise.all([
      this._stations.readChargingStationById(tenantId, connector.stationId),
      this._evses.readEvseById(tenantId, connector.evseId),
    ]);
    if (!station) {
      return undefined;
    }
    return {
      evseId: connector.evseId,
      connectorId: connector.connectorId,
      evseTypeId: evse?.evseTypeId,
      ocppConnectionName: station.ocppConnectionName,
      protocol: station.protocol ?? null,
    };
  }

  async readTariffForConnector(
    tenantId: number,
    connectorId: number,
  ): Promise<TariffData | undefined> {
    const tariff = await this._tariffs.findByConnectorId(tenantId, connectorId);
    if (!tariff) {
      return undefined;
    }
    return toTariffData(tariff);
  }

  async ensureAuthorization(tenantId: number, idToken: string): Promise<number> {
    const existing = await this.readAuthorizationId(tenantId, idToken);
    if (existing !== undefined) {
      return existing;
    }
    const created = await this._authorizations.createAuthorization(tenantId, {
      idToken,
      idTokenType: IdTokenEnum.Central,
      status: AuthorizationStatusEnum.Accepted,
      concurrentTransaction: false,
    });
    if (created.id == null) {
      throw new Error(`Authorization for ${idToken} was created without an id`);
    }
    return created.id;
  }

  async readAuthorizationId(tenantId: number, idToken: string): Promise<number | undefined> {
    const authorization = await this._authorizations.readOnlyOneByQuerystring(tenantId, {
      idToken,
      type: IdTokenEnum.Central,
    });
    return authorization?.id ?? undefined;
  }

  nextRemoteStartId(tenantId: number, ocppConnectionName: string): Promise<number> {
    return this._sequences.getNextSequenceValue(
      tenantId,
      ocppConnectionName,
      ChargingStationSequenceTypeEnum.remoteStartId,
    );
  }

  async readActiveTransactionForAuthorization(
    tenantId: number,
    authorizationId: number,
  ): Promise<TransactionView | undefined> {
    const transactions = await this._transactions.readAllActiveTransactionsByAuthorizationId(
      tenantId,
      authorizationId,
    );
    return transactions[0] ? toTransactionView(transactions[0]) : undefined;
  }

  async readTransaction(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string,
  ): Promise<TransactionView | undefined> {
    const transaction = await this._transactions.readTransactionByStationIdAndTransactionId(
      tenantId,
      ocppConnectionName,
      transactionId,
    );
    return transaction ? toTransactionView(transaction) : undefined;
  }

  async readTransactionById(tenantId: number, id: number): Promise<TransactionView | undefined> {
    const transaction = await this._transactions.readTransactionById(tenantId, id);
    return transaction ? toTransactionView(transaction) : undefined;
  }

  async readLatestTransactionForAuthorization(
    tenantId: number,
    authorizationId: number,
    since: Date,
  ): Promise<TransactionView | undefined> {
    const transaction = await this._transactions.readLatestTransactionByAuthorizationId(
      tenantId,
      authorizationId,
      since,
    );
    return transaction ? toTransactionView(transaction) : undefined;
  }
}
