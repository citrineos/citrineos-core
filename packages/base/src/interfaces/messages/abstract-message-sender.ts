// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj, Logger } from 'tslog';

import { childLogger } from '@base-util/logging.js';
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
    this._logger = childLogger(logger, this.constructor.name);
  }
}
