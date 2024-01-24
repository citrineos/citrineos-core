// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AbstractMessageSender, IMessageSender, SystemConfig, IMessage, OcppRequest, IMessageConfirmation, MessageState, OcppResponse, OcppError } from "@citrineos/base";
import * as amqplib from "amqplib";
import { instanceToPlain } from "class-transformer";
import { ILogObj, Logger } from "tslog";

/**
 * Implementation of a {@link IMessageSender} using RabbitMQ as the underlying transport.
 */
export class RabbitMqSender extends AbstractMessageSender implements IMessageSender {

  /**
   * Constants
   */
  private static readonly QUEUE_PREFIX = "amqp_queue_";

  /**
   * Fields
   */
  protected _connection?: amqplib.Connection;
  protected _channel?: amqplib.Channel;

  /**
   * Constructor for the class.
   *
   * @param {SystemConfig} config - The system configuration.
   * @param {Logger<ILogObj>} [logger] - The logger object.
   */
  constructor(config: SystemConfig, logger?: Logger<ILogObj>) {
    super(config, logger);

    this._connect().then(channel => {
      this._channel = channel;
    });
  }

  /**
   * Methods
   */

  /**
   * Sends a request message with an optional payload and returns a promise that resolves to the confirmation message.
   *
   * @param {IMessage<OcppRequest>} message - The message to be sent.
   * @param {OcppRequest | undefined} payload - The optional payload to be sent with the message.
   * @return {Promise<IMessageConfirmation>} A promise that resolves to the confirmation message.
   */
  sendRequest(message: IMessage<OcppRequest>, payload?: OcppRequest | undefined): Promise<IMessageConfirmation> {
    return this.send(message, payload, MessageState.Request);
  }

  /**
   * Sends a response message and returns a promise of the message confirmation.
   *
   * @param {IMessage<OcppResponse | OcppError>} message - The message to send.
   * @param {OcppResponse | OcppError} payload - The payload to include in the response.
   * @return {Promise<IMessageConfirmation>} - A promise that resolves to the message confirmation.
   */
  sendResponse(message: IMessage<OcppResponse | OcppError>, payload?: OcppResponse | OcppError): Promise<IMessageConfirmation> {
    return this.send(message, payload, MessageState.Response);
  }

  /**
   * Sends a message and returns a promise that resolves to a message confirmation.
   *
   * @param {IMessage<OcppRequest | OcppResponse | OcppError>} message - The message to be sent.
   * @param {OcppRequest | OcppResponse | OcppError} [payload] - The payload to be included in the message.
   * @param {MessageState} [state] - The state of the message.
   * @return {Promise<IMessageConfirmation>} - A promise that resolves to a message confirmation.
   */
  async send(message: IMessage<OcppRequest | OcppResponse | OcppError>, payload?: OcppRequest | OcppResponse | OcppError, state?: MessageState): Promise<IMessageConfirmation> {
    if (payload) {
      message.payload = payload;
    }

    if (state) {
      message.state = state;
    }

    if (!message.state) {
      return { success: false, payload: "Message state must be set" };
    }

    if (!message.payload) {
      return { success: false, payload: "Message payload must be set" };
    }

    const exchange = this._config.util.messageBroker.amqp?.exchange as string;
    const channel = this._channel || await this._connect();
    this._channel = channel;

    this._logger.debug(`Publishing to ${exchange}:`, message);

    const success = channel.publish(exchange || "", "", Buffer.from(JSON.stringify(instanceToPlain(message)), "utf-8"), {
      contentEncoding: "utf-8",
      contentType: "application/json",
      headers: {
        origin: message.origin.toString(),
        eventGroup: message.eventGroup.toString(),
        action: message.action.toString(),
        state: message.state.toString(),
        ...message.context,
      }
    });
    return { success };
  }

  /**
   * Shuts down the sender by closing the client.
   *
   * @return {Promise<void>} A promise that resolves when the client is closed.
   */
  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Protected Methods
   */

  /**
   * Connect to RabbitMQ
   */
  protected _connect(): Promise<amqplib.Channel> {
    return amqplib.connect(this._config.util.messageBroker.amqp?.url || "").then(async connection => {
      this._connection = connection;
      return connection.createChannel();
    }).then(channel => {
      // Add listener for channel errors
      channel.on("error", (err) => {
        this._logger.error("AMQP channel error", err);
        // TODO: add recovery logic
      });
      return channel;
    });
  }
}