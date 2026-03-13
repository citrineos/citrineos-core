[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/queue/rabbit-mq/receiver

# 02_Util/src/queue/rabbit-mq/receiver

## Classes

### RabbitMqReceiver

Defined in: [02_Util/src/queue/rabbit-mq/receiver.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L15)

Implementation of a IMessageHandler using RabbitMQ as the underlying transport.

#### Extends

- `AbstractMessageHandler`

#### Constructors

##### Constructor

```ts
new RabbitMqReceiver(
   exchange,
   channelManager,
   logger?,
   module?): RabbitMqReceiver;
```

Defined in: [02_Util/src/queue/rabbit-mq/receiver.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L28)

###### Parameters

| Parameter        | Type                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `exchange`       | `string`                                                             |
| `channelManager` | [`RabbitMQChannelManager`](ChannelManager.md#rabbitmqchannelmanager) |
| `logger?`        | `Logger`\<`ILogObj`\>                                                |
| `module?`        | `IModule`                                                            |

###### Returns

[`RabbitMqReceiver`](#rabbitmqreceiver)

###### Overrides

```ts
AbstractMessageHandler.constructor;
```

#### Properties

| Property                                       | Modifier    | Type                                                                 | Default value     | Description | Inherited from                   | Defined in                                                                                                                                                                          |
| ---------------------------------------------- | ----------- | -------------------------------------------------------------------- | ----------------- | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_channelmanager"></a> `_channelManager` | `protected` | [`RabbitMQChannelManager`](ChannelManager.md#rabbitmqchannelmanager) | `undefined`       | Fields      | -                                | [02_Util/src/queue/rabbit-mq/receiver.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L25) |
| <a id="_consumertags"></a> `_consumerTags`     | `protected` | `Map`\<`string`, `string`[]\>                                        | `undefined`       | -           | -                                | [02_Util/src/queue/rabbit-mq/receiver.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L26) |
| <a id="_logger"></a> `_logger`                 | `protected` | `Logger`\<`ILogObj`\>                                                | `undefined`       | -           | `AbstractMessageHandler._logger` | 00_Base/dist/interfaces/messages/AbstractMessageHandler.d.ts:16                                                                                                                     |
| <a id="_module"></a> `_module?`                | `protected` | `IModule`                                                            | `undefined`       | Fields      | `AbstractMessageHandler._module` | 00_Base/dist/interfaces/messages/AbstractMessageHandler.d.ts:15                                                                                                                     |
| <a id="exchange"></a> `exchange`               | `private`   | `string`                                                             | `undefined`       | -           | -                                | [02_Util/src/queue/rabbit-mq/receiver.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L29) |
| <a id="channel_id"></a> `CHANNEL_ID`           | `private`   | `"receiver"`                                                         | `'receiver'`      | -           | -                                | [02_Util/src/queue/rabbit-mq/receiver.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L20) |
| <a id="queue_prefix"></a> `QUEUE_PREFIX`       | `private`   | `"rabbit_queue_"`                                                    | `'rabbit_queue_'` | Constants   | -                                | [02_Util/src/queue/rabbit-mq/receiver.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L19) |

#### Accessors

##### module

###### Get Signature

```ts
get module(): IModule | undefined;
```

Defined in: 00_Base/dist/interfaces/messages/AbstractMessageHandler.d.ts:27

Getter & Setter

###### Returns

`IModule` \| `undefined`

###### Set Signature

```ts
set module(value): void;
```

Defined in: 00_Base/dist/interfaces/messages/AbstractMessageHandler.d.ts:28

###### Parameters

| Parameter | Type                     |
| --------- | ------------------------ |
| `value`   | `IModule` \| `undefined` |

###### Returns

`void`

###### Inherited from

```ts
AbstractMessageHandler.module;
```

#### Methods

##### \_onMessage()

```ts
protected _onMessage(message, channel): Promise<void>;
```

Defined in: [02_Util/src/queue/rabbit-mq/receiver.ts:166](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L166)

Underlying RabbitMQ message handler.

###### Parameters

| Parameter | Type                       | Description                |
| --------- | -------------------------- | -------------------------- |
| `message` | `ConsumeMessage` \| `null` | The AMQPMessage to process |
| `channel` | `Channel`                  | -                          |

###### Returns

`Promise`\<`void`\>

##### handle()

```ts
handle(message, props?): Promise<void>;
```

Defined in: 00_Base/dist/interfaces/messages/AbstractMessageHandler.d.ts:32

Methods

###### Parameters

| Parameter | Type                                                         |
| --------- | ------------------------------------------------------------ |
| `message` | `IMessage`\<`OcppRequest` \| `OcppResponse` \| `OcppError`\> |
| `props?`  | `HandlerProperties`                                          |

###### Returns

`Promise`\<`void`\>

###### Inherited from

```ts
AbstractMessageHandler.handle;
```

##### shutdown()

```ts
shutdown(): Promise<void>;
```

Defined in: [02_Util/src/queue/rabbit-mq/receiver.ts:141](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L141)

###### Returns

`Promise`\<`void`\>

###### Overrides

```ts
AbstractMessageHandler.shutdown;
```

##### subscribe()

```ts
subscribe(
   identifier,
   actions?,
filter?): Promise<boolean>;
```

Defined in: [02_Util/src/queue/rabbit-mq/receiver.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L51)

Binds queue to an exchange given identifier and optional actions and filter.
Note: Due to the nature of AMQP 0-9-1 model, if you need to filter for the identifier, you **MUST** provide it in the filter object.

###### Parameters

| Parameter    | Type                               | Description                                                           |
| ------------ | ---------------------------------- | --------------------------------------------------------------------- |
| `identifier` | `string`                           | The identifier of the channel to subscribe to.                        |
| `actions?`   | `CallAction`[]                     | Optional. An array of actions to filter the messages.                 |
| `filter?`    | \{ \[`k`: `string`\]: `string`; \} | Optional. An object representing the filter to apply on the messages. |

###### Returns

`Promise`\<`boolean`\>

A promise that resolves to true if the subscription is successful, false otherwise.

###### Overrides

```ts
AbstractMessageHandler.subscribe;
```

##### unsubscribe()

```ts
unsubscribe(identifier): Promise<boolean>;
```

Defined in: [02_Util/src/queue/rabbit-mq/receiver.ts:121](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/receiver.ts#L121)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `identifier` | `string` |

###### Returns

`Promise`\<`boolean`\>

###### Overrides

```ts
AbstractMessageHandler.unsubscribe;
```
