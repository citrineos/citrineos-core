// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { WebsocketEventCreate } from '@citrineos/types';
import type { IWebsocketEventRepository } from '../repositories.js';
import { WebsocketEvent } from '../../models/websocket-event.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { resolveStationId } from './resolve-station-id.js';

export class SequelizeWebsocketEventRepository
  extends SequelizeRepository<WebsocketEvent>
  implements IWebsocketEventRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: WebsocketEvent.MODEL_NAME, logger, sequelizeInstance });
  }

  async createWebsocketEvent(
    tenantId: number,
    ocppConnectionName: string | undefined,
    event: Omit<WebsocketEventCreate, 'stationId' | 'tenantId'>,
  ): Promise<WebsocketEvent> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    return this.create(
      tenantId,
      WebsocketEvent.build({ ...event, stationId: stationId ?? null, tenantId }),
    );
  }
}
