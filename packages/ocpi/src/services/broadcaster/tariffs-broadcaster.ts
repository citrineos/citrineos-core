// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseBroadcaster } from './base-broadcaster.js';
import type { TariffsClientApi } from '../../transport/trigger/tariffs-client-api.js';
import type { ILogObj, Logger } from 'tslog';
import { ModuleId } from '../../types/module-id.js';
import { InterfaceRole } from '../../types/interface-role.js';
import { type TariffDto, type TenantDto, HttpMethod } from '@citrineos/types';
import type { Tariff } from '../../types/tariff.js';
import { OcpiEmptyResponseSchema } from '../../types/ocpi-empty-response.js';
import type { TariffsService } from '../tariffs-service.js';
import type { OcpiDependencies } from '../../server/dependencies.js';

export interface TariffsBroadcasterDependencies extends OcpiDependencies {
  tariffsClientApi: TariffsClientApi;
  tariffsService: TariffsService;
}

export class TariffsBroadcaster extends BaseBroadcaster {
  readonly logger: Logger<ILogObj>;
  readonly tariffsClientApi: TariffsClientApi;
  readonly tariffsService: TariffsService;

  constructor({ logger, tariffsClientApi, tariffsService }: TariffsBroadcasterDependencies) {
    super();
    this.logger = logger;
    this.tariffsClientApi = tariffsClientApi;
    this.tariffsService = tariffsService;
  }

  private async broadcast(
    tenant: TenantDto,
    method: HttpMethod,
    path: string,
    tariff?: Partial<Tariff>,
  ): Promise<void> {
    try {
      await this.tariffsClientApi.broadcastToClients({
        cpoCountryCode: tenant.countryCode!,
        cpoPartyId: tenant.partyId!,
        moduleId: ModuleId.Tariffs,
        interfaceRole: InterfaceRole.RECEIVER,
        httpMethod: method,
        schema: OcpiEmptyResponseSchema,
        body: tariff,
        path: path,
      });
    } catch (e) {
      this.logger.error(`broadcast${method} failed for Tariff ${path}`, e);
    }
  }

  async broadcastPutTariff(tenant: TenantDto, tariffDto: Partial<TariffDto>): Promise<void> {
    const tariff = await this.tariffsService.getTariffByKey({
      id: tariffDto.id!,
      countryCode: tenant.countryCode!,
      partyId: tenant.partyId!,
    });
    if (!tariff) {
      this.logger.error(
        `Failed to fetch Tariff ${tariffDto.id} data from GraphQL for broadcast PUT`,
      );
      return;
    }

    const path = `/${tenant.countryCode}/${tenant.partyId}/${tariff.id}`;
    await this.broadcast(tenant, HttpMethod.Put, path, tariff);
  }

  async broadcastTariffDeletion(tenant: TenantDto, tariffDto: TariffDto): Promise<void> {
    const path = `/${tenant.countryCode}/${tenant.partyId}/${tariffDto.id}`;
    await this.broadcast(tenant, HttpMethod.Delete, path);
  }
}
