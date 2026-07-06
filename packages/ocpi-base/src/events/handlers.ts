// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type {
  IDtoEvent,
  IDtoEventReceiver,
  IDtoEventSender,
  IDtoModule,
  IDtoPayload,
} from './types.js';
import { DtoEventObjectType, DtoEventType } from './types.js';
import type { OcpiConfig } from '../config/ocpi.types.js';

/**
 * Abstract class implementing {@link IDtoEventReceiver}.
 */
export abstract class AbstractDtoEventReceiver implements IDtoEventReceiver {
  /**
   * Fields
   */
  protected _config: OcpiConfig;
  protected _module?: IDtoModule;
  protected _logger: Logger<ILogObj>;

  /**
   * Constructor
   *
   * @param config The system configuration.
   * @param logger [Optional] The logger to use.
   * @param module [Optional] The module instance.
   */
  constructor(config: OcpiConfig, logger?: Logger<ILogObj>, module?: IDtoModule) {
    this._config = config;
    this._module = module;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Getter & Setter
   */
  get module(): IDtoModule | undefined {
    return this._module;
  }
  set module(value: IDtoModule | undefined) {
    this._module = value;
  }

  /**
   * Methods
   */
  async handle(event: IDtoEvent<IDtoPayload>): Promise<void> {
    await this._module?.handle(event);
  }

  /**
   * Abstract Methods
   */
  abstract init(): Promise<void>;

  abstract subscribe(
    mutation: DtoEventType,
    objectType: DtoEventObjectType,
    filter?: { [k: string]: string },
  ): Promise<boolean>;

  abstract shutdown(): Promise<void>;
}

/**
 * Abstract class implementing {@link IDtoEventSender}.
 */
export abstract class AbstractDtoEventSender implements IDtoEventSender {
  /**
   * Fields
   */
  protected _config: OcpiConfig;
  protected _logger: Logger<ILogObj>;

  /**
   * Constructor
   *
   * @param config The system configuration.
   * @param logger [Optional] The logger to use.
   */
  constructor(config: OcpiConfig, logger?: Logger<ILogObj>) {
    this._config = config;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Abstract Methods
   */
  abstract init(): Promise<void>;

  abstract sendEvent(event: IDtoEvent<IDtoPayload>): Promise<boolean>;

  abstract shutdown(): Promise<void>;
}
