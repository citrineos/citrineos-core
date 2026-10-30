// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_0_1, type LocalListVersionDto, type SendLocalListDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  type LocalListVersionEntity,
  localListVersionTable,
  tenantLocalListVersionTable,
} from '../../db/drizzle/schema/local-list-version.js';
import {
  localListVersionAuthorizationTable,
  tenantLocalListVersionAuthorizationTable,
} from '../../db/drizzle/schema/local-list-version-authorization.js';
import { type Explicit } from '../../db/drizzle/types.js';
import type { ILocalListVersionRepository } from '../repositories.js';
import { requireAuthorizationId } from '../utils.js';
import {
  DrizzleRepository,
  type DrizzleRepositoryDependencies,
  type DrizzleWriteContext,
} from './base.js';
import {
  DrizzleLocalListAuthorizationRepository,
  TOMBSTONE_STATUS,
} from './local-list-authorization.js';

function toNonEmpty<T>(items: T[]): [T, ...T[]] | null {
  const [first, ...rest] = items;
  return first === undefined ? null : [first, ...rest];
}

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external LocalListVersionDto contract.
export function toLocalListVersionDto(entity: LocalListVersionEntity): LocalListVersionDto {
  const dto: Explicit<LocalListVersionDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    versionNumber: entity.versionNumber ?? 0,
    // Relation, not a scalar column.
    localAuthorizationList: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleLocalListVersionRepository
  extends DrizzleRepository<typeof localListVersionTable, LocalListVersionDto>
  implements ILocalListVersionRepository
{
  private readonly localListAuthorization: DrizzleLocalListAuthorizationRepository;

  constructor(dependencies: DrizzleRepositoryDependencies) {
    super(dependencies);
    this.localListAuthorization = new DrizzleLocalListAuthorizationRepository(dependencies);
  }

  protected getTable(tenantId: number): typeof localListVersionTable {
    return this.useTenantSchema ? tenantLocalListVersionTable(tenantId) : localListVersionTable;
  }

  protected toDto(row: LocalListVersionEntity): LocalListVersionDto {
    return toLocalListVersionDto(row);
  }

  private getAuthorizationJoinTable(tenantId: number): typeof localListVersionAuthorizationTable {
    return this.useTenantSchema
      ? tenantLocalListVersionAuthorizationTable(tenantId)
      : localListVersionAuthorizationTable;
  }

  // ─── Contract ──────────────────────────────────────────────────────────────

  async readLocalListVersionByStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<LocalListVersionDto | undefined> {
    const version = await this.readByStationId(tenantId, ocppConnectionName);
    return version ? this.withAuthorizations(tenantId, version) : undefined;
  }

  async validateOrReplaceLocalListVersionForStation(
    tenantId: number,
    versionNumber: number,
    ocppConnectionName: string,
  ): Promise<void> {
    await this.withAtomicWrite(async (ctx) => {
      const version = await this.readByStationId(tenantId, ocppConnectionName, ctx);
      if (!version) {
        await this.createForStation(tenantId, ocppConnectionName, versionNumber, ctx);
        return;
      }
      if (version.versionNumber === versionNumber) {
        return;
      }
      // The station reports a version we did not write, so our record of what it
      // holds is stale: keep the number, drop the entries we can no longer vouch for.
      const versionId = requireAuthorizationId(version.id, 'LocalListVersion');
      await this.unlinkAllAuthorizations(tenantId, versionId, ctx);
      await this.updateVersionNumber(tenantId, versionId, versionNumber, ctx);
    });
  }

  async createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
    tenantId: number,
    ocppConnectionName: string,
    sendLocalList: SendLocalListDto,
  ): Promise<LocalListVersionDto> {
    switch (sendLocalList.updateType) {
      case OCPP2_0_1.UpdateEnumType.Full:
        return this.replaceLocalListVersion(tenantId, ocppConnectionName, sendLocalList);
      case OCPP2_0_1.UpdateEnumType.Differential:
        return this.updateLocalListVersion(tenantId, ocppConnectionName, sendLocalList);
      default:
        throw new Error(`Unknown SendLocalList updateType ${sendLocalList.updateType}`);
    }
  }

  private async replaceLocalListVersion(
    tenantId: number,
    ocppConnectionName: string,
    sendLocalList: SendLocalListDto,
  ): Promise<LocalListVersionDto> {
    return this.withAtomicWrite(async (ctx) => {
      const old = await this.readByStationId(tenantId, ocppConnectionName, ctx);
      if (old) {
        await this.unlinkAllAuthorizations(
          tenantId,
          requireAuthorizationId(old.id, 'LocalListVersion'),
          ctx,
        );
        await this.deleteByStationId(tenantId, ocppConnectionName, ctx);
      }

      const version = await this.createForStation(
        tenantId,
        ocppConnectionName,
        sendLocalList.versionNumber,
        ctx,
      );
      const versionId = requireAuthorizationId(version.id, 'LocalListVersion');

      for (const auth of sendLocalList.localAuthorizationList ?? []) {
        await this.linkAuthorization(
          tenantId,
          versionId,
          requireAuthorizationId(auth.id, 'LocalListAuthorization'),
          ctx,
        );
      }

      return this.withAuthorizations(tenantId, version, ctx);
    });
  }

  private async updateLocalListVersion(
    tenantId: number,
    ocppConnectionName: string,
    sendLocalList: SendLocalListDto,
  ): Promise<LocalListVersionDto> {
    return this.withAtomicWrite(async (ctx) => {
      const version = await this.readByStationId(tenantId, ocppConnectionName, ctx);
      if (!version) {
        throw new Error(
          `LocalListVersion not found for ${ocppConnectionName} during differential update`,
        );
      }
      const versionId = requireAuthorizationId(version.id, 'LocalListVersion');

      // See D01.FR.05: a differential request with no entries only moves the version.
      if (!sendLocalList.localAuthorizationList) {
        const updated = await this.updateVersionNumber(
          tenantId,
          versionId,
          sendLocalList.versionNumber,
          ctx,
        );
        if (!updated) {
          throw new Error(
            `LocalListVersion not found for ${ocppConnectionName} during differential version update`,
          );
        }
        return this.withAuthorizations(tenantId, updated, ctx);
      }

      const current = await this.localListAuthorization.readByIds(
        tenantId,
        await this.readLinkedAuthorizationIds(tenantId, versionId, ctx),
        ctx,
      );

      for (const sendAuth of sendLocalList.localAuthorizationList) {
        // A tombstone has no linked Authorization and status Invalid; it is matched
        // on idToken because there is no authorizationId to match on.
        const isTombstone = !sendAuth.authorizationId && sendAuth.status === TOMBSTONE_STATUS;
        const matches = current.filter((localAuth) =>
          isTombstone
            ? localAuth.idToken === sendAuth.idToken
            : localAuth.authorizationId === sendAuth.authorizationId,
        );

        for (const oldAuth of matches) {
          await this.unlinkAuthorization(
            tenantId,
            versionId,
            requireAuthorizationId(oldAuth.id, 'LocalListAuthorization'),
            ctx,
          );
        }

        if (isTombstone) {
          continue;
        }

        await this.linkAuthorization(
          tenantId,
          versionId,
          requireAuthorizationId(sendAuth.id, 'LocalListAuthorization'),
          ctx,
        );
      }

      const updated = await this.updateVersionNumber(
        tenantId,
        versionId,
        sendLocalList.versionNumber,
        ctx,
      );
      return this.withAuthorizations(tenantId, updated ?? version, ctx);
    });
  }

  /** A station holds at most one LocalListVersion — a unique index enforces it. */
  private async readByStationId(
    tenantId: number,
    ocppConnectionName: string,
    ctx?: DrizzleWriteContext,
  ): Promise<LocalListVersionDto | undefined> {
    const table = this.getTable(tenantId);
    const rows = (await (ctx?.db ?? this.db)
      .select()
      .from(table)
      .where(
        and(eq(table.ocppConnectionName, ocppConnectionName), this.tenantFilter(table, tenantId)),
      )
      .limit(1)) as LocalListVersionEntity[];
    return rows[0] ? toLocalListVersionDto(rows[0]) : undefined;
  }

  private async createForStation(
    tenantId: number,
    ocppConnectionName: string,
    versionNumber: number,
    ctx?: DrizzleWriteContext,
  ): Promise<LocalListVersionDto> {
    return this.insert(tenantId, { ocppConnectionName, versionNumber }, ctx);
  }

  private async updateVersionNumber(
    tenantId: number,
    id: number,
    versionNumber: number,
    ctx?: DrizzleWriteContext,
  ): Promise<LocalListVersionDto | undefined> {
    return this.updateById(tenantId, id, { versionNumber, updatedAt: new Date() }, ctx);
  }

  private async deleteByStationId(
    tenantId: number,
    ocppConnectionName: string,
    ctx?: DrizzleWriteContext,
  ): Promise<void> {
    const table = this.getTable(tenantId);
    const rows = (await (ctx?.db ?? this.db)
      .delete(table)
      .where(
        and(eq(table.ocppConnectionName, ocppConnectionName), this.tenantFilter(table, tenantId)),
      )
      .returning()) as LocalListVersionEntity[];
    if (rows.length > 0) {
      this.raise(
        ctx,
        'deleted',
        rows.map((row) => toLocalListVersionDto(row)),
      );
    }
  }

  private async withAuthorizations(
    tenantId: number,
    version: LocalListVersionDto,
    ctx?: DrizzleWriteContext,
  ): Promise<LocalListVersionDto> {
    if (!version.id) {
      return version;
    }
    const ids = await this.readLinkedAuthorizationIds(tenantId, version.id, ctx);
    const authorizations = await this.localListAuthorization.readByIds(tenantId, ids, ctx);
    return { ...version, localAuthorizationList: toNonEmpty(authorizations) };
  }

  private async linkAuthorization(
    tenantId: number,
    localListVersionId: number,
    authorizationId: number,
    ctx?: DrizzleWriteContext,
  ): Promise<void> {
    const join = this.getAuthorizationJoinTable(tenantId);
    await (ctx?.db ?? this.db)
      .insert(join)
      .values({ tenantId, localListVersionId, authorizationId });
  }

  private async unlinkAuthorization(
    tenantId: number,
    localListVersionId: number,
    authorizationId: number,
    ctx?: DrizzleWriteContext,
  ): Promise<void> {
    const join = this.getAuthorizationJoinTable(tenantId);
    await (ctx?.db ?? this.db)
      .delete(join)
      .where(
        and(
          eq(join.localListVersionId, localListVersionId),
          eq(join.authorizationId, authorizationId),
          this.tenantFilter(join, tenantId),
        ),
      );
  }

  private async unlinkAllAuthorizations(
    tenantId: number,
    localListVersionId: number,
    ctx?: DrizzleWriteContext,
  ): Promise<void> {
    const join = this.getAuthorizationJoinTable(tenantId);
    await (ctx?.db ?? this.db)
      .delete(join)
      .where(
        and(eq(join.localListVersionId, localListVersionId), this.tenantFilter(join, tenantId)),
      );
  }

  /** The authorization ids linked to a LocalListVersion, oldest link first. */
  private async readLinkedAuthorizationIds(
    tenantId: number,
    localListVersionId: number,
    ctx?: DrizzleWriteContext,
  ): Promise<number[]> {
    const join = this.getAuthorizationJoinTable(tenantId);
    const rows = await (ctx?.db ?? this.db)
      .select({ authorizationId: join.authorizationId })
      .from(join)
      .where(
        and(eq(join.localListVersionId, localListVersionId), this.tenantFilter(join, tenantId)),
      )
      .orderBy(join.authorizationId);
    return rows.map((row) => row.authorizationId);
  }
}

export default DrizzleLocalListVersionRepository;
