// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ITenantRepository } from '@citrineos/dal';
import type { TenantDto } from '@citrineos/types';

/** Serves the tenant ids the sweeper reads; the network alert tests use nothing else. */
export class FakeTenantRepository implements ITenantRepository {
  tenantIds: number[] = [1];

  async readTenantIds(): Promise<number[]> {
    return this.tenantIds;
  }

  async createTenant(): Promise<TenantDto> {
    throw new Error('Not implemented');
  }

  async readByKey(): Promise<TenantDto | undefined> {
    throw new Error('Not implemented');
  }

  async readByWebsocketServerPath(): Promise<TenantDto | undefined> {
    throw new Error('Not implemented');
  }

  async readAllWithWebsocketServerPath(): Promise<TenantDto[]> {
    throw new Error('Not implemented');
  }

  async updateWebsocketServerPath(): Promise<TenantDto | undefined> {
    throw new Error('Not implemented');
  }
}
