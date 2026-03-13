[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/queue/rabbit-mq/sender

# 02_Util/src/queue/rabbit-mq/sender

## Classes

### RabbitMqSender

Defined in: [02_Util/src/queue/rabbit-mq/sender.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/sender.ts#L22)

Implementation of a IMessageSender using RabbitMQ as the underlying transport.

#### Extends

- `AbstractMessageSender`

#### Implements

- `IMessageSender`

#### Constructors

##### Constructor

```ts
new RabbitMqSender(
   exchange,
   connectionManager,
   channelManager,
   logger?): RabbitMqSender;
```

Defined in: [02_Util/src/queue/rabbit-mq/sender.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/sender.ts#L39)

Constructor for the class.

###### Parameters

| Parameter           | Type                                                                          | Description        |
| ------------------- | ----------------------------------------------------------------------------- | ------------------ |
| `exchange`          | `string`                                                                      | -                  |
| `connectionManager` | [`RabbitMQConnectionManager`](ConnectionManager.md#rabbitmqconnectionmanager) | -                  |
| `channelManager`    | [`RabbitMQChannelManager`](ChannelManager.md#rabbitmqchannelmanager)          | -                  |
| `logger?`           | `Logger`\<`ILogObj`\>                                                         | The logger object. |

###### Returns

[`RabbitMqSender`](#rabbitmqsender)

###### Overrides

```ts
AbstractMessageSender.constructor;
```

#### Properties

| Property                                             | Modifier    | Type                                                                          | Default value | Description | Inherited from                  | Defined in                                                                                                                                                                      |
| ---------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- | ------------- | ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_channelmanager"></a> `_channelManager`       | `protected` | [`RabbitMQChannelManager`](ChannelManager.md#rabbitmqchannelmanager)          | `undefined`   | -           | -                               | [02_Util/src/queue/rabbit-mq/sender.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/sender.ts#L32) |
| <a id="_connectionmanager"></a> `_connectionManager` | `protected` | [`RabbitMQConnectionManager`](ConnectionManager.md#rabbitmqconnectionmanager) | `undefined`   | Fields      | -                               | [02_Util/src/queue/rabbit-mq/sender.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/sender.ts#L31) |
| <a id="_logger"></a> `_logger`                       | `protected` | `Logger`\<`ILogObj`\>                                                         | `undefined`   | Fields      | `AbstractMessageSender._logger` | 00_Base/dist/interfaces/messages/AbstractMessageSender.d.ts:7                                                                                                                   |
| <a id="exchange"></a> `exchange`                     | `private`   | `string`                                                                      | `undefined`   | -           | -                               | [02_Util/src/queue/rabbit-mq/sender.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/sender.ts#L40) |
| <a id="channel_id"></a> `CHANNEL_ID`                 | `private`   | `"sender"`                                                                    | `'sender'`    | Constants   | -                               | [02_Util/src/queue/rabbit-mq/sender.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/sender.ts#L26) |

#### Methods

##### send()

```ts
send(
   message,
   payload?,
state?): Promise<IMessageConfirmation>;
```

Defined in: [02_Util/src/queue/rabbit-mq/sender.ts:90](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/sender.ts#L90)

Sends a message and returns a promise that resolves to a message confirmation.

###### Parameters

| Parameter  | Type                                                         | Description                                |
| ---------- | ------------------------------------------------------------ | ------------------------------------------ |
| `message`  | `IMessage`\<`OcppRequest` \| `OcppResponse` \| `OcppError`\> | The message to be sent.                    |
| `payload?` | `OcppRequest` \| `OcppResponse` \| `OcppError`               | The payload to be included in the message. |
| `state?`   | `MessageState`                                               | The state of the message.                  |

###### Returns

`Promise`\<`IMessageConfirmation`\>

- A promise that resolves to a message confirmation.

###### Implementation of

```ts
IMessageSender.send;
```

##### sendRequest()

```ts
sendRequest(message, payload?): Promise<IMessageConfirmation>;
```

Defined in: [02_Util/src/queue/rabbit-mq/sender.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/sender.ts#L61)

Sends a request message with an optional payload and returns a promise that resolves to the confirmation message.

###### Parameters

| Parameter  | Type                        | Description                                       |
| ---------- | --------------------------- | ------------------------------------------------- |
| `message`  | `IMessage`\<`OcppRequest`\> | The message to be sent.                           |
| `payload?` | `OcppRequest`               | The optional payload to be sent with the message. |

###### Returns

`Promise`\<`IMessageConfirmation`\>

A promise that resolves to the confirmation message.

###### Implementation of

```ts
IMessageSender.sendRequest;
```

##### sendResponse()

```ts
sendResponse(message, payload?): Promise<IMessageConfirmation>;
```

Defined in: [02_Util/src/queue/rabbit-mq/sender.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/sender.ts#L75)

Sends a response message and returns a promise of the message confirmation.

###### Parameters

| Parameter  | Type                                        | Description                             |
| ---------- | ------------------------------------------- | --------------------------------------- |
| `message`  | `IMessage`\<`OcppResponse` \| `OcppError`\> | The message to send.                    |
| `payload?` | `OcppResponse` \| `OcppError`               | The payload to include in the response. |

###### Returns

`Promise`\<`IMessageConfirmation`\>

- A promise that resolves to the message confirmation.

###### Implementation of

```ts
IMessageSender.sendResponse;
```

##### shutdown()

```ts
shutdown(): Promise<void>;
```

Defined in: [02_Util/src/queue/rabbit-mq/sender.ts:147](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/sender.ts#L147)

Shuts down the sender by closing the client.

###### Returns

`Promise`\<`void`\>

A promise that resolves when the client is closed.

###### Implementation of

```ts
IMessageSender.shutdown;
```
