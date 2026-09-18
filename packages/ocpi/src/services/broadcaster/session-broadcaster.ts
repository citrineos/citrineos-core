// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseBroadcaster } from './base-broadcaster.js';
import type { SessionsClientApi } from '../../transport/trigger/sessions-client-api.js';
import type { ILogObj, Logger } from 'tslog';
import type { Session } from '../../types/session.js';
import { ModuleId } from '../../types/module-id.js';
import { InterfaceRole } from '../../types/interface-role.js';
import {
  type MeterValueDto,
  type TenantDto,
  type TransactionDto,
  HttpMethod,
} from '@citrineos/types';
import type { SessionMapper } from '../../mappers/index.js';
import type { OcpiGraphqlDependencies } from '../../server/dependencies.js';
import { OcpiEmptyResponseSchema } from '../../types/ocpi-empty-response.js';
import type {
  GetTransactionTenantPartnerQueryResult,
  GetTransactionTenantPartnerQueryVariables,
  IOcpiGraphqlClient,
} from '../../transport/graphql/index.js';
import { GET_TRANSACTION_TENANT_PARTNER_QUERY } from '../../transport/graphql/index.js';

export interface SessionBroadcasterDependencies extends OcpiGraphqlDependencies {
  sessionsClientApi: SessionsClientApi;
  sessionMapper: SessionMapper;
}

export class SessionBroadcaster extends BaseBroadcaster {
  readonly logger: Logger<ILogObj>;
  readonly ocpiGraphqlClient: IOcpiGraphqlClient;
  readonly sessionsClientApi: SessionsClientApi;
  readonly sessionMapper: SessionMapper;

  constructor({
    logger,
    ocpiGraphqlClient,
    sessionsClientApi,
    sessionMapper,
  }: SessionBroadcasterDependencies) {
    super();
    this.logger = logger;
    this.ocpiGraphqlClient = ocpiGraphqlClient;
    this.sessionsClientApi = sessionsClientApi;
    this.sessionMapper = sessionMapper;
  }

  async broadcastPutSession(tenant: TenantDto, transactionDto: TransactionDto): Promise<void> {
    const session = await this.sessionMapper.mapTransactionToSession(transactionDto);
    const path = `/${tenant.countryCode}/${tenant.partyId}/${session.id}`;
    await this.broadcastSession(tenant, transactionDto.id, session, HttpMethod.Put, path);
  }

  async broadcastPatchSession(
    tenant: TenantDto,
    transactionDto: Partial<TransactionDto>,
  ): Promise<void> {
    const session = await this.sessionMapper.mapPartialTransactionToPartialSession(transactionDto);
    const path = `/${tenant.countryCode}/${tenant.partyId}/${session.id}`;
    await this.broadcastSession(tenant, transactionDto.id, session, HttpMethod.Patch, path);
  }

  async broadcastPatchSessionChargingPeriod(
    tenant: TenantDto,
    meterValueDto: MeterValueDto,
  ): Promise<void> {
    const charging_periods = await this.sessionMapper.getChargingPeriods(
      [meterValueDto],
      meterValueDto.tariffId!.toString(),
    );
    const path = `/${tenant.countryCode}/${tenant.partyId}/${meterValueDto.transactionId}`;
    await this.broadcastSession(
      tenant,
      meterValueDto.transactionDatabaseId,
      { charging_periods },
      HttpMethod.Patch,
      path,
    );
  }

  private async broadcastSession(
    tenant: TenantDto,
    transactionDatabaseId: number | null | undefined,
    session: Partial<Session>,
    method: HttpMethod,
    path: string,
  ): Promise<void> {
    try {
      const tenantPartnerId = await this.findTokenOwnerId(transactionDatabaseId);
      if (tenantPartnerId === undefined) {
        this.logger.debug(`No eMSP owns the token of session ${path}, not pushed`);
        return;
      }
      await this.sessionsClientApi.broadcastToClients({
        tenantPartnerId,
        cpoCountryCode: tenant.countryCode!,
        cpoPartyId: tenant.partyId!,
        moduleId: ModuleId.Sessions,
        interfaceRole: InterfaceRole.RECEIVER,
        httpMethod: method,
        schema: OcpiEmptyResponseSchema,
        body: session,
        path: path,
      });
    } catch (e) {
      this.logger.error(`broadcast${method}Session failed for ${path}`, e);
    }
  }

  private async findTokenOwnerId(
    transactionDatabaseId: number | null | undefined,
  ): Promise<number | undefined> {
    if (transactionDatabaseId === null || transactionDatabaseId === undefined) {
      return undefined;
    }
    const response = await this.ocpiGraphqlClient.request<
      GetTransactionTenantPartnerQueryResult,
      GetTransactionTenantPartnerQueryVariables
    >(GET_TRANSACTION_TENANT_PARTNER_QUERY, { id: transactionDatabaseId });
    return response.Transactions[0]?.authorization?.tenantPartner?.id;
  }
}
