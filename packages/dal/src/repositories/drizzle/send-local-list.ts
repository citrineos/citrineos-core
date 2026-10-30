// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  OCPP1_6,
  OCPP2_0_1,
  type AuthorizationDto,
  type LocalListAuthorizationDto,
  type SendLocalListDto,
} from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  type SendLocalListEntity,
  type SendLocalListEntityInsert,
  sendLocalListTable,
  tenantSendLocalListTable,
} from '../../db/drizzle/schema/send-local-list.js';
import {
  sendLocalListAuthorizationTable,
  tenantSendLocalListAuthorizationTable,
} from '../../db/drizzle/schema/send-local-list-authorization.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { AuthorizationMapper } from '../../mappers/2.0.1/authorization-mapper.js';
import { LocalAuthListMapper } from '../../mappers/1.6/local-auth-list-mapper.js';
import type { ISendLocalListRepository } from '../repositories.js';
import { requireAuthorizationId } from '../utils.js';
import { DrizzleAuthorizationRepository } from './authorization.js';
import {
  DrizzleRepository,
  type DrizzleRepositoryDependencies,
  type DrizzleWriteContext,
} from './base.js';
import {
  DrizzleLocalListAuthorizationRepository,
  type LocalListAuthorizationInput,
  TOMBSTONE_STATUS,
} from './local-list-authorization.js';

export type SendLocalListInput = Omit<SendLocalListEntityInsert, 'tenantId'>;

function snapshotOf(auth: AuthorizationDto): LocalListAuthorizationInput {
  return {
    authorizationId: auth.id,
    idToken: auth.idToken,
    idTokenType: auth.idTokenType ?? null,
    status: auth.status,
    allowedConnectorTypes: auth.allowedConnectorTypes ?? null,
    disallowedEvseIdPrefixes: auth.disallowedEvseIdPrefixes ?? null,
    additionalInfo: auth.additionalInfo ?? null,
    // DTO contract is an ISO string; the column is timestamptz (mode: 'date').
    cacheExpiryDateTime: auth.cacheExpiryDateTime ? new Date(auth.cacheExpiryDateTime) : null,
    chargingPriority: auth.chargingPriority ?? null,
    language1: auth.language1 ?? null,
    language2: auth.language2 ?? null,
    personalMessage: auth.personalMessage ?? null,
    groupAuthorizationId: auth.groupAuthorizationId ?? null,
  };
}

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external SendLocalListDto contract.
export function toSendLocalListDto(entity: SendLocalListEntity): SendLocalListDto {
  const dto: Explicit<SendLocalListDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    correlationId: entity.correlationId ?? '',
    versionNumber: entity.versionNumber ?? 0,
    updateType: entity.updateType ?? '',
    // Relation, not a scalar column.
    localAuthorizationList: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleSendLocalListRepository
  extends DrizzleRepository<typeof sendLocalListTable, SendLocalListDto>
  implements ISendLocalListRepository
{
  private readonly authorization: DrizzleAuthorizationRepository;
  private readonly localListAuthorization: DrizzleLocalListAuthorizationRepository;

  constructor(dependencies: DrizzleRepositoryDependencies) {
    super(dependencies);
    this.authorization = new DrizzleAuthorizationRepository(dependencies);
    this.localListAuthorization = new DrizzleLocalListAuthorizationRepository(dependencies);
  }

  protected getTable(tenantId: number): typeof sendLocalListTable {
    return this.useTenantSchema ? tenantSendLocalListTable(tenantId) : sendLocalListTable;
  }

  protected toDto(row: SendLocalListEntity): SendLocalListDto {
    return toSendLocalListDto(row);
  }

  private getAuthorizationJoinTable(tenantId: number): typeof sendLocalListAuthorizationTable {
    return this.useTenantSchema
      ? tenantSendLocalListAuthorizationTable(tenantId)
      : sendLocalListAuthorizationTable;
  }

  async createSendLocalListFromRequestData(
    tenantId: number,
    ocppConnectionName: string,
    correlationId: string,
    updateType: OCPP2_0_1.UpdateEnumType,
    versionNumber: number,
    localAuthorizationList?: OCPP2_0_1.AuthorizationData[],
  ): Promise<SendLocalListDto> {
    return this.withAtomicWrite(async (ctx) => {
      const sendLocalList = await this.createSendLocalList(
        tenantId,
        { ocppConnectionName, correlationId, versionNumber, updateType },
        ctx,
      );
      const sendLocalListId = requireAuthorizationId(sendLocalList.id, 'SendLocalList');

      for (const authData of localAuthorizationList ?? []) {
        const idTokenType = AuthorizationMapper.fromIdTokenEnumType(authData.idToken.type);

        if (updateType === OCPP2_0_1.UpdateEnumType.Differential && !authData.idTokenInfo) {
          await this.addTombstone(
            tenantId,
            sendLocalListId,
            authData.idToken.idToken,
            idTokenType,
            ctx,
          );
          continue;
        }

        const auth = await this.authorization.readOnlyOneByQuerystring(tenantId, {
          idToken: authData.idToken.idToken,
          type: idTokenType,
        });
        if (!auth) {
          throw new Error(
            `Authorization not found for ${JSON.stringify(authData)}, invalid SendLocalListRequest (create necessary Authorizations first)`,
          );
        }

        if (authData.idTokenInfo?.groupIdToken) {
          const groupAuth = await this.authorization.readOnlyOneByQuerystring(tenantId, {
            idToken: authData.idTokenInfo.groupIdToken.idToken,
            type: AuthorizationMapper.fromIdTokenEnumType(authData.idTokenInfo.groupIdToken.type),
          });
          if (!auth.groupAuthorizationId || groupAuth?.id !== auth.groupAuthorizationId) {
            throw new Error(
              `Authorization groupIdToken in SendLocalListRequest ${JSON.stringify(authData.idTokenInfo.groupIdToken)} does not match groupAuthorizationId in database ${JSON.stringify(auth.groupAuthorizationId)} (update the groupAuthorization first)`,
            );
          }
        }

        await this.addSnapshot(tenantId, sendLocalListId, snapshotOf(auth), ctx);
      }

      return this.withAuthorizations(tenantId, sendLocalList, ctx);
    });
  }

  async createSendLocalListFromRequestData16(
    tenantId: number,
    stationId: string,
    correlationId: string,
    updateType: OCPP1_6.SendLocalListRequestUpdateType,
    versionNumber: number,
    localAuthorizationList?: NonNullable<OCPP1_6.SendLocalListRequest['localAuthorizationList']>,
  ): Promise<SendLocalListDto> {
    return this.withAtomicWrite(async (ctx) => {
      const sendLocalList = await this.createSendLocalList(
        tenantId,
        // The updateType column is a plain string. Both 1.6 and 2.0.1 use the
        // values 'Full' and 'Differential', so the two enums share a column.
        { ocppConnectionName: stationId, correlationId, versionNumber, updateType },
        ctx,
      );
      const sendLocalListId = requireAuthorizationId(sendLocalList.id, 'SendLocalList');

      for (const authData of localAuthorizationList ?? []) {
        if (!authData.idTag) {
          continue;
        }

        // For DIFFERENTIAL deletes the spec allows entries with no idTagInfo. These
        // are recorded as pure tombstones (status Invalid, no linked Authorization)
        // so the response handler drops the matching authorization from the version
        // instead of re-inserting it as Invalid.
        if (
          updateType === OCPP1_6.SendLocalListRequestUpdateType.Differential &&
          !authData.idTagInfo
        ) {
          await this.addTombstone(tenantId, sendLocalListId, authData.idTag, null, ctx);
          continue;
        }

        const auth = await this.readByIdTag(tenantId, authData.idTag);
        if (!auth) {
          throw new Error(
            `Authorization not found for idTag '${authData.idTag}' (create the Authorization before adding it to a local auth list)`,
          );
        }

        let groupAuthorizationId: number | null = null;
        if (authData.idTagInfo?.parentIdTag) {
          const parent = await this.readByIdTag(tenantId, authData.idTagInfo.parentIdTag);
          if (!parent) {
            throw new Error(
              `Parent authorization not found for parentIdTag '${authData.idTagInfo.parentIdTag}'`,
            );
          }
          groupAuthorizationId = parent.id ?? null;
        }

        // 1.6 carries no IdTokenEnumType, and the status and expiry come from the
        // request rather than from the stored Authorization.
        await this.addSnapshot(
          tenantId,
          sendLocalListId,
          {
            authorizationId: auth.id,
            idToken: authData.idTag,
            idTokenType: null,
            status: LocalAuthListMapper.fromIdTagStatus(
              authData.idTagInfo?.status ?? OCPP1_6.SendLocalListRequestStatus.Accepted,
            ),
            cacheExpiryDateTime: authData.idTagInfo?.expiryDate
              ? new Date(authData.idTagInfo.expiryDate)
              : null,
            groupAuthorizationId,
          },
          ctx,
        );
      }

      return this.withAuthorizations(tenantId, sendLocalList, ctx);
    });
  }

  async getSendLocalListRequestByStationIdAndCorrelationId(
    tenantId: number,
    ocppConnectionName: string,
    correlationId: string,
  ): Promise<SendLocalListDto | undefined> {
    const table = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(table)
      .where(
        and(
          eq(table.ocppConnectionName, ocppConnectionName),
          eq(table.correlationId, correlationId),
          this.tenantFilter(table, tenantId),
        ),
      )
      .limit(1)) as SendLocalListEntity[];
    return rows[0] ? this.withAuthorizations(tenantId, toSendLocalListDto(rows[0])) : undefined;
  }

  private async readByIdTag(
    tenantId: number,
    idTag: string,
  ): Promise<AuthorizationDto | undefined> {
    const matches = await this.authorization.readAllByQuerystring(tenantId, { idToken: idTag });
    return matches[0];
  }

  private async createSendLocalList(
    tenantId: number,
    values: SendLocalListInput,
    ctx?: DrizzleWriteContext,
  ): Promise<SendLocalListDto> {
    return this.insert(tenantId, values, ctx);
  }

  private async addSnapshot(
    tenantId: number,
    sendLocalListId: number,
    values: LocalListAuthorizationInput,
    ctx: DrizzleWriteContext,
  ): Promise<void> {
    const snapshot = await this.localListAuthorization.createLocalListAuthorization(
      tenantId,
      values,
      ctx,
    );
    await this.linkAuthorization(
      tenantId,
      sendLocalListId,
      requireAuthorizationId(snapshot.id, 'LocalListAuthorization'),
      ctx,
    );
  }

  private async addTombstone(
    tenantId: number,
    sendLocalListId: number,
    idToken: string,
    idTokenType: string | null,
    ctx: DrizzleWriteContext,
  ): Promise<void> {
    await this.addSnapshot(
      tenantId,
      sendLocalListId,
      { idToken, idTokenType, status: TOMBSTONE_STATUS },
      ctx,
    );
  }

  private async withAuthorizations(
    tenantId: number,
    sendLocalList: SendLocalListDto,
    ctx?: DrizzleWriteContext,
  ): Promise<SendLocalListDto> {
    if (!sendLocalList.id) {
      return sendLocalList;
    }
    return {
      ...sendLocalList,
      localAuthorizationList: await this.readAuthorizations(tenantId, sendLocalList.id, ctx),
    };
  }

  private async readAuthorizations(
    tenantId: number,
    sendLocalListId: number,
    ctx?: DrizzleWriteContext,
  ): Promise<LocalListAuthorizationDto[]> {
    const ids = await this.readLinkedAuthorizationIds(tenantId, sendLocalListId, ctx);
    return this.localListAuthorization.readByIds(tenantId, ids, ctx);
  }

  private async linkAuthorization(
    tenantId: number,
    sendLocalListId: number,
    authorizationId: number,
    ctx?: DrizzleWriteContext,
  ): Promise<void> {
    const join = this.getAuthorizationJoinTable(tenantId);
    await (ctx?.db ?? this.db).insert(join).values({ tenantId, sendLocalListId, authorizationId });
  }

  /** The authorization ids linked to a SendLocalList, oldest link first. */
  private async readLinkedAuthorizationIds(
    tenantId: number,
    sendLocalListId: number,
    ctx?: DrizzleWriteContext,
  ): Promise<number[]> {
    const join = this.getAuthorizationJoinTable(tenantId);
    const rows = await (ctx?.db ?? this.db)
      .select({ authorizationId: join.authorizationId })
      .from(join)
      .where(and(eq(join.sendLocalListId, sendLocalListId), this.tenantFilter(join, tenantId)))
      .orderBy(join.authorizationId);
    return rows.map((row) => row.authorizationId);
  }
}

export default DrizzleSendLocalListRepository;
