// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OcpiConfig } from '../index.js';

/**
 *  Data Transfer Object (DTO) event types for operations.
 */
export enum DtoEventType {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * Object types corresponding to Data Transfer Objects (DTOs) in the system.
 */
export enum DtoEventObjectType {
  Location = 'Location',
  ChargingStation = 'ChargingStation',
  Evse = 'Evse',
  Connector = 'Connector',
  Transaction = 'Transaction',
  MeterValue = 'MeterValue',
  Tariff = 'Tariff',
}

/**
 * Event context for DTO operations
 */
export interface IDtoEventContext {
  eventType: DtoEventType;
  objectType: DtoEventObjectType;
}

/**
 * DTO event payload
 */
export interface IDtoPayload {}

/**
 * Dto event interface
 */
export interface IDtoEvent<T extends IDtoPayload> {
  /**
   * The event identifier
   */
  _eventId: string;

  /**
   * The context of the event
   */
  _context: IDtoEventContext;

  /**
   * The payload of the event
   */
  _payload: T;
}

/**
 * Dto event receiver interface
 */
export interface IDtoEventReceiver {
  init(): Promise<void>;

  /**
   * Subscribes to Dto mutation events based on mutation types and object types.
   *
   * @param eventId - The event identifier.
   * @param mutation - The Dto mutation type.
   * @param objectType - The Dto object type.
   * @param filter - Optional. An additional event context filter.
   * @returns A promise that resolves to a boolean value indicating whether the event was successful.
   */
  subscribe(
    eventType: DtoEventType,
    objectType: DtoEventObjectType,
    filter?: { [k: string]: string },
  ): Promise<boolean>;

  /**
   * Handles incoming Dto events.
   * @param event - The event to be handled.
   */
  handle(event: IDtoEvent<IDtoPayload>): void;

  /**
   * Shuts down the handler.
   */
  shutdown(): Promise<void>;

  get module(): IDtoModule | undefined;
  set module(value: IDtoModule | undefined);
}

/**
 * Base interface for Dto modules
 */
export interface IDtoModule {
  config: OcpiConfig;
  receiver: IDtoEventReceiver;

  /**
   * Handles incoming Dto events
   *
   * @returns A promise that resolves when the event is handled.
   */
  handle(event: IDtoEvent<IDtoPayload>): Promise<void>;

  /**
   * Initializes the module
   *
   * @returns A promise that resolves when the module is initialized.
   */
  init(): Promise<void>;

  /**
   * Shuts down the module
   *
   * @returns A promise that resolves when the module is shut down.
   */
  shutdown(): Promise<void>;

  /**
   * Initializes the handlers for the module.
   *
   * @returns A promise that resolves when the handlers are initialized.
   */
  initHandlers(): Promise<void>;
}

/**
 * Dto event sender interface
 */
export interface IDtoEventSender {
  init(): Promise<void>;

  /**
   * Sends a Dto event to the upstream service.
   *
   * @param event - The event object.
   * @param payload - The payload object.
   * @returns A promise that resolves to a boolean indicating whether the event was successfully sent.
   * @throws {Error} If the event cannot be sent.
   */
  sendEvent(event: IDtoEvent<IDtoPayload>): Promise<boolean>;

  /**
   * Shuts down the sender.
   */
  shutdown(): Promise<void>;
}
export interface IDtoEventSubscriber {
  /**
   * Initializes the Dto event subscriber.
   *
   * @returns A promise that resolves when the subscriber is initialized.
   */
  init(): Promise<void>;

  /**
   * Subscribes to a Dto event.
   *
   * @param eventId - The identifier of the event to subscribe to.
   * @param handleEvent - The function to handle the event when it occurs.
   * @param handleError - The function to handle errors that occur during subscription.
   * @param handleDisconnect - Optional. The function to handle disconnection events.
   * @returns A promise that resolves to a boolean indicating whether the subscription was successful.
   */
  subscribe<T extends IDtoPayload>(
    eventId: string,
    handleEvent: (event: { eventType: DtoEventType; payload: T }) => void,
    handleError: (error: any) => void,
    handleDisconnect?: () => void,
  ): Promise<boolean>;

  shutdown(): Promise<void>;
}

/**
 * Interface for the Dto router that subscribes to Dto websockets
 * and routes events to RabbitMQ for upstream processing
 */
export interface IDtoRouter {
  sender: IDtoEventSender;
  /**
   * The Dto client for producing events
   */
  subscriber: IDtoEventSubscriber;

  init(): Promise<void>;

  /**
   * Subscribes to Dto events
   */
  subscribe<T extends IDtoPayload>(
    eventId: string,
    eventType: DtoEventType,
    objectType: DtoEventObjectType,
  ): Promise<boolean>;

  /**
   * Shuts down the router
   */
  shutdown(): Promise<void>;
}

/**
 * Default implementations
 */

/**
 * Default implementation of IDtoEvent
 */
export class DtoEvent<T extends IDtoPayload> implements IDtoEvent<T> {
  /**
   * Fields
   */
  _eventId: string;
  _context: IDtoEventContext;
  _payload: T;

  /**
   * Constructs a new instance of DtoEvent.
   *
   * @param {DtoEventType} eventType - The type of the event.
   * @param {DtoObjectType} objectType - The object type of the event.
   * @param {IDtoEventContext} context - The context of the event.
   * @param {IDtoPayload} payload - The payload of the event.
   */
  constructor(
    eventId: string,
    context: IDtoEventContext,
    payload: T,
    eventType?: DtoEventType,
    objectType?: DtoEventObjectType,
  ) {
    this._eventId = eventId;
    this._context = context;
    this._payload = payload;
    this._context.eventType = eventType || context.eventType;
    this._context.objectType = objectType || context.objectType;
  }

  /**
   * Getter & Setter
   */
  get eventId(): string {
    return this._eventId;
  }
  get context(): IDtoEventContext {
    return this._context;
  }
  get payload(): T {
    return this._payload;
  }
}
