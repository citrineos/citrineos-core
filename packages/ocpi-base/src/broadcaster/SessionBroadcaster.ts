// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseBroadcaster } from './BaseBroadcaster.js';
import { Service } from 'typedi';
import { SessionsClientApi } from '../trigger/SessionsClientApi.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { Session } from '../model/Session.js';
import { ModuleId } from '../model/ModuleId.js';
import { InterfaceRole } from '../model/InterfaceRole.js';
import type { MeterValueDto, TenantDto, TransactionDto } from '@citrineos/base';
import { HttpMethod } from '@citrineos/base';
import { SessionMapper } from '../mapper/index.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';

@Service()
export class SessionBroadcaster extends BaseBroadcaster {
  constructor(
    readonly logger: Logger<ILogObj>,
    readonly sessionsClientApi: SessionsClientApi,
    readonly sessionMapper: SessionMapper,
  ) {
    super();
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
