// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  MessageOrigin,
  type NetworkAlertCreate,
  type NetworkAlertDto,
  type NetworkAlertOccurrenceCreate,
  type NetworkAlertOccurrenceDto,
  NetworkAlertOccurrenceSchema,
  NetworkAlertSchema,
  type NetworkAlertType,
  type NetworkAlertUpdate,
  type OcppCallFailureReason,
} from '@citrineos/types';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import { Boot } from '../../models/boot.js';
import { ChargingStation } from '../../models/location/index.js';
import { Tenant } from '../../models/tenant.js';
import { NetworkAlert, NetworkAlertOccurrence } from '../../models/network-alert/index.js';
import type {
  NetworkAlertSubject,
  OpenNetworkAlert,
  ResponseLatencySample,
  SilentStation,
} from '../../interfaces/projections/network-alert.js';
import type { INetworkAlertRepository, INetworkAlertSession } from '../repositories.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';

/**
 * How far before the earliest response a Call is looked for. It bounds the Calls to the partitions
 * that could hold them; no OCPP exchange stays open anywhere near this long.
 */
const REQUEST_LOOKBACK_MS = 60 * 60 * 1000;

const SWEEP_LOCK_KEY = 'network-alert-sweep';

function subjectLockKey(subject: NetworkAlertSubject): string {
  return `network-alert:${subject.tenantId}:${subject.type}:${subject.stationId}:${subject.connectorId ?? ''}`;
}

type SilentStationRow = {
  stationId: number;
  tenantId: number;
  latestOcppMessageTimestamp: Date | string;
};

type SlowResponseSampleRow = {
  stationId: number;
  origin: string;
  sampleSize: number;
  averageMs: number;
  earliestTimestamp: Date | string;
  latestMessageId: number;
  latestCorrelationId: string;
  latestAction: string | null;
  latestTimestamp: Date | string;
};

function isMessageOrigin(value: string): value is MessageOrigin {
  return Object.values<string>(MessageOrigin).includes(value);
}

function toResponseLatencySamples(rows: SlowResponseSampleRow[]): ResponseLatencySample[] {
  return rows.flatMap((row) =>
    isMessageOrigin(row.origin)
      ? [
          {
            stationId: row.stationId,
            origin: row.origin,
            sampleSize: row.sampleSize,
            averageMs: row.averageMs,
            earliestTimestamp: new Date(row.earliestTimestamp).toISOString(),
            latestMessageId: row.latestMessageId,
            latestCorrelationId: row.latestCorrelationId,
            latestAction: row.latestAction,
            latestTimestamp: new Date(row.latestTimestamp).toISOString(),
          },
        ]
      : [],
  );
}

// A station's interval is the one its BootNotification was answered with; BootNotificationService
// falls back to the system default for a missing or zero interval in the same way.
const SILENT_STATIONS_SQL = `
  SELECT cs.id AS "stationId", cs."tenantId", cs."latestOcppMessageTimestamp"
    FROM "ChargingStations" cs
    LEFT JOIN "Boots" b ON b."stationId" = cs.id
   WHERE cs."tenantId" = :tenantId
     AND cs."isOnline" = true
     AND cs."latestOcppMessageTimestamp" < CAST(:at AS timestamptz) - make_interval(
           secs => :missedHeartbeats * COALESCE(NULLIF(b."heartbeatInterval", 0), :defaultHeartbeatInterval)
         )`;

// type 3 is a CallResult. Latency is from the Call being stored as sent or received to the
// response being stored as received or sent.
const SLOW_RESPONSE_SAMPLES_SQL = `
  WITH responses AS (
    SELECT r."stationId", r.origin, r.id, r."correlationId", r.action, r."timestamp",
           EXTRACT(EPOCH FROM (r."timestamp" - c."timestamp")) * 1000 AS "latencyMs",
           row_number() OVER (
             PARTITION BY r."stationId", r.origin ORDER BY r."timestamp" DESC, r.id DESC
           ) AS rn
      FROM "OCPPMessages" r
      JOIN "OCPPMessages" c
        ON c.id = r."requestMessageId" AND c."createdAt" >= CAST(:requestsSince AS timestamptz)
     WHERE r."tenantId" = :tenantId
       AND r.type = 3
       AND r."requestMessageId" IS NOT NULL
       AND r."createdAt" >= CAST(:since AS timestamptz)
  )
  SELECT "stationId", origin,
         count(*)::int AS "sampleSize",
         round(avg("latencyMs"))::int AS "averageMs",
         min("timestamp") AS "earliestTimestamp",
         max(id) FILTER (WHERE rn = 1) AS "latestMessageId",
         max("correlationId") FILTER (WHERE rn = 1) AS "latestCorrelationId",
         max(action) FILTER (WHERE rn = 1) AS "latestAction",
         max("timestamp") FILTER (WHERE rn = 1) AS "latestTimestamp"
    FROM responses
   WHERE rn <= :sampleSize
   GROUP BY "stationId", origin
  HAVING count(*) = :sampleSize AND avg("latencyMs") > :thresholdMs`;

function toNetworkAlertDto(model: NetworkAlert): NetworkAlertDto {
  return NetworkAlertSchema.parse(model.get({ plain: true }));
}

function toNetworkAlertOccurrenceDto(model: NetworkAlertOccurrence): NetworkAlertOccurrenceDto {
  return NetworkAlertOccurrenceSchema.parse(model.get({ plain: true }));
}

/** Date columns are written as Dates: the models' getters call toISOString on what they hold. */
function toAlertColumns(values: NetworkAlertUpdate): Record<string, unknown> {
  return {
    ...values,
    ...(values.firstSeenAt !== undefined && { firstSeenAt: new Date(values.firstSeenAt) }),
    ...(values.lastSeenAt !== undefined && { lastSeenAt: new Date(values.lastSeenAt) }),
    ...(values.resolvedAt !== undefined && {
      resolvedAt: values.resolvedAt === null ? null : new Date(values.resolvedAt),
    }),
  };
}

class SequelizeNetworkAlertSession implements INetworkAlertSession {
  constructor(
    private readonly _subject: NetworkAlertSubject,
    private readonly _transaction: Transaction,
  ) {}

  async findOpen(): Promise<NetworkAlertDto | undefined> {
    const { tenantId, type, stationId, connectorId } = this._subject;
    const alert = await NetworkAlert.findOne({
      where: {
        tenantId,
        type,
        stationId,
        connectorId: connectorId ?? null,
        status: { [Op.ne]: 'Resolved' },
      },
      order: [['id', 'DESC']],
      transaction: this._transaction,
    });
    return alert ? toNetworkAlertDto(alert) : undefined;
  }

  async createAlert(alert: NetworkAlertCreate): Promise<NetworkAlertDto> {
    const created = await NetworkAlert.create(
      {
        ...alert,
        ...toAlertColumns(alert),
        tenantId: this._subject.tenantId,
      },
      { transaction: this._transaction },
    );
    return toNetworkAlertDto(created);
  }

  async updateAlert(id: number, values: NetworkAlertUpdate): Promise<void> {
    await NetworkAlert.update(toAlertColumns(values), {
      where: { id, tenantId: this._subject.tenantId },
      transaction: this._transaction,
    });
  }

  async addOccurrence(occurrence: NetworkAlertOccurrenceCreate): Promise<void> {
    await NetworkAlertOccurrence.create(
      {
        ...occurrence,
        occurredAt: new Date(occurrence.occurredAt),
        tenantId: this._subject.tenantId,
      },
      { transaction: this._transaction },
    );
  }

  async countOccurrencesSince(alertId: number, since: string): Promise<number> {
    return NetworkAlertOccurrence.count({
      where: { alertId, occurredAt: { [Op.gte]: new Date(since) } },
      transaction: this._transaction,
    });
  }

  async findLatestOccurrence(alertId: number): Promise<NetworkAlertOccurrenceDto | undefined> {
    const occurrence = await NetworkAlertOccurrence.findOne({
      where: { alertId },
      order: [
        ['occurredAt', 'DESC'],
        ['id', 'DESC'],
      ],
      transaction: this._transaction,
    });
    return occurrence ? toNetworkAlertOccurrenceDto(occurrence) : undefined;
  }

  async findLatestCallFailure(
    alertId: number,
    reason: OcppCallFailureReason,
    origin: MessageOrigin,
  ): Promise<NetworkAlertOccurrenceDto | undefined> {
    const occurrence = await NetworkAlertOccurrence.findOne({
      where: { alertId, details: { reason, origin } },
      order: [
        ['occurredAt', 'DESC'],
        ['id', 'DESC'],
      ],
      transaction: this._transaction,
    });
    return occurrence ? toNetworkAlertOccurrenceDto(occurrence) : undefined;
  }

  async updateOccurrenceDetails(
    id: number,
    details: NetworkAlertOccurrenceDto['details'],
  ): Promise<void> {
    await NetworkAlertOccurrence.update(
      { details },
      { where: { id, tenantId: this._subject.tenantId }, transaction: this._transaction },
    );
  }
}

export class SequelizeNetworkAlertRepository
  extends SequelizeRepository<NetworkAlert>
  implements INetworkAlertRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: NetworkAlert.MODEL_NAME, logger, sequelizeInstance });
  }

  async withSubjectLock<T>(
    subject: NetworkAlertSubject,
    fn: (session: INetworkAlertSession) => Promise<T>,
  ): Promise<T> {
    return this.s.transaction(async (transaction) => {
      await this.s.query('SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))', {
        replacements: { key: subjectLockKey(subject) },
        type: QueryTypes.SELECT,
        transaction,
      });
      return fn(new SequelizeNetworkAlertSession(subject, transaction));
    });
  }

  async withSweepLock(fn: () => Promise<void>): Promise<boolean> {
    return this.s.transaction(async (transaction) => {
      const [row] = await this.s.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_xact_lock(hashtextextended(:key, 0)) AS locked',
        {
          replacements: { key: SWEEP_LOCK_KEY },
          type: QueryTypes.SELECT,
          transaction,
        },
      );
      if (!row?.locked) {
        return false;
      }
      await fn();
      return true;
    });
  }

  async readOpenByType(type: NetworkAlertType): Promise<OpenNetworkAlert[]> {
    const alerts = await NetworkAlert.findAll({
      where: { type, status: { [Op.ne]: 'Resolved' } },
      include: [{ model: ChargingStation, attributes: ['isOnline', 'latestOcppMessageTimestamp'] }],
    });
    const stationIds = alerts.flatMap((alert) => (alert.stationId ? [alert.stationId] : []));
    const boots = stationIds.length
      ? await Boot.findAll({
          where: { stationId: stationIds },
          attributes: ['stationId', 'heartbeatInterval'],
        })
      : [];
    const heartbeatIntervals = new Map(
      boots.map((boot) => [boot.stationId, boot.heartbeatInterval]),
    );

    return alerts.map((alert) => {
      const station = alert.chargingStation;
      return {
        alert: toNetworkAlertDto(alert),
        station: station
          ? {
              isOnline: station.isOnline,
              latestOcppMessageTimestamp: station.latestOcppMessageTimestamp
                ? new Date(station.latestOcppMessageTimestamp).toISOString()
                : null,
              heartbeatInterval:
                (alert.stationId && heartbeatIntervals.get(alert.stationId)) || null,
            }
          : null,
      };
    });
  }

  async readSilentStations(
    tenantId: number,
    at: string,
    defaultHeartbeatInterval: number,
    missedHeartbeats: number,
  ): Promise<SilentStation[]> {
    const rows = await this.s.query<SilentStationRow>(SILENT_STATIONS_SQL, {
      replacements: { tenantId, at, defaultHeartbeatInterval, missedHeartbeats },
      type: QueryTypes.SELECT,
    });
    return rows.map((row) => ({
      tenantId: row.tenantId,
      stationId: row.stationId,
      latestOcppMessageTimestamp: new Date(row.latestOcppMessageTimestamp).toISOString(),
    }));
  }

  async readTenantIds(): Promise<number[]> {
    const tenants = await Tenant.findAll({ attributes: ['id'] });
    return tenants.map((tenant) => tenant.id);
  }

  async readSlowResponseSamples(
    tenantId: number,
    since: string,
    sampleSize: number,
    thresholdMs: number,
  ): Promise<ResponseLatencySample[]> {
    const rows = await this.s.query<SlowResponseSampleRow>(SLOW_RESPONSE_SAMPLES_SQL, {
      replacements: {
        tenantId,
        since,
        requestsSince: new Date(Date.parse(since) - REQUEST_LOOKBACK_MS).toISOString(),
        sampleSize,
        thresholdMs,
      },
      type: QueryTypes.SELECT,
    });
    return toResponseLatencySamples(rows);
  }
}
