// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type CallAction, type OCPPMessageDto } from '@citrineos/types';
import type { IOCPPMessageRepository } from '../repositories.js';
import { OCPPMessage } from '../../models/ocpp-message.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { resolveStationId, resolveStationIdOrThrow } from './resolve-station-id.js';

export class SequelizeOCPPMessageRepository
  extends SequelizeRepository<OCPPMessage>
  implements IOCPPMessageRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: OCPPMessage.MODEL_NAME, logger, sequelizeInstance });
  }

  /**
   * This method does not handle associating request/response messages.
   * A database trigger handles that automatically on insert--make sure the trigger is installed in the database.
   *
   * @param tenantId
   * @param message
   * @returns
   */
  public async createOCPPMessage(
    tenantId: number,
    ocppConnectionName: string,
    message: Omit<OCPPMessageDto, 'stationId'>,
  ): Promise<OCPPMessage> {
    const stationId = await resolveStationIdOrThrow(
      tenantId,
      ocppConnectionName,
      'persist an OCPP message',
    );
    return this.create(tenantId, OCPPMessage.build({ ...message, stationId }));
  }

  public async getRequestByCorrelationId(
    tenantId: number,
    correlationId: string,
  ): Promise<OCPPMessage | undefined> {
    return this.readOnlyOneByQuery(tenantId, {
      where: { tenantId, correlationId, requestMessageId: null },
    });
  }

  public async hasMessageWithPayloadRequestId(
    tenantId: number,
    ocppConnectionName: string,
    action: CallAction,
    requestId: number,
  ): Promise<boolean> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return false;
    }

    const matches = await this.readAllByQuery(tenantId, {
      where: { tenantId, stationId, action, payload: { requestId } },
      limit: 1,
    });
    return matches.length > 0;
  }
}

export default SequelizeOCPPMessageRepository;
