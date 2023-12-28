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

import { AbstractMessageSender, IMessageSender, SystemConfig, IMessage, OcppRequest, IMessageConfirmation, MessageState, OcppResponse } from "@citrineos/base";
import { Admin, Kafka, Producer } from "kafkajs";
import { ILogObj, Logger } from "tslog";
/**
 * Implementation of a {@link IMessageSender} using Kafka as the underlying transport.
 */
export class KafkaSender extends AbstractMessageSender implements IMessageSender {

    /**
     * Fields
     */
    private _client: Kafka;
    private _topicName: string;
    private _producers: Array<Producer>;

    /**
     * Constructor
     *
     * @param topicPrefix Custom topic prefix, defaults to "ocpp"
     */
    constructor(config: SystemConfig, logger?: Logger<ILogObj>) {
        super(config, logger);

        this._client = new Kafka({
            brokers: config.util.messageBroker.kafka?.brokers || [],
            ssl: true,
            sasl: {
                mechanism: 'plain',
                username: config.util.messageBroker.kafka?.sasl.username || "",
                password: config.util.messageBroker.kafka?.sasl.password || ""
            }
        });
        this._producers = new Array<Producer>();
        this._topicName = `${this._config.util.messageBroker.kafka?.topicPrefix}-${this._config.util.messageBroker.kafka?.topicName}`;

        const admin: Admin = this._client.admin();
        admin.connect()
            .then(() => admin.listTopics())
            .then((topics) => {
                if (!topics || topics.filter(topic => topic === this._topicName).length === 0) {
                    this._client.admin().createTopics({ topics: [{ topic: this._topicName }] }).then(() => {
                        this._logger.debug(`Topic ${this._topicName} created.`);
                    });
                }
            })
            .then(() => admin.disconnect());
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

        this._logger.debug(`Publishing to ${this._topicName}:`, message);

        const producer = this._client.producer();
        return producer.connect()
            .then(() => producer.send({
                topic: this._topicName, messages: [
                    {
                        headers: {
                            origin: message.origin.toString(),
                            eventGroup: message.eventGroup.toString(),
                            action: message.action.toString(),
                            state: message.state.toString(),
                            ...message.context,
                        },
                        value: JSON.stringify(message)
                    },
                ]
            }))
            .then(() => this._producers.push(producer))
            .then((result) => ({ success: true, result }))
            .catch((error) => ({ success: false, error }));
    }

    /**
     * Interface implementation
     */
    shutdown(): void {
        this._producers.forEach((producer) => {
            producer.disconnect();
        });
    }
}
