// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractMessageSender,
  CallAction,
  IMessage,
  IMessageConfirmation,
  IMessageSender,
  MessageState,
  OcppError,
  OcppRequest,
  OcppResponse,
  SystemConfig,
} from '@citrineos/base';
import { PubSub } from '@google-cloud/pubsub';
import { ILogObj, Logger } from 'tslog';

/**
 * Implementation of a {@link IMessageSender} using Google PubSub as the underlying transport.
 */
export class PubSubSender extends AbstractMessageSender implements IMessageSender {

  /**
   * Fields
   */
  protected _client: PubSub;

  /**
   * Constructor
   *
   * @param topicPrefix Custom topic prefix, defaults to "ocpp"
   */
  constructor(config: SystemConfig, logger?: Logger<ILogObj>) {
    super(config, logger);

    this._client = new PubSub({ servicePath: this._config.util.messageBroker.pubsub?.servicePath });
  }

  /**
   * Convenience method to send a request message.
   *
   * @param message The {@link IMessage} to send
   * @param payload The payload to send
   * @returns
   */
  sendRequest(message: IMessage<OcppRequest>, payload?: OcppRequest): Promise<IMessageConfirmation> {
    return this.send(message, payload, MessageState.Request);
  }

  /**
   * Convenience method to send a confirmation message.
   * @param message The {@link IMessage} to send
   * @param payload The payload to send
   * @returns
   */
  sendResponse(message: IMessage<OcppResponse | OcppError>, payload?: OcppResponse | OcppError): Promise<IMessageConfirmation> {
    return this.send(message, payload, MessageState.Response);
  }

  /**
   * Publishes the given message to Google PubSub.
   *
   * @param message The {@link IMessage} to publish
   * @param payload The payload to within the {@link IMessage}
   * @param state The {@link MessageState} of the {@link IMessage}
   * @returns
   */
  send(
    message: IMessage<OcppRequest | OcppResponse | OcppError>,
    payload?: OcppRequest | OcppResponse | OcppError,
    state?: MessageState
  ): Promise<IMessageConfirmation> {
    if (payload) {
      message.payload = payload;
    }

    if (state) {
      message.state = state;
    }

    if (!message.state) {
      throw new Error('Message state must be set');
    }

    if (!message.payload) {
      throw new Error('Message payload must be set');
    }

    const topicName = `${this._config.util.messageBroker.pubsub?.topicPrefix}-${this._config.util.messageBroker.pubsub?.topicName}`;
    // Convert into action index due to PubSub limits of 256 characters in filter string
    const actionIndex: number = Object.keys(CallAction).indexOf(message.action.toString());

    this._logger.debug(`Publishing to ${topicName}:`, message);
    return this._client
      .topic(topicName)
      .publishMessage({
        json: message,
        attributes: {
          origin: message.origin.toString(),
          eventGroup: message.eventGroup.toString(),
          action: actionIndex.toString(),
          state: message.state.toString(),
          ...message.context,
        },
      })
      .then((result) => ({ success: true, result }))
      .catch((error) => ({ success: false, error }));
  }

  /**
   * Interface implementation
   */
  shutdown(): void {
    // Nothing to do
  }
}
