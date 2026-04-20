// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export abstract class AbstractMessageSender {
  /**
   * Fields
   */

  protected _logger: Logger<ILogObj>;

  /**
   * Constructor
   *
   * @param logger [Optional] The logger to use.
   */
  constructor(logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }
}
