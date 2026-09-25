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
import { childLogger } from '@citrineos/base';
import type { ILogObj, Logger } from 'tslog';
import {
  initMessagesProcessorMetrics,
  recordMessagesProcessorDuration,
  recordMessagesProcessorFailure,
} from './messages-metrics.js';

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
    this._logger = childLogger(logger, this.constructor.name);
    initMessagesProcessorMetrics([...frameEventProcessors, ...connectionEventProcessors]);
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
      const startedAt = performance.now();
      try {
        await processor.process(event, context);
      } catch (error) {
        recordMessagesProcessorFailure(processor.name, processor.critical);
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
      } finally {
        recordMessagesProcessorDuration((performance.now() - startedAt) / 1000, processor.name);
      }
    }
  }
}
