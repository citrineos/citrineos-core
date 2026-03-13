[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/queue/rabbit-mq/ConnectionManager

# 02_Util/src/queue/rabbit-mq/ConnectionManager

## Classes

### RabbitMQConnectionManager

Defined in: [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L9)

#### Extends

- `AbstractConnectionManager`\<`amqp.Connection`\>

#### Constructors

##### Constructor

```ts
new RabbitMQConnectionManager(
   maxReconnectDelay,
   url,
   logger?): RabbitMQConnectionManager;
```

Defined in: [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L15)

###### Parameters

| Parameter           | Type                  |
| ------------------- | --------------------- |
| `maxReconnectDelay` | `number`              |
| `url`               | `string`              |
| `logger?`           | `Logger`\<`ILogObj`\> |

###### Returns

[`RabbitMQConnectionManager`](#rabbitmqconnectionmanager)

###### Overrides

```ts
AbstractConnectionManager<amqp.Connection>.constructor
```

#### Properties

| Property                                           | Modifier    | Type                   | Default value | Description                                                                 | Inherited from                      | Defined in                                                                                                                                                                                            |
| -------------------------------------------------- | ----------- | ---------------------- | ------------- | --------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger`                     | `protected` | `Logger`\<`ILogObj`\>  | `undefined`   | -                                                                           | `AbstractConnectionManager._logger` | 00_Base/dist/interfaces/messages/AbstractConnectionManager.d.ts:19                                                                                                                                    |
| <a id="connection"></a> `connection`               | `private`   | `Connection` \| `null` | `null`        | -                                                                           | -                                   | [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L10) |
| <a id="isconnecting"></a> `isConnecting`           | `private`   | `boolean`              | `false`       | -                                                                           | -                                   | [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L11) |
| <a id="maxreconnectdelay"></a> `maxReconnectDelay` | `private`   | `number`               | `undefined`   | -                                                                           | -                                   | [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L16) |
| <a id="reconnectattempts"></a> `reconnectAttempts` | `private`   | `number`               | `0`           | -                                                                           | -                                   | [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L12) |
| <a id="reconnectdelay"></a> `reconnectDelay`       | `private`   | `number`               | `1000`        | -                                                                           | -                                   | [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L13) |
| <a id="state"></a> `state`                         | `public`    | `string`               | `undefined`   | Current connection state, e.g. `'connected'`, `'disconnected'`, `'closed'`. | `AbstractConnectionManager.state`   | 00_Base/dist/interfaces/messages/AbstractConnectionManager.d.ts:20                                                                                                                                    |
| <a id="url"></a> `url`                             | `private`   | `string`               | `undefined`   | -                                                                           | -                                   | [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L17) |

#### Methods

##### close()

```ts
close(): Promise<void>;
```

Defined in: [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L100)

Gracefully closes the connection.

###### Returns

`Promise`\<`void`\>

###### Overrides

```ts
AbstractConnectionManager.close;
```

##### connect()

```ts
connect(): Promise<Connection>;
```

Defined in: [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L23)

Establishes a connection to the transport backend.
Implementations should handle in-progress connection attempts and
return the existing connection if already connected.

###### Returns

`Promise`\<`Connection`\>

###### Overrides

```ts
AbstractConnectionManager.connect;
```

##### handleReconnect()

```ts
private handleReconnect(): Promise<void>;
```

Defined in: [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L73)

###### Returns

`Promise`\<`void`\>

##### isConnected()

```ts
isConnected(): boolean;
```

Defined in: [02_Util/src/queue/rabbit-mq/ConnectionManager.ts:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/rabbit-mq/ConnectionManager.ts#L108)

Returns true if there is an active connection.

###### Returns

`boolean`

###### Overrides

```ts
AbstractConnectionManager.isConnected;
```
