// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig } from '@config/bootstrap.config.js';
import type { SystemConfig } from '@config/types.js';
import type { ICache } from '@interfaces/cache/cache.js';
import type {
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageSender,
} from '@interfaces/messages/index.js';
import type { HandlerProperties } from '@interfaces/messages/internal-types.js';
import { EventGroup, MessageOrigin, MessageState } from '@interfaces/messages/internal-types.js';
import { AS_HANDLER_METADATA } from '@interfaces/modules/AsHandler.js';
import type { IHandlerDefinition } from '@interfaces/modules/HandlerDefinition.js';
import type { IModule } from '@interfaces/modules/Module.js';
import type { OcppRequest, OcppResponse } from '@ocpp/internal-types.js';
import type { CallAction, OCPPVersionType } from '@ocpp/rpc/message.js';
import { ErrorCode, OcppError, OCPPVersion } from '@ocpp/rpc/message.js';
import 'reflect-metadata';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { OCPPValidator } from './OCPPValidator.js';
import { AS_HANDLER_CLASS_METADATA } from '@interfaces/handlers/AsHandlerClass.js';
import type { IHandlerClassDefinition } from '@interfaces/handlers/HandlerClassDefinition.js';
import type { AbstractHandler } from '@interfaces/handlers/AbstractHandler.js';
import type { IOcppSender } from '@interfaces/handlers/IOcppSender.js';

/** Two handler classes claiming one action and direction within the same module. */
interface IHandlerConflict {
  action: CallAction;
  type: MessageState;
  claimedBy: string;
  alsoClaimedBy: string;
}

/** Renders one indented line per conflict for the wire-up error. */
function describeConflicts(conflicts: Iterable<IHandlerConflict>): string[] {
  return [...conflicts].map(
    ({ action, type, claimedBy, alsoClaimedBy }) =>
      `  ${action} (${MessageState[type]}) — ${claimedBy} and ${alsoClaimedBy}`,
  );
}

/**
 * The dependencies every OCPP module receives through the container. Each concrete
 * module extends this with its own repositories and internal services.
 */
export interface OcppModuleDependencies {
  config: BootstrapConfig & SystemConfig;
  cache: ICache;
  sender: IMessageSender;
  handler: IMessageHandler;
  logger: Logger<ILogObj>;
  ocppValidator: OCPPValidator;
  ocppSender: IOcppSender;
}

export abstract class AbstractModule implements IModule {
  public static readonly CALLBACK_URL_CACHE_PREFIX: string = 'CALLBACK_URL_';

  protected _config: SystemConfig;
  protected _ocppValidator: OCPPValidator;
  protected readonly _cache: ICache;
  protected readonly _handler: IMessageHandler;
  protected readonly _sender: IMessageSender;
  protected readonly _eventGroup: EventGroup;
  protected readonly _logger: Logger<ILogObj>;
  protected readonly _ocppSender: IOcppSender;

  protected _requests: CallAction[] = [];
  protected _responses: CallAction[] = [];
  private startTime = Date.now();

  private readonly _handlerInstancesByKey = new Map<string, AbstractHandler>();
  private readonly _declaredRequests = new Set<CallAction>();
  private readonly _declaredResponses = new Set<CallAction>();

  constructor(
    config: SystemConfig,
    cache: ICache,
    handler: IMessageHandler,
    sender: IMessageSender,
    eventGroup: EventGroup,
    ocppSender: IOcppSender,
    logger?: Logger<ILogObj>,
    ocppValidator?: OCPPValidator,
    handlers: AbstractHandler[] = [],
  ) {
    this._logger = this._initLogger(logger);
    this._ocppValidator = ocppValidator ? ocppValidator : new OCPPValidator(logger);
    this._logger.info('Initializing...');
    this._config = config;
    this._handler = handler;
    this._sender = sender;
    this._eventGroup = eventGroup;
    this._cache = cache;
    this._ocppSender = ocppSender;

    // Set module for proper message flow.
    this.handler.module = this;

    const conflicts = new Map<string, IHandlerConflict>();

    for (const instance of handlers) {
      const definitions = (Reflect.getMetadata(AS_HANDLER_CLASS_METADATA, instance.constructor) ??
        []) as IHandlerClassDefinition[];
      for (const definition of definitions) {
        const key = AbstractModule._handlerKey(
          definition.protocol,
          definition.action,
          definition.type,
        );
        const claimed = this._handlerInstancesByKey.get(key);
        if (claimed && claimed !== instance) {
          conflicts.set(`${definition.action}:${definition.type}`, {
            action: definition.action,
            type: definition.type,
            claimedBy: claimed.constructor.name,
            alsoClaimedBy: instance.constructor.name,
          });
          continue;
        }
        this._handlerInstancesByKey.set(key, instance);
        this._declaredActions(definition.type).add(definition.action);
      }
    }

    const excluded = this._excludedActions();
    this._requests = [...this._declaredRequests].filter(
      (action) => !excluded.requests?.includes(action),
    );
    this._responses = [...this._declaredResponses].filter(
      (action) => !excluded.responses?.includes(action),
    );

    if (conflicts.size > 0) {
      throw new Error(
        [
          `Module '${eventGroup}' cannot start: two handlers are registered for the same message.`,
          ``,
          ...describeConflicts(conflicts.values()),
          ``,
          `Dispatch can only route a message to one handler, so the other would never run. ` +
            `Remove one from this module's handler list.`,
        ].join('\n'),
      );
    }
  }

  /**
   * Builds the lookup key used by {@link _handlerInstancesByKey}, keyed on protocol, action,
   * and request/response type so a module can't accidentally dispatch a response to a
   * handler registered for the request side of the same action (or vice versa).
   */
  private static _handlerKey(
    protocol: OCPPVersion,
    action: CallAction,
    type: MessageState,
  ): string {
    return `${protocol}:${action}:${type}`;
  }

  /**
   * The actions this module's handlers declare for one direction. Protocol agnostic
   */
  private _declaredActions(type: MessageState): Set<CallAction> {
    return type === MessageState.Request ? this._declaredRequests : this._declaredResponses;
  }

  /**
   * The actions this module's config asks it not to subscribe to
   */
  private _excludedActions(): { requests?: CallAction[]; responses?: CallAction[] } {
    const modules: Partial<
      Record<EventGroup, { excludedRequests?: CallAction[]; excludedResponses?: CallAction[] }>
    > = this._config.modules;
    const moduleConfig = modules[this._eventGroup];
    return {
      requests: moduleConfig?.excludedRequests,
      responses: moduleConfig?.excludedResponses,
    };
  }

  /**
   * Getters & Setters
   */

  get ocppValidator(): OCPPValidator {
    return this._ocppValidator;
  }

  get cache(): ICache {
    return this._cache;
  }

  get sender(): IMessageSender {
    return this._sender;
  }

  get handler(): IMessageHandler {
    return this._handler;
  }

  get config(): SystemConfig {
    return this._config;
  }

  /**
   * Sets the system configuration for the module.
   *
   * @param {SystemConfig} config - The new configuration to set.
   */
  set config(config: SystemConfig) {
    this._config = config;
    // Update all necessary settings for hot reload
    this._logger.info(`Updating system configuration for ${this._eventGroup} module...`);
    this._logger.settings.minLevel = this._config.logLevel;
  }

  /**
   * Interface methods.
   */

  /**
   * Handles a message with an OcppRequest or OcppResponse payload.
   *
   * @param {IMessage<OcppRequest | OcppResponse>} message - The message to handle.
   * @param {HandlerProperties} props - Optional properties for the handler.
   * @return {void} This function does not return anything.
   */
  async handle(
    message: IMessage<OcppRequest | OcppResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    message.payload = this._ocppValidator.sanitizeOCPPPayload(message.payload);
    switch (message.state) {
      case MessageState.Request: {
        const { isValid, errors } = this._ocppValidator.validateOCPPRequest(
          message.action,
          message.payload,
          message.protocol as OCPPVersion,
        );

        if (!isValid || errors) {
          throw new OcppError(
            message.context.correlationId,
            ErrorCode.FormatViolation,
            'Invalid message format',
            {
              errors: errors,
            },
          );
        }
        break;
      }
      case MessageState.Response: {
        const { isValid, errors } = this._ocppValidator.validateOCPPResponse(
          message.action,
          message.payload,
          message.protocol as OCPPVersion,
        );

        if (!isValid || errors) {
          throw new OcppError(
            message.context.correlationId,
            ErrorCode.FormatViolation,
            'Invalid message format',
            {
              errors: errors,
            },
          );
        }

        await this._cache.set(
          message.context.correlationId,
          JSON.stringify(message.payload),
          message.context.ocppConnectionName,
          this._config.maxCachingSeconds,
        );

        break;
      }
      default:
        this._logger.error('Unknown message state', message);
        throw new Error('Unknown message state: ' + message.state);
    }
    try {
      // TODO ONLY do the class definition if we're committed to replacing everything in one go
      const handlerDefinition = (
        (Reflect.getMetadata(AS_HANDLER_METADATA, this.constructor) as
          | Array<IHandlerDefinition>
          | undefined) ?? []
      )
        .filter((h) => h.protocol === message.protocol && h.action === message.action)
        .pop();
      if (handlerDefinition) {
        await handlerDefinition.method.call(this, message, props);
      } else {
        const handlerInstance = this._handlerInstancesByKey.get(
          AbstractModule._handlerKey(
            message.protocol as OCPPVersion,
            message.action,
            message.state,
          ),
        );

        if (handlerInstance) {
          await handlerInstance.handle(message, props);
        } else {
          throw new OcppError(
            message.context.correlationId,
            ErrorCode.NotSupported,
            'No handler found for action: ' + message.action + ' at module ' + this._eventGroup,
          );
        }
      }
    } catch (error) {
      this._logger.error('Failed handling message: ', error, message);
      if (message.state === MessageState.Request) {
        // CallErrors are only emitted for Calls
        this._logger.error('Sending CallError to ChargingStation...');
        message.origin = MessageOrigin.ChargingStationManagementSystem;
        if (error instanceof OcppError) {
          await this._sender.sendResponse(message, error);
        } else if (error instanceof Error) {
          await this._sender.sendResponse(
            message,
            new OcppError(
              message.context.correlationId,
              ErrorCode.InternalError,
              'Failed handling message: ' + error.message,
            ),
          );
        } else {
          this._logger.warn("Unknown error type, couldn't send CallError");
        }
      }
    }
  }

  /**
   * Calls shutdown on the handler and sender.
   *
   * Note: To be overwritten by subclass if other logic is necessary.
   * TODO shutdown necessary for AbstractHandlers?
   */
  async shutdown(): Promise<void> {
    await this._handler.shutdown();
    await this._sender.shutdown();
  }

  /**
   * Sends a call with the specified identifier, tenantId, protocol, action, payload, and origin.
   *
   * @param ocppConnectionName - The connection name of the charging station
   * @param {number} tenantId - The identifier of the tenant.
   * @param {string} protocol - The subprotocol of the Websocket, i.e. "ocpp1.6" or "ocpp2.0.1".
   * @param {CallAction} action - The action to be performed.
   * @param {OcppRequest} payload - The payload of the call.
   * @param {string} [callbackUrl] - The callback URL for the call.
   * @param {string} [correlationId] - The correlation ID of the call.
   * @param {MessageOrigin} [origin] - The origin of the call.
   * @return {Promise<IMessageConfirmation>} A promise that resolves to the message confirmation.
   */
  public sendCall(
    ocppConnectionName: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppRequest,
    callbackUrl?: string,
    correlationId?: string,
    origin: MessageOrigin = MessageOrigin.ChargingStationManagementSystem,
  ): Promise<IMessageConfirmation> {
    return this._ocppSender.sendCall({
      ocppConnectionName,
      tenantId,
      protocol,
      action,
      eventGroup: this._eventGroup,
      payload,
      callbackUrl,
      correlationId,
      origin,
    });
  }

  /**
   * Sends the call result message and returns a Promise that resolves with the confirmation message.
   *
   * @param {string} correlationId - The correlation ID of the message.
   * @param ocppConnectionName - The connection name of the charging station
   * @param {number} tenantId - The identifier of the tenant.
   * @param {string} protocol - The subprotocol of the Websocket, i.e. "ocpp1.6" or "ocpp2.0.1".
   * @param {CallAction} action - The call action.
   * @param {OcppResponse} payload - The payload of the call result message.
   * @param {MessageOrigin} origin - (optional) The origin of the message.
   * @return {Promise<IMessageConfirmation>} A Promise that resolves with the confirmation message.
   */
  public sendCallResult(
    correlationId: string,
    ocppConnectionName: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppResponse,
    origin: MessageOrigin = MessageOrigin.ChargingStationManagementSystem,
  ): Promise<IMessageConfirmation> {
    return this._ocppSender.sendCallResult({
      correlationId,
      ocppConnectionName,
      tenantId,
      protocol,
      action,
      eventGroup: this._eventGroup,
      payload,
      origin,
    });
  }

  /**
   * Sends the call result using the request message's fields.
   * Payload will overwrite message.payload.
   *
   * @param {IMessage<OcppRequest>} message - The request message object.
   * @param {OcppResponse} payload - The payload to send.
   * @return {Promise<IMessageConfirmation>} A promise that resolves to the message confirmation.
   */
  public sendCallResultWithMessage(
    message: IMessage<OcppRequest>,
    payload: OcppResponse,
  ): Promise<IMessageConfirmation> {
    return this._ocppSender.sendCallResultWithMessage(message, payload);
  }

  /**
   * Sends the call error message and returns a Promise that resolves with the confirmation message.
   *
   * @param {string} correlationId - The correlation ID of the message.
   * @param ocppConnectionName - The connection name of the charging station
   * @param {number} tenantId - The identifier of the tenant.
   * @param {string} protocol - The subprotocol of the Websocket, i.e. "ocpp1.6" or "ocpp2.0.1".
   * @param {CallAction} action - The call action.
   * @param {OcppError} payload - The payload of the call error message.
   * @param {MessageOrigin} origin - (optional) The origin of the message.
   * @return {Promise<IMessageConfirmation>} A Promise that resolves with the confirmation message.
   */
  public sendCallError(
    correlationId: string,
    ocppConnectionName: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppError,
    origin: MessageOrigin = MessageOrigin.ChargingStationManagementSystem,
  ): Promise<IMessageConfirmation> {
    return this._ocppSender.sendCallError({
      correlationId,
      ocppConnectionName,
      tenantId,
      protocol,
      action,
      eventGroup: this._eventGroup,
      payload,
      origin,
    });
  }

  /**
   * Sends the call error using the request message's fields.
   * Payload will overwrite message.payload.
   *
   * @param {IMessage<OcppRequest>} message - The request message object.
   * @param {OcppResponse} payload - The payload to send.
   * @return {Promise<IMessageConfirmation>} A promise that resolves to the message confirmation.
   */
  public sendCallErrorWithMessage(
    message: IMessage<OcppRequest>,
    payload: OcppError,
  ): Promise<IMessageConfirmation> {
    return this._ocppSender.sendCallErrorWithMessage(message, payload);
  }

  /**
   * Initializes the logger for the class.
   *
   * @return {Logger<ILogObj>} The initialized logger.
   */
  protected _initLogger(baseLogger?: Logger<ILogObj>): Logger<ILogObj> {
    return baseLogger
      ? baseLogger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({
          name: this.constructor.name,
          minLevel: this._config.logLevel,
          hideLogPositionForProduction: this._config.env === 'production',
        });
  }

  /**
   * Initializes the handler for handling requests and responses.
   */
  public async initHandlers(): Promise<void> {
    this._assertConfiguredActionsAreHandled();
    const result = await this._initHandler(this._requests, this._responses);
    if (!result) {
      throw new Error('Could not initialize module due to failure in handler initialization.');
    }
    this._logger.info(`Initialized in ${Date.now() - this.startTime}ms...`);
  }

  /**
   * Refuses to subscribe a module to an action it has no handler for
   */
  private _assertConfiguredActionsAreHandled(): void {
    const legacyActions = this._legacyMethodActions();

    const shadowed = [...legacyActions].filter(
      (action) => this._declaredRequests.has(action) || this._declaredResponses.has(action),
    );
    if (shadowed.length > 0) {
      this._logger.warn(
        `${this._eventGroup} has both an @AsHandler method and a handler class for ` +
          `${shadowed.join(', ')}. The method wins at dispatch, so the handler class will not ` +
          `run. Delete the method.`,
      );
    }

    const unhandled = [
      ...this._requests.map((action) => ({ action, type: MessageState.Request })),
      ...this._responses.map((action) => ({ action, type: MessageState.Response })),
    ].filter(
      ({ action, type }) => !legacyActions.has(action) && !this._declaredActions(type).has(action),
    );

    if (unhandled.length === 0) {
      return;
    }

    const describe = (action: CallAction, type: MessageState) =>
      `${action} (${MessageState[type]})`;
    const registered = [
      ...[...this._declaredRequests].map((action) => describe(action, MessageState.Request)),
      ...[...this._declaredResponses].map((action) => describe(action, MessageState.Response)),
    ].sort();

    throw new Error(
      [
        `Module '${this._eventGroup}' cannot start: it is configured to receive messages it has ` +
          `no handler for.`,
        ``,
        `Unhandled: ${unhandled.map(({ action, type }) => describe(action, type)).join(', ')}`,
        `Registered: ${registered.length > 0 ? registered.join(', ') : '(none)'}`,
        ``,
        `Fix either side:`,
        `  - register a handler: add the class that declares @AsRequestHandler/@AsResponseHandler ` +
          `for each unhandled action to this module's handler list in its register.ts, and export ` +
          `it from handlers/index.ts`,
        `  - or narrow the config: remove those actions from ` +
          `config.modules.${this._eventGroup}.requests / .responses`,
        ``,
        `Until one of those is done, a charging station sending these messages would be answered ` +
          `with a NotSupported CallError.`,
      ].join('\n'),
    );
  }

  /**
   * TEMPORARY BRIDGE. Actions a module still serves through {@link AsHandler} methods rather than
   * handler classes, so coverage isn't demanded for them while the migration is in progress. Legacy
   * metadata records no request/response type, and dispatch resolves it the same way, so an action
   * is exempted in both directions.
   *
   * Delete this method, its single call site in {@link _assertConfiguredActionsAreHandled}, the
   * shadowing warning there, and AsHandler.ts once no module uses {@link AsHandler} — at which point
   * coverage becomes unconditional.
   */
  private _legacyMethodActions(): Set<CallAction> {
    return new Set(
      (
        (Reflect.getMetadata(AS_HANDLER_METADATA, this.constructor) as
          | Array<IHandlerDefinition>
          | undefined) ?? []
      ).map((definition) => definition.action),
    );
  }

  /**
   * Initializes the handler for handling requests and responses.
   *
   * @param {CallAction[]} requests - The array of call actions for requests.
   * @param {CallAction[]} responses - The array of call actions for responses.
   * @return {Promise<boolean>} Returns a promise that resolves to a boolean indicating if the initialization was successful.
   */
  private async _initHandler(requests: CallAction[], responses: CallAction[]): Promise<boolean> {
    this._handler.module = this;

    let success = await this._handler.subscribe(
      this._eventGroup.toString() + '_requests',
      requests,
      {
        origin: MessageOrigin.ChargingStation.toString(),
        state: MessageState.Request.toString(),
      },
    );

    success =
      success &&
      (await this._handler.subscribe(this._eventGroup.toString() + '_responses', responses, {
        origin: MessageOrigin.ChargingStation.toString(),
        state: MessageState.Response.toString(),
      }));

    return success;
  }
}
