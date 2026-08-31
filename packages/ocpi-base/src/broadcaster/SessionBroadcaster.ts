// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseBroadcaster } from './BaseBroadcaster.js';
import type { SessionsClientApi } from '../trigger/SessionsClientApi.js';
import type { ILogObj, Logger } from 'tslog';
import type { Session } from '../model/Session.js';
import { ModuleId } from '../model/ModuleId.js';
import { InterfaceRole } from '../model/InterfaceRole.js';
import {
  type MeterValueDto,
  type TenantDto,
  type TransactionDto,
  HttpMethod,
} from '@citrineos/types';
import type { SessionMapper } from '../mapper/index.js';
import type { OcpiDependencies } from '../dependencies.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';

export interface SessionBroadcasterDependencies extends OcpiDependencies {
  sessionsClientApi: SessionsClientApi;
  sessionMapper: SessionMapper;
}

export class SessionBroadcaster extends BaseBroadcaster {
  readonly logger: Logger<ILogObj>;
  readonly sessionsClientApi: SessionsClientApi;
  readonly sessionMapper: SessionMapper;

  constructor({ logger, sessionsClientApi, sessionMapper }: SessionBroadcasterDependencies) {
    super();
    this.logger = logger;
    this.sessionsClientApi = sessionsClientApi;
    this.sessionMapper = sessionMapper;
  }

  async broadcastPutSession(tenant: TenantDto, transactionDto: TransactionDto): Promise<void> {
    const session = await this.sessionMapper.mapTransactionToSession(transactionDto);
    const path = `/${tenant.countryCode}/${tenant.partyId}/${session.id}`;
    await this.broadcastSession(tenant, session, HttpMethod.Put, path);
  }

  async broadcastPatchSession(
    tenant: TenantDto,
    transactionDto: Partial<TransactionDto>,
  ): Promise<void> {
    const session = await this.sessionMapper.mapPartialTransactionToPartialSession(transactionDto);
    const path = `/${tenant.countryCode}/${tenant.partyId}/${session.id}`;
    await this.broadcastSession(tenant, session, HttpMethod.Patch, path);
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
    await this.broadcastSession(tenant, { charging_periods }, HttpMethod.Patch, path);
  }

  private async broadcastSession(
    tenant: TenantDto,
    session: Partial<Session>,
    method: HttpMethod,
    path: string,
  ): Promise<void> {
    try {
      await this.sessionsClientApi.broadcastToClients({
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
}
