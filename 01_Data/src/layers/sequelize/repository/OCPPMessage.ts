// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MessageState, type BootstrapConfig, type OCPPMessageDto } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IOCPPMessageRepository } from '../../../interfaces/index.js';
import { OCPPMessage } from '../model/index.js';
import { SequelizeRepository } from './Base.js';

export class SequelizeOCPPMessageRepository
  extends SequelizeRepository<OCPPMessage>
  implements IOCPPMessageRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, OCPPMessage.MODEL_NAME, logger, sequelizeInstance);
  }

  public async createOCPPMessage(tenantId: number, message: OCPPMessageDto): Promise<OCPPMessage> {
    if (message.correlationId) {
      const correlatedMessages = await this.readAllByQuery(tenantId, {
        where: {
          tenantId,
          correlationId: message.correlationId,
          requestMessageId: null,
        },
      });
      if (correlatedMessages.length > 0) {
        if (correlatedMessages.length > 1) {
          this.logger.warn(
            `Multiple correlated messages found for correlationId ${message.correlationId} and tenantId ${tenantId}. This should not happen.`,
          );
        }
        const correlatedMessage: OCPPMessage | undefined = correlatedMessages.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        )[0]; // Get the oldest message

        // Update the action of the correlated message if it's missing and we have it in the incoming message, or vice versa
        if (correlatedMessage.action === undefined && message.action) {
          correlatedMessage.action = message.action;
          await correlatedMessage.save();
        } else if (message.action === undefined && correlatedMessage.action) {
          message.action = correlatedMessage.action;
        }

        if (message.state === MessageState.Request) {
          this.logger.debug(
            `Saving request message found for correlationId ${message.correlationId} and tenantId ${tenantId}, will update response`,
          );
          const createdMessage = await this.create(tenantId, OCPPMessage.build({ ...message }));
          correlatedMessage.requestMessageId = createdMessage.id;
          await correlatedMessage.save();
          return createdMessage;
        } else {
          this.logger.debug(
            `Saving response message found for correlationId ${message.correlationId} and tenantId ${tenantId} with action ${correlatedMessage.action}`,
          );
          message.requestMessageId = correlatedMessage.id;
          return this.create(tenantId, OCPPMessage.build({ ...message }));
        }
      } else {
        // No correlated message found, ideally because this is the request message arriving before the response
        this.logger.debug(
          `No correlated message found for correlationId ${message.correlationId} and tenantId ${tenantId} with action ${message.action}. Saving message as-is.`,
        );
        return this.create(tenantId, OCPPMessage.build({ ...message }));
      }
    } else {
      this.logger.warn(
        `No correlationId found for message with tenantId ${tenantId} and action ${message.action}. Saving message as-is without correlation.`,
      );
      return this.create(tenantId, OCPPMessage.build({ ...message }));
    }
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
