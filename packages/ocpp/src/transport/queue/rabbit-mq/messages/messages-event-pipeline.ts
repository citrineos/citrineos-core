// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type IConnectionEventProcessor,
  type IFrameEventProcessor,
  type IMessagesEventProcessor,
  isFrameEvent,
  type MessagesEvent,
  type MessagesEventContext,
} from '@citrineos/types';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class MessagesEventPipeline {
  private readonly _frameProcessors: IFrameEventProcessor[];
  private readonly _connectionProcessors: IConnectionEventProcessor[];
  private readonly _logger: Logger<ILogObj>;

  constructor({
    frameEventProcessors,
    connectionEventProcessors,
    logger,
  }: {
    frameEventProcessors: IFrameEventProcessor[];
    connectionEventProcessors: IConnectionEventProcessor[];
    logger?: Logger<ILogObj>;
  }) {
    this._frameProcessors = frameEventProcessors;
    this._connectionProcessors = connectionEventProcessors;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /** For startup logging: which processors serve which kind. */
  get processorNames(): { frame: string[]; connection: string[] } {
    return {
      frame: this._frameProcessors.map((p) => p.name),
      connection: this._connectionProcessors.map((p) => p.name),
    };
  }

  /**
   * @throws when a processor marked `critical` fails. The transport turns that into a retry and
   * then a dead-letter.
   */
  async run(event: MessagesEvent): Promise<MessagesEventContext> {
    const context: MessagesEventContext = {};

    if (isFrameEvent(event)) {
      await this._runAll(this._frameProcessors, event, context);
    } else {
      await this._runAll(this._connectionProcessors, event, context);
    }

    return context;
  }

  private async _runAll<TEvent extends MessagesEvent>(
    processors: IMessagesEventProcessor<TEvent>[],
    event: TEvent,
    context: MessagesEventContext,
  ): Promise<void> {
    for (const processor of processors) {
      try {
        await processor.process(event, context);
      } catch (error) {
        if (processor.critical) {
          this._logger.error(
            `Critical processor ${processor.name} failed for ${event.ocppConnectionName}:`,
            error,
          );
          throw error;
        }
        this._logger.error(
          `Processor ${processor.name} failed for ${event.ocppConnectionName} (continuing):`,
          error,
        );
      }
    }
  }
}
