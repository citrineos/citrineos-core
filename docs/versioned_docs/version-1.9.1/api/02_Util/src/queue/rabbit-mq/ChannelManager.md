[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/queue/rabbit-mq/ChannelManager

# 02_Util/src/queue/rabbit-mq/ChannelManager

## Classes

### RabbitMQChannelManager

Defined in: [02_Util/src/queue/rabbit-mq/ChannelManager.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ChannelManager.ts#L9)

#### Constructors

##### Constructor

```ts
new RabbitMQChannelManager(connectionManager, logger?): RabbitMQChannelManager;
```

Defined in: [02_Util/src/queue/rabbit-mq/ChannelManager.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ChannelManager.ts#L14)

###### Parameters

| Parameter           | Type                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| `connectionManager` | [`RabbitMQConnectionManager`](ConnectionManager.md#rabbitmqconnectionmanager) |
| `logger?`           | `Logger`\<`ILogObj`\>                                                         |

###### Returns

[`RabbitMQChannelManager`](#rabbitmqchannelmanager)

#### Properties

| Property                                           | Modifier    | Type                                                                          | Defined in                                                                                                                                                                                      |
| -------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger`                     | `protected` | `Logger`\<`ILogObj`\>                                                         | [02_Util/src/queue/rabbit-mq/ChannelManager.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ChannelManager.ts#L12) |
| <a id="channelmap"></a> `channelMap`               | `private`   | `Map`\<`string`, `Channel` \| `null`\>                                        | [02_Util/src/queue/rabbit-mq/ChannelManager.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ChannelManager.ts#L10) |
| <a id="connectionmanager"></a> `connectionManager` | `private`   | [`RabbitMQConnectionManager`](ConnectionManager.md#rabbitmqconnectionmanager) | [02_Util/src/queue/rabbit-mq/ChannelManager.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ChannelManager.ts#L15) |

#### Methods

##### closeAll()

```ts
closeAll(): Promise<void>;
```

Defined in: [02_Util/src/queue/rabbit-mq/ChannelManager.ts:66](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ChannelManager.ts#L66)

###### Returns

`Promise`\<`void`\>

##### closeChannel()

```ts
closeChannel(channelId): Promise<void>;
```

Defined in: [02_Util/src/queue/rabbit-mq/ChannelManager.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ChannelManager.ts#L58)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `channelId` | `string` |

###### Returns

`Promise`\<`void`\>

##### getChannel()

```ts
getChannel(channelId): Promise<Channel>;
```

Defined in: [02_Util/src/queue/rabbit-mq/ChannelManager.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ChannelManager.ts#L35)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `channelId` | `string` |

###### Returns

`Promise`\<`Channel`\>

##### recreateChannels()

```ts
private recreateChannels(): Promise<void>;
```

Defined in: [02_Util/src/queue/rabbit-mq/ChannelManager.ts:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ChannelManager.ts#L79)

###### Returns

`Promise`\<`void`\>
