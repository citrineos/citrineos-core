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
import { and, count, desc, eq, gte, isNull, ne, sql } from 'drizzle-orm';
import { bootTable } from '../../db/drizzle/schema/boot.js';
import { chargingStationTable } from '../../db/drizzle/schema/charging-station.js';
import { networkAlertTable } from '../../db/drizzle/schema/network-alert.js';
import { networkAlertOccurrenceTable } from '../../db/drizzle/schema/network-alert-occurrence.js';
import { tenantTable } from '../../db/drizzle/schema/tenant.js';
import type {
  NetworkAlertSubject,
  OpenNetworkAlert,
  ResponseLatencySample,
  SilentStation,
} from '../../interfaces/projections/network-alert.js';
import type { INetworkAlertRepository, INetworkAlertSession } from '../repositories.js';
import { type DrizzleExecutor, DrizzleRepository } from './base.js';

type NetworkAlertRow = typeof networkAlertTable.$inferSelect;
type NetworkAlertOccurrenceRow = typeof networkAlertOccurrenceTable.$inferSelect;

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
  lastHeardAt: Date | string;
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

// ─── Mappers ─────────────────────────────────────────────────────────────────
// Parsed rather than assembled field by field: the DTOs are unions keyed on `type`, and parsing
// is what proves a row's `details` matches its type.
export function toNetworkAlertDto(entity: NetworkAlertRow): NetworkAlertDto {
  return NetworkAlertSchema.parse({
    ...entity,
    firstSeenAt: entity.firstSeenAt.toISOString(),
    lastSeenAt: entity.lastSeenAt.toISOString(),
    resolvedAt: entity.resolvedAt?.toISOString() ?? null,
  });
}

export function toNetworkAlertOccurrenceDto(
  entity: NetworkAlertOccurrenceRow,
): NetworkAlertOccurrenceDto {
  return NetworkAlertOccurrenceSchema.parse({
    ...entity,
    occurredAt: entity.occurredAt.toISOString(),
  });
}

function toAlertColumns(
  values: NetworkAlertUpdate,
): Partial<typeof networkAlertTable.$inferInsert> {
  return {
    ...values,
    firstSeenAt: values.firstSeenAt === undefined ? undefined : new Date(values.firstSeenAt),
    lastSeenAt: values.lastSeenAt === undefined ? undefined : new Date(values.lastSeenAt),
    resolvedAt:
      values.resolvedAt === undefined || values.resolvedAt === null
        ? values.resolvedAt
        : new Date(values.resolvedAt),
  };
}

class DrizzleNetworkAlertSession implements INetworkAlertSession {
  constructor(
    private readonly _subject: NetworkAlertSubject,
    private readonly _db: DrizzleExecutor,
  ) {}

  async findOpen(): Promise<NetworkAlertDto | undefined> {
    const { tenantId, type, stationId, connectorId } = this._subject;
    const rows = await this._db
      .select()
      .from(networkAlertTable)
      .where(
        and(
          eq(networkAlertTable.tenantId, tenantId),
          eq(networkAlertTable.type, type),
          eq(networkAlertTable.stationId, stationId),
          connectorId == null
            ? isNull(networkAlertTable.connectorId)
            : eq(networkAlertTable.connectorId, connectorId),
          ne(networkAlertTable.status, 'Resolved'),
        ),
      )
      .orderBy(desc(networkAlertTable.id))
      .limit(1);
    return rows[0] ? toNetworkAlertDto(rows[0]) : undefined;
  }

  async createAlert(alert: NetworkAlertCreate): Promise<NetworkAlertDto> {
    const rows = await this._db
      .insert(networkAlertTable)
      .values({
        ...alert,
        firstSeenAt: new Date(alert.firstSeenAt),
        lastSeenAt: new Date(alert.lastSeenAt),
        resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : null,
        tenantId: this._subject.tenantId,
      })
      .returning();
    return toNetworkAlertDto(rows[0]);
  }

  async updateAlert(id: number, values: NetworkAlertUpdate): Promise<void> {
    await this._db
      .update(networkAlertTable)
      .set({ ...toAlertColumns(values), updatedAt: new Date() })
      .where(
        and(eq(networkAlertTable.id, id), eq(networkAlertTable.tenantId, this._subject.tenantId)),
      );
  }

  async addOccurrence(occurrence: NetworkAlertOccurrenceCreate): Promise<void> {
    await this._db.insert(networkAlertOccurrenceTable).values({
      ...occurrence,
      occurredAt: new Date(occurrence.occurredAt),
      tenantId: this._subject.tenantId,
    });
  }

  async countOccurrencesSince(alertId: number, since: string): Promise<number> {
    const rows = await this._db
      .select({ count: count() })
      .from(networkAlertOccurrenceTable)
      .where(
        and(
          eq(networkAlertOccurrenceTable.alertId, alertId),
          gte(networkAlertOccurrenceTable.occurredAt, new Date(since)),
        ),
      );
    return rows[0]?.count ?? 0;
  }

  async findLatestOccurrence(alertId: number): Promise<NetworkAlertOccurrenceDto | undefined> {
    const rows = await this._db
      .select()
      .from(networkAlertOccurrenceTable)
      .where(eq(networkAlertOccurrenceTable.alertId, alertId))
      .orderBy(desc(networkAlertOccurrenceTable.occurredAt), desc(networkAlertOccurrenceTable.id))
      .limit(1);
    return rows[0] ? toNetworkAlertOccurrenceDto(rows[0]) : undefined;
  }

  async findLatestCallFailure(
    alertId: number,
    reason: OcppCallFailureReason,
    origin: MessageOrigin,
  ): Promise<NetworkAlertOccurrenceDto | undefined> {
    const rows = await this._db
      .select()
      .from(networkAlertOccurrenceTable)
      .where(
        and(
          eq(networkAlertOccurrenceTable.alertId, alertId),
          sql`${networkAlertOccurrenceTable.details}->>'reason' = ${reason}`,
          sql`${networkAlertOccurrenceTable.details}->>'origin' = ${origin}`,
        ),
      )
      .orderBy(desc(networkAlertOccurrenceTable.occurredAt), desc(networkAlertOccurrenceTable.id))
      .limit(1);
    return rows[0] ? toNetworkAlertOccurrenceDto(rows[0]) : undefined;
  }

  async updateOccurrenceDetails(
    id: number,
    details: NetworkAlertOccurrenceDto['details'],
  ): Promise<void> {
    await this._db
      .update(networkAlertOccurrenceTable)
      .set({ details, updatedAt: new Date() })
      .where(
        and(
          eq(networkAlertOccurrenceTable.id, id),
          eq(networkAlertOccurrenceTable.tenantId, this._subject.tenantId),
        ),
      );
  }
}

export class DrizzleNetworkAlertRepository
  extends DrizzleRepository<typeof networkAlertTable, NetworkAlertDto>
  implements INetworkAlertRepository
{
  // No schema-per-tenant variant: the network alert tables are row-level only.
  protected getTable(_tenantId: number): typeof networkAlertTable {
    return networkAlertTable;
  }

  protected toDto(row: NetworkAlertRow): NetworkAlertDto {
    return toNetworkAlertDto(row);
  }

  async withSubjectLock<T>(
    subject: NetworkAlertSubject,
    fn: (session: INetworkAlertSession) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${subjectLockKey(subject)}, 0))`,
      );
      return fn(new DrizzleNetworkAlertSession(subject, tx));
    });
  }

  async withSweepLock(fn: () => Promise<void>): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const result = await tx.execute<{ locked: boolean }>(
        sql`SELECT pg_try_advisory_xact_lock(hashtextextended(${SWEEP_LOCK_KEY}, 0)) AS locked`,
      );
      if (!result.rows[0]?.locked) {
        return false;
      }
      await fn();
      return true;
    });
  }

  async readOpenByType(type: NetworkAlertType): Promise<OpenNetworkAlert[]> {
    const rows = await this.db
      .select({
        alert: networkAlertTable,
        stationRowId: chargingStationTable.id,
        isOnline: chargingStationTable.isOnline,
        latestOcppMessageTimestamp: chargingStationTable.latestOcppMessageTimestamp,
        lastConnectedAt: chargingStationTable.lastConnectedAt,
        heartbeatInterval: bootTable.heartbeatInterval,
      })
      .from(networkAlertTable)
      .leftJoin(chargingStationTable, eq(chargingStationTable.id, networkAlertTable.stationId))
      .leftJoin(bootTable, eq(bootTable.stationId, networkAlertTable.stationId))
      .where(and(eq(networkAlertTable.type, type), ne(networkAlertTable.status, 'Resolved')));
    return rows.map((row) => ({
      alert: toNetworkAlertDto(row.alert),
      station:
        row.stationRowId === null
          ? null
          : {
              isOnline: row.isOnline ?? false,
              latestOcppMessageTimestamp: row.latestOcppMessageTimestamp?.toISOString() ?? null,
              lastConnectedAt: row.lastConnectedAt?.toISOString() ?? null,
              heartbeatInterval: row.heartbeatInterval || null,
            },
    }));
  }

  async readSilentStations(
    tenantId: number,
    at: string,
    defaultHeartbeatInterval: number,
    missedHeartbeats: number,
  ): Promise<SilentStation[]> {
    // A station's interval is the one its BootNotification was answered with; BootNotificationService
    // falls back to the system default for a missing or zero interval in the same way. Silence is
    // counted from the latest connect too: a station that has just reconnected has had no chance to
    // send anything since. GREATEST ignores nulls.
    const result = await this.db.execute<SilentStationRow>(sql`
      SELECT cs.id AS "stationId", cs."tenantId",
             GREATEST(cs."latestOcppMessageTimestamp", cs."lastConnectedAt") AS "lastHeardAt"
        FROM "ChargingStations" cs
        LEFT JOIN "Boots" b ON b."stationId" = cs.id
       WHERE cs."tenantId" = ${tenantId}
         AND cs."isOnline" = true
         AND GREATEST(cs."latestOcppMessageTimestamp", cs."lastConnectedAt")
               < CAST(${at} AS timestamptz) - make_interval(
               secs => ${missedHeartbeats} * COALESCE(NULLIF(b."heartbeatInterval", 0), ${defaultHeartbeatInterval})
             )`);
    return result.rows.map((row) => ({
      tenantId: row.tenantId,
      stationId: row.stationId,
      lastHeardAt: new Date(row.lastHeardAt).toISOString(),
    }));
  }

  async readTenantIds(): Promise<number[]> {
    const rows = await this.db.select({ id: tenantTable.id }).from(tenantTable);
    return rows.map((row) => row.id);
  }

  async readSlowResponseSamples(
    tenantId: number,
    since: string,
    sampleSize: number,
    thresholdMs: number,
  ): Promise<ResponseLatencySample[]> {
    const requestsSince = new Date(Date.parse(since) - REQUEST_LOOKBACK_MS).toISOString();
    // type 3 is a CallResult. Latency is from the Call being stored as sent or received to the
    // response being stored as received or sent.
    const result = await this.db.execute<SlowResponseSampleRow>(sql`
      WITH responses AS (
        SELECT r."stationId", r.origin, r.id, r."correlationId", r.action, r."timestamp",
               EXTRACT(EPOCH FROM (r."timestamp" - c."timestamp")) * 1000 AS "latencyMs",
               row_number() OVER (
                 PARTITION BY r."stationId", r.origin ORDER BY r."timestamp" DESC, r.id DESC
               ) AS rn
          FROM "OCPPMessages" r
          JOIN "OCPPMessages" c
            ON c.id = r."requestMessageId" AND c."createdAt" >= CAST(${requestsSince} AS timestamptz)
         WHERE r."tenantId" = ${tenantId}
           AND r.type = 3
           AND r."requestMessageId" IS NOT NULL
           AND r."createdAt" >= CAST(${since} AS timestamptz)
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
       WHERE rn <= ${sampleSize}
       GROUP BY "stationId", origin
      HAVING count(*) = ${sampleSize} AND avg("latencyMs") > ${thresholdMs}`);
    return toResponseLatencySamples(result.rows);
  }
}
