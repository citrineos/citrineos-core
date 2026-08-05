// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type OCPPMessageDto } from '@citrineos/types';
import type { IOCPPMessageRepository } from '../../../interfaces/repositories.js';
import { OCPPMessage } from '../model/OCPPMessage.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';

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
  public async createOCPPMessage(tenantId: number, message: OCPPMessageDto): Promise<OCPPMessage> {
    return this.create(tenantId, OCPPMessage.build({ ...message }));
  }

  public async getRequestByCorrelationId(
    tenantId: number,
    correlationId: string,
  ): Promise<OCPPMessage | undefined> {
    return this.readOnlyOneByQuery(tenantId, {
      where: { tenantId, correlationId, requestMessageId: null },
    });
  }
}

export default SequelizeOCPPMessageRepository;
