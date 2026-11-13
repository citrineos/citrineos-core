// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type ChargingLimitSourceEnumType,
  type ChargingProfileDto,
  type ChargingScheduleDto,
  ChargingLimitSourceEnum,
} from '@citrineos/types';
import {
  type ChargingProfileEntity,
  chargingProfileTable,
  tenantChargingProfileTable,
} from '../../db/drizzle/schema/charging-profile.js';
import { and, desc, eq, max, ne, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { tenantTransactionTable, transactionTable } from '../../db/drizzle/schema/transaction.js';
import type { ChargingProfileInput } from '../../mappers/2.0.1/charging-profile-mapper.js';
import type {
  ChargingProfileDeactivation,
  ChargingProfileQuery,
  IChargingProfileRepository,
} from '../repositories.js';
import {
  DrizzleRepository,
  type DrizzleRepositoryDependencies,
  type DrizzleWriteContext,
} from './base.js';
import { DrizzleChargingScheduleRepository } from './charging-schedule.js';
import { DrizzleSalesTariffRepository } from './sales-tariff.js';
import { resolveStationId } from './resolve-station-id.js';

const TX_PROFILE = 'TxProfile';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingProfileDto contract.
export function toChargingProfileDto(entity: ChargingProfileEntity): ChargingProfileDto {
  // chargingSchedule is a required relation that cannot be produced from a flat
  // DB row; a pragmatic cast is used so the scalar mapping still compiles.
  // TODO: map relations (chargingSchedule)
  return {
    databaseId: entity.databaseId,
    ocppConnectionName: entity.ocppConnectionName,
    id: entity.id ?? undefined,
    chargingProfileKind: entity.chargingProfileKind,
    chargingProfilePurpose: entity.chargingProfilePurpose,
    recurrencyKind: entity.recurrencyKind,
    stackLevel: entity.stackLevel,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    validFrom: entity.validFrom ? entity.validFrom.toISOString() : null,
    validTo: entity.validTo ? entity.validTo.toISOString() : null,
    evseId: entity.evseId,
    isActive: entity.isActive ?? false,
    chargingLimitSource: entity.chargingLimitSource,
    transactionDatabaseId: entity.transactionDatabaseId,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  } as ChargingProfileDto;
}

export class DrizzleChargingProfileRepository
  extends DrizzleRepository<typeof chargingProfileTable, ChargingProfileDto>
  implements IChargingProfileRepository
{
  private readonly chargingSchedule: DrizzleChargingScheduleRepository;
  private readonly salesTariff: DrizzleSalesTariffRepository;

  constructor(dependencies: DrizzleRepositoryDependencies) {
    super(dependencies);
    this.chargingSchedule = new DrizzleChargingScheduleRepository(dependencies);
    this.salesTariff = new DrizzleSalesTariffRepository(dependencies);
  }

  protected getTable(tenantId: number): typeof chargingProfileTable {
    return this.useTenantSchema ? tenantChargingProfileTable(tenantId) : chargingProfileTable;
  }

  protected toDto(row: ChargingProfileEntity): ChargingProfileDto {
    return toChargingProfileDto(row);
  }

  private getTransactionTable(tenantId: number): typeof transactionTable {
    return this.useTenantSchema ? tenantTransactionTable(tenantId) : transactionTable;
  }

  // ChargingProfiles is keyed on databaseId; its `id` column carries the OCPP profile
  // id, so the id-keyed helpers on the base class address the wrong column for this
  // table and every lookup here states its key explicitly.
  private async resolveTransactionDatabaseId(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string | null | undefined,
  ): Promise<number | null> {
    if (!transactionId) {
      return null;
    }
    const stationId = await resolveStationId(
      this.db,
      tenantId,
      ocppConnectionName,
      this.useTenantSchema,
    );
    if (stationId === undefined) {
      return null;
    }
    const transactions = this.getTransactionTable(tenantId);
    const rows = await this.db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.stationId, stationId),
          eq(transactions.transactionId, transactionId),
          this.tenantFilter(transactions, tenantId),
        ),
      )
      .limit(1);
    return rows[0]?.id ?? null;
  }

  private queryFilters(tenantId: number, query: ChargingProfileQuery): (SQL | undefined)[] {
    const profiles = this.getTable(tenantId);
    return [
      query.ocppConnectionName === undefined
        ? undefined
        : eq(profiles.ocppConnectionName, query.ocppConnectionName),
      query.stackLevel === undefined ? undefined : eq(profiles.stackLevel, query.stackLevel),
      query.chargingProfilePurpose === undefined
        ? undefined
        : eq(profiles.chargingProfilePurpose, query.chargingProfilePurpose),
      query.evseId === undefined ? undefined : eq(profiles.evseId, query.evseId as number),
      query.transactionDatabaseId === undefined
        ? undefined
        : eq(profiles.transactionDatabaseId, query.transactionDatabaseId as number),
      query.isActive === undefined ? undefined : eq(profiles.isActive, query.isActive),
      this.tenantFilter(profiles, tenantId),
    ];
  }

  private async hydrateSchedules(
    tenantId: number,
    rows: ChargingProfileEntity[],
  ): Promise<ChargingProfileDto[]> {
    const byProfile = await this.chargingSchedule.readByChargingProfileDatabaseIds(
      tenantId,
      rows.map((row) => row.databaseId),
    );
    return rows.map((row) => {
      const schedules = byProfile.get(row.databaseId);
      return {
        ...toChargingProfileDto(row),
        // The DTO types chargingSchedule as a non-empty tuple, so a profile with no
        // stored schedules keeps whatever the mapper already set.
        ...(schedules?.length
          ? { chargingSchedule: schedules as ChargingProfileDto['chargingSchedule'] }
          : {}),
      };
    });
  }

  private async writeSchedules(
    tenantId: number,
    ocppConnectionName: string,
    profileDatabaseId: number,
    input: ChargingProfileInput,
    ctx: DrizzleWriteContext,
  ): Promise<void> {
    // Sequentially, not Promise.all: one pg transaction cannot interleave statements.
    for (const schedule of input.chargingSchedule) {
      const saved: ChargingScheduleDto = await this.chargingSchedule.createForProfile(
        tenantId,
        ocppConnectionName,
        profileDatabaseId,
        schedule,
        ctx,
      );
      if (schedule.salesTariff) {
        await this.salesTariff.createForSchedule(
          tenantId,
          saved.databaseId,
          schedule.salesTariff,
          ctx,
        );
      }
    }
  }

  async createOrUpdateChargingProfile(
    tenantId: number,
    chargingProfile: ChargingProfileInput,
    ocppConnectionName: string,
    evseId?: number | null,
    chargingLimitSource?: ChargingLimitSourceEnumType,
    isActive?: boolean,
  ): Promise<ChargingProfileDto> {
    const transactionDatabaseId = await this.resolveTransactionDatabaseId(
      tenantId,
      ocppConnectionName,
      chargingProfile.transactionId,
    );

    const columns = {
      id: chargingProfile.id,
      stackLevel: chargingProfile.stackLevel,
      chargingProfilePurpose: chargingProfile.chargingProfilePurpose,
      chargingProfileKind: chargingProfile.chargingProfileKind,
      recurrencyKind: chargingProfile.recurrencyKind ?? null,
      validFrom: chargingProfile.validFrom ? new Date(chargingProfile.validFrom) : null,
      validTo: chargingProfile.validTo ? new Date(chargingProfile.validTo) : null,
      ocppConnectionName,
      evseId: evseId ?? null,
      transactionDatabaseId,
      chargingLimitSource: chargingLimitSource ?? ChargingLimitSourceEnum.CSO,
      isActive: isActive ?? false,
    };

    return await this.withAtomicWrite(async (ctx) => {
      const profiles = this.getTable(tenantId);
      const existing = (await ctx.db
        .select()
        .from(profiles)
        .where(
          and(
            eq(profiles.ocppConnectionName, ocppConnectionName),
            eq(profiles.id, chargingProfile.id),
            this.tenantFilter(profiles, tenantId),
          ),
        )
        .limit(1)) as ChargingProfileEntity[];

      if (!existing[0]) {
        const inserted = (await ctx.db
          .insert(profiles)
          .values({ ...columns, tenantId })
          .returning()) as ChargingProfileEntity[];
        const dto = toChargingProfileDto(inserted[0]);
        this.raise(ctx, 'created', [dto]);
        await this.writeSchedules(
          tenantId,
          ocppConnectionName,
          dto.databaseId,
          chargingProfile,
          ctx,
        );
        return dto;
      }

      const databaseId = existing[0].databaseId;
      const updated = (await ctx.db
        .update(profiles)
        .set({ ...columns, updatedAt: new Date() })
        .where(and(eq(profiles.databaseId, databaseId), this.tenantFilter(profiles, tenantId)))
        .returning()) as ChargingProfileEntity[];
      const dto = toChargingProfileDto(updated[0]);
      this.raise(ctx, 'updated', [dto]);

      const removedScheduleIds = await this.chargingSchedule.deleteByChargingProfileDatabaseId(
        tenantId,
        databaseId,
        ctx,
      );
      await this.salesTariff.deleteByChargingScheduleDatabaseIds(tenantId, removedScheduleIds, ctx);
      await this.writeSchedules(tenantId, ocppConnectionName, databaseId, chargingProfile, ctx);
      return dto;
    });
  }

  async readChargingProfiles(
    tenantId: number,
    query: ChargingProfileQuery,
  ): Promise<ChargingProfileDto[]> {
    const profiles = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(profiles)
      .where(and(...this.queryFilters(tenantId, query)))) as ChargingProfileEntity[];
    return rows.map((row) => toChargingProfileDto(row));
  }

  async readTxProfilesWithSchedules(
    tenantId: number,
    ocppConnectionName: string,
    transactionDatabaseId: number | null | undefined,
  ): Promise<ChargingProfileDto[]> {
    const profiles = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(profiles)
      .where(
        and(
          eq(profiles.ocppConnectionName, ocppConnectionName),
          transactionDatabaseId == null
            ? sql`${profiles.transactionDatabaseId} is null`
            : eq(profiles.transactionDatabaseId, transactionDatabaseId),
          eq(profiles.chargingProfilePurpose, TX_PROFILE),
          eq(profiles.isActive, true),
          this.tenantFilter(profiles, tenantId),
        ),
      )) as ChargingProfileEntity[];
    return await this.hydrateSchedules(tenantId, rows);
  }

  async readHighestStackLevelTxProfile(
    tenantId: number,
    ocppConnectionName: string,
    transactionDatabaseId: number | null,
  ): Promise<ChargingProfileDto | undefined> {
    const profiles = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(profiles)
      .where(
        and(
          eq(profiles.ocppConnectionName, ocppConnectionName),
          transactionDatabaseId == null
            ? sql`${profiles.transactionDatabaseId} is null`
            : eq(profiles.transactionDatabaseId, transactionDatabaseId),
          eq(profiles.chargingProfilePurpose, TX_PROFILE),
          this.tenantFilter(profiles, tenantId),
        ),
      )
      .orderBy(desc(profiles.stackLevel))
      .limit(1)) as ChargingProfileEntity[];

    const hydrated = await this.hydrateSchedules(tenantId, rows);
    return hydrated[0];
  }

  async deactivateChargingProfiles(
    tenantId: number,
    ocppConnectionName: string,
    criteria: ChargingProfileDeactivation,
  ): Promise<number> {
    const profiles = this.getTable(tenantId);
    const rows = (await this.db
      .update(profiles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(profiles.ocppConnectionName, ocppConnectionName),
          eq(profiles.isActive, true),
          criteria.chargingProfileId === undefined
            ? undefined
            : eq(profiles.id, criteria.chargingProfileId),
          criteria.excludeChargingProfileId === undefined
            ? undefined
            : ne(profiles.id, criteria.excludeChargingProfileId),
          criteria.evseId === undefined
            ? undefined
            : eq(profiles.evseId, criteria.evseId as number),
          criteria.stackLevel === undefined
            ? undefined
            : eq(profiles.stackLevel, criteria.stackLevel),
          criteria.chargingProfilePurpose === undefined
            ? undefined
            : eq(profiles.chargingProfilePurpose, criteria.chargingProfilePurpose),
          criteria.chargingLimitSource === undefined
            ? undefined
            : eq(profiles.chargingLimitSource, criteria.chargingLimitSource),
          this.tenantFilter(profiles, tenantId),
        ),
      )
      .returning()) as ChargingProfileEntity[];

    for (const row of rows) {
      this.raise(undefined, 'updated', [toChargingProfileDto(row)]);
    }
    return rows.length;
  }

  /** Matches CrudRepository.readNextValue: max + 1, or the start value when none exist. */
  async getNextChargingProfileId(tenantId: number, ocppConnectionName: string): Promise<number> {
    const profiles = this.getTable(tenantId);
    const rows = await this.db
      .select({ value: max(profiles.id) })
      .from(profiles)
      .where(
        and(
          eq(profiles.ocppConnectionName, ocppConnectionName),
          this.tenantFilter(profiles, tenantId),
        ),
      );
    return (rows[0]?.value ?? 0) + 1;
  }

  async getNextStackLevel(
    tenantId: number,
    ocppConnectionName: string,
    transactionDatabaseId: number | null,
    profilePurpose: ChargingProfileDeactivation['chargingProfilePurpose'],
  ): Promise<number> {
    const profiles = this.getTable(tenantId);
    const rows = await this.db
      .select({ value: max(profiles.stackLevel) })
      .from(profiles)
      .where(
        and(
          eq(profiles.ocppConnectionName, ocppConnectionName),
          transactionDatabaseId == null
            ? sql`${profiles.transactionDatabaseId} is null`
            : eq(profiles.transactionDatabaseId, transactionDatabaseId),
          profilePurpose === undefined
            ? undefined
            : eq(profiles.chargingProfilePurpose, profilePurpose),
          this.tenantFilter(profiles, tenantId),
        ),
      );
    // readNextValue is called with a start value of 0 for stack level.
    return rows[0]?.value == null ? 0 : rows[0].value + 1;
  }
}
