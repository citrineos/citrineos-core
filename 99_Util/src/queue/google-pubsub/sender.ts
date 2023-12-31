/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { PubSub } from "@google-cloud/pubsub";
import { AbstractMessageSender, CallAction, IMessage, IMessageConfirmation, IMessageSender, MessageState, OcppRequest, OcppResponse, SystemConfig } from "@citrineos/base";
import { ILogObj, Logger } from "tslog";

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

    this._client = new PubSub({ servicePath: this._config.util.pubsub?.servicePath });
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
  sendResponse(message: IMessage<OcppResponse>, payload?: OcppResponse): Promise<IMessageConfirmation> {
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
    message: IMessage<OcppRequest | OcppResponse>,
    payload?: OcppRequest | OcppResponse,
    state?: MessageState
  ): Promise<IMessageConfirmation> {
    if (payload) {
      message.payload = payload;
    }

    if (state) {
      message.state = state;
    }

    if (!message.state) {
      throw new Error("Message state must be set");
    }

    if (!message.payload) {
      throw new Error("Message payload must be set");
    }

    const topicName = `${this._config.util.pubsub?.topicPrefix}-${this._config.util.pubsub?.topicName}`;
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
