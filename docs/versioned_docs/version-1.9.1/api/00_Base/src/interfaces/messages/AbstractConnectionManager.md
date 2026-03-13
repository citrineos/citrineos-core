[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/messages/AbstractConnectionManager

# 00_Base/src/interfaces/messages/AbstractConnectionManager

## Classes

### `abstract` AbstractConnectionManager

Defined in: [00_Base/src/interfaces/messages/AbstractConnectionManager.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractConnectionManager.ts#L23)

Abstract base class for managing a message transport connection.

Implementations are responsible for establishing, maintaining, and closing
connections to a specific transport backend (e.g. RabbitMQ, Kafka).

Emits:

- `connected` when a connection is established (with the connection object as argument)
- `disconnected` when the connection is lost
- `error` on connection errors

#### Extends

- `EventEmitter`

#### Type Parameters

| Type Parameter | Default type | Description                                                             |
| -------------- | ------------ | ----------------------------------------------------------------------- |
| `TConnection`  | `unknown`    | The transport-specific connection type returned by [connect](#connect). |

#### Implements

- [`IConnectionManager`](IConnectionManager.md#iconnectionmanager)

#### Constructors

##### Constructor

```ts
new AbstractConnectionManager<TConnection>(logger?): AbstractConnectionManager<TConnection>;
```

Defined in: [00_Base/src/interfaces/messages/AbstractConnectionManager.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractConnectionManager.ts#L31)

###### Parameters

| Parameter | Type                  |
| --------- | --------------------- |
| `logger?` | `Logger`\<`ILogObj`\> |

###### Returns

[`AbstractConnectionManager`](#abstract-abstractconnectionmanager)\<`TConnection`\>

###### Overrides

```ts
EventEmitter.constructor;
```

#### Properties

| Property                       | Modifier    | Type                  | Default value    | Description                                                                 | Defined in                                                                                                                                                                                                                    |
| ------------------------------ | ----------- | --------------------- | ---------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger` | `protected` | `Logger`\<`ILogObj`\> | `undefined`      | -                                                                           | [00_Base/src/interfaces/messages/AbstractConnectionManager.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractConnectionManager.ts#L27) |
| <a id="state"></a> `state`     | `public`    | `string`              | `'disconnected'` | Current connection state, e.g. `'connected'`, `'disconnected'`, `'closed'`. | [00_Base/src/interfaces/messages/AbstractConnectionManager.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractConnectionManager.ts#L29) |

#### Methods

##### close()

```ts
abstract close(): Promise<void>;
```

Defined in: [00_Base/src/interfaces/messages/AbstractConnectionManager.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractConnectionManager.ts#L48)

Gracefully closes the connection.

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`IConnectionManager`](IConnectionManager.md#iconnectionmanager).[`close`](IConnectionManager.md#close)

##### connect()

```ts
abstract connect(): Promise<TConnection>;
```

Defined in: [00_Base/src/interfaces/messages/AbstractConnectionManager.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractConnectionManager.ts#L43)

Establishes a connection to the transport backend.
Implementations should handle in-progress connection attempts and
return the existing connection if already connected.

###### Returns

`Promise`\<`TConnection`\>

###### Implementation of

[`IConnectionManager`](IConnectionManager.md#iconnectionmanager).[`connect`](IConnectionManager.md#connect)

##### isConnected()

```ts
abstract isConnected(): boolean;
```

Defined in: [00_Base/src/interfaces/messages/AbstractConnectionManager.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractConnectionManager.ts#L53)

Returns true if there is an active connection.

###### Returns

`boolean`

###### Implementation of

[`IConnectionManager`](IConnectionManager.md#iconnectionmanager).[`isConnected`](IConnectionManager.md#isconnected)
