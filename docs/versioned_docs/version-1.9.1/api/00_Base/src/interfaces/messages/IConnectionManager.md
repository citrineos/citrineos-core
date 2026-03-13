[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/messages/IConnectionManager

# 00_Base/src/interfaces/messages/IConnectionManager

## Interfaces

### IConnectionManager

Defined in: [00_Base/src/interfaces/messages/IConnectionManager.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/IConnectionManager.ts#L18)

Interface for managing a message transport connection.

Implementations connect to a specific transport backend (e.g. RabbitMQ, Kafka)
and expose lifecycle events so that dependent components can react to
connect/disconnect transitions.

Implementations MUST emit the following events (compatible with Node.js EventEmitter):

- `connected` – after a connection is successfully established; argument is the
  transport-specific connection object.
- `disconnected` – when the connection is lost.
- `error` – on connection errors; argument is the Error.

#### Properties

| Property                   | Modifier   | Type     | Description                                                                 | Defined in                                                                                                                                                                                                      |
| -------------------------- | ---------- | -------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="state"></a> `state` | `readonly` | `string` | Current connection state, e.g. `'connected'`, `'disconnected'`, `'closed'`. | [00_Base/src/interfaces/messages/IConnectionManager.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/IConnectionManager.ts#L20) |

#### Methods

##### close()

```ts
close(): Promise<void>;
```

Defined in: [00_Base/src/interfaces/messages/IConnectionManager.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/IConnectionManager.ts#L30)

Gracefully closes the connection and prevents automatic reconnection.

###### Returns

`Promise`\<`void`\>

##### connect()

```ts
connect(): Promise<unknown>;
```

Defined in: [00_Base/src/interfaces/messages/IConnectionManager.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/IConnectionManager.ts#L27)

Establishes a connection to the transport backend.
If a connection is already in progress this should wait for it to complete
rather than opening a second one.

###### Returns

`Promise`\<`unknown`\>

##### isConnected()

```ts
isConnected(): boolean;
```

Defined in: [00_Base/src/interfaces/messages/IConnectionManager.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/IConnectionManager.ts#L33)

Returns `true` when an active connection exists.

###### Returns

`boolean`

##### off()

```ts
off(event, listener): this;
```

Defined in: [00_Base/src/interfaces/messages/IConnectionManager.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/IConnectionManager.ts#L38)

###### Parameters

| Parameter  | Type                  |
| ---------- | --------------------- |
| `event`    | `string` \| `symbol`  |
| `listener` | (...`args`) => `void` |

###### Returns

`this`

##### on()

```ts
on(event, listener): this;
```

Defined in: [00_Base/src/interfaces/messages/IConnectionManager.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/IConnectionManager.ts#L36)

###### Parameters

| Parameter  | Type                  |
| ---------- | --------------------- |
| `event`    | `string` \| `symbol`  |
| `listener` | (...`args`) => `void` |

###### Returns

`this`

##### once()

```ts
once(event, listener): this;
```

Defined in: [00_Base/src/interfaces/messages/IConnectionManager.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/IConnectionManager.ts#L37)

###### Parameters

| Parameter  | Type                  |
| ---------- | --------------------- |
| `event`    | `string` \| `symbol`  |
| `listener` | (...`args`) => `void` |

###### Returns

`this`
