// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IMessageContext, OcppRequest, OcppResponse } from '../..';
import { CallAction, OCPPVersionType } from '../../ocpp/rpc/message';
import { EventGroup, MessageOrigin, MessageState } from '.';

/**
 * Message
 *
 * The base interface for all messages traversing the system.
 *
 */
export interface IMessage<T extends OcppRequest | OcppResponse> {
  /**
   * The event group of the source module
   */
  get origin(): MessageOrigin;
  set origin(value: MessageOrigin);

  /**
   * The event group of the target module
   */
  get eventGroup(): EventGroup;
  set eventGroup(value: EventGroup);

  /**
   * The event type (within the event group)
   */
  get action(): CallAction;
  set action(value: CallAction);

  /**
   * The message state representative of the roundtrip status
   */
  get state(): MessageState;
  set state(value: MessageState);

  /**
   * The context of the message (the module that sent the message)
   */
  get context(): IMessageContext;
  set context(value: IMessageContext);

  /**
   * The payload of the message (the data sent with the message)
   */
  get payload(): T;
  set payload(value: T);

  /**
   * The protocol of the message (ocpp1.6, ocpp2.0.1, etc)
   */
  get protocol(): OCPPVersionType;
  set protocol(value: OCPPVersionType);
}

/**
 * Default implementation of IMessage
 */
export class Message<T extends OcppRequest | OcppResponse> implements IMessage<T> {
  /**
   * Fields
   */
  protected _origin: MessageOrigin;
  protected _eventGroup: EventGroup;
  protected _action: CallAction;
  protected _state: MessageState;
  protected _context: IMessageContext;
  protected _payload: T;
  protected _protocol: OCPPVersionType;

  /**
   * Constructs a new instance of Message.
   *
   * @param {MessageOrigin} origin - The origin of the message.
   * @param {EventGroup} eventGroup - The event group of the message.
   * @param {CallAction} action - The action of the message.
   * @param {MessageState} state - The state of the message.
   * @param {IMessageContext} context - The context of the message.
   * @param {T} payload - The payload of the message.
   * @param {OCPPVersionType} [protocol] - The protocol of the message, example "ocpp1.6".
   */
  constructor(
    origin: MessageOrigin,
    eventGroup: EventGroup,
    action: CallAction,
    state: MessageState,
    context: IMessageContext,
    payload: T,
    protocol: OCPPVersionType,
  ) {
    this._origin = origin;
    this._eventGroup = eventGroup;
    this._action = action;
    this._state = state;
    this._context = context;
    this._payload = payload;
    this._protocol = protocol;
  }

  /**
   * Getter & Setter
   */
  get origin(): MessageOrigin {
    return this._origin;
  }
  get eventGroup(): EventGroup {
    return this._eventGroup;
  }
  get action(): CallAction {
    return this._action;
  }
  get state(): MessageState {
    return this._state;
  }
  get context(): IMessageContext {
    return this._context;
  }
  get payload(): T {
    return this._payload;
  }
  get protocol(): OCPPVersionType {
    return this._protocol;
  }
  set origin(value: MessageOrigin) {
    this._origin = value;
  }
  set eventGroup(value: EventGroup) {
    this._eventGroup = value;
  }
  set action(value: CallAction) {
    this._action = value;
  }
  set state(value: MessageState) {
    this._state = value;
  }
  set context(value: IMessageContext) {
    this._context = value;
  }
  set payload(value: T) {
    this._payload = value;
  }
  set protocol(value: OCPPVersionType) {
    this._protocol = value;
  }
}
