[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/queue/BrokerAwareMessageSender

# 02_Util/src/queue/BrokerAwareMessageSender

## Classes

### BrokerAwareMessageSender

Defined in: [02_Util/src/queue/BrokerAwareMessageSender.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L37)

A decorator around any IMessageSender that adds resilience when the
underlying message broker is unavailable.

Behaviour when the broker is **disconnected**:

- **Call messages** (`MessageState.Request`): a `maxCallLengthSeconds` timeout is
  started. When it fires the optional [onCallTimeout](#oncalltimeout) callback is invoked
  (e.g. to close the charger's WebSocket) and the pending entry is removed from
  memory to prevent retry accumulation.
- **All other messages** (`MessageState.Response` / `MessageState.Unknown`): the
  message is held in an in-memory buffer and replayed in order once the broker
  reconnects.

Behaviour when the broker **reconnects**:

- All buffered non-Call messages are flushed in order through the inner sender.
- In-flight Call timeouts continue to run (they will still close the WS connection
  because the Call was never delivered to a module).

#### Extends

- `AbstractMessageSender`

#### Implements

- `IMessageSender`

#### Constructors

##### Constructor

```ts
new BrokerAwareMessageSender(
   _inner,
   _connectionManager,
   _maxCallLengthSeconds,
   logger?): BrokerAwareMessageSender;
```

Defined in: [02_Util/src/queue/BrokerAwareMessageSender.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L54)

###### Parameters

| Parameter               | Type                  |
| ----------------------- | --------------------- |
| `_inner`                | `IMessageSender`      |
| `_connectionManager`    | `IConnectionManager`  |
| `_maxCallLengthSeconds` | `number`              |
| `logger?`               | `Logger`\<`ILogObj`\> |

###### Returns

[`BrokerAwareMessageSender`](#brokerawaremessagesender)

###### Overrides

```ts
AbstractMessageSender.constructor;
```

#### Properties

| Property                                                   | Modifier    | Type                                             | Default value | Description                                                                                                                                                                                                  | Inherited from                  | Defined in                                                                                                                                                                                      |
| ---------------------------------------------------------- | ----------- | ------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_buffer"></a> `_buffer`                             | `private`   | `AnyMessage`[]                                   | `[]`          | Pending non-Call messages waiting to be flushed after reconnection.                                                                                                                                          | -                               | [02_Util/src/queue/BrokerAwareMessageSender.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L39) |
| <a id="_calltimeouts"></a> `_callTimeouts`                 | `private`   | `Map`\<`string`, `Timeout`\>                     | `undefined`   | Active Call timeouts keyed by connection identifier (`tenantId:stationId`). When a timeout fires the entry is deleted and `_onCallTimeout` is invoked.                                                       | -                               | [02_Util/src/queue/BrokerAwareMessageSender.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L45) |
| <a id="_connectionmanager"></a> `_connectionManager`       | `private`   | `IConnectionManager`                             | `undefined`   | -                                                                                                                                                                                                            | -                               | [02_Util/src/queue/BrokerAwareMessageSender.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L56) |
| <a id="_inner"></a> `_inner`                               | `private`   | `IMessageSender`                                 | `undefined`   | -                                                                                                                                                                                                            | -                               | [02_Util/src/queue/BrokerAwareMessageSender.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L55) |
| <a id="_logger"></a> `_logger`                             | `protected` | `Logger`\<`ILogObj`\>                            | `undefined`   | Fields                                                                                                                                                                                                       | `AbstractMessageSender._logger` | 00_Base/dist/interfaces/messages/AbstractMessageSender.d.ts:7                                                                                                                                   |
| <a id="_maxcalllengthseconds"></a> `_maxCallLengthSeconds` | `private`   | `number`                                         | `undefined`   | -                                                                                                                                                                                                            | -                               | [02_Util/src/queue/BrokerAwareMessageSender.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L57) |
| <a id="oncalltimeout"></a> `onCallTimeout?`                | `public`    | (`stationId`, `tenantId`) => `Promise`\<`void`\> | `undefined`   | Optional callback invoked when a Call times out while the broker is down. Typically used to close the corresponding WebSocket connection. Can be set after construction to avoid circular dependency issues. | -                               | [02_Util/src/queue/BrokerAwareMessageSender.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L52) |

#### Methods

##### \_bufferMessage()

```ts
private _bufferMessage(message): IMessageConfirmation;
```

Defined in: [02_Util/src/queue/BrokerAwareMessageSender.ts:168](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L168)

Adds a non-Call message to the in-memory buffer.

###### Parameters

| Parameter | Type         |
| --------- | ------------ |
| `message` | `AnyMessage` |

###### Returns

`IMessageConfirmation`

##### \_clearAllCallTimeouts()

```ts
private _clearAllCallTimeouts(): void;
```

Defined in: [02_Util/src/queue/BrokerAwareMessageSender.ts:217](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L217)

###### Returns

`void`

##### \_flushBuffer()

```ts
private _flushBuffer(): Promise<void>;
```

Defined in: [02_Util/src/queue/BrokerAwareMessageSender.ts:181](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L181)

Replays all buffered messages through the inner sender.
If the broker drops again mid-flush the remaining messages are re-buffered.

###### Returns

`Promise`\<`void`\>

##### \_handleDisconnectedCall()

```ts
private _handleDisconnectedCall(message): IMessageConfirmation;
```

Defined in: [02_Util/src/queue/BrokerAwareMessageSender.ts:127](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L127)

Starts a `maxCallLengthSeconds` timer for a Call that cannot be delivered
because the broker is down. On expiry the optional [onCallTimeout](#oncalltimeout)
callback is invoked and the timeout entry is cleaned up.

Returns `{ success: true }` so the router does not immediately send a
CallError – the charger will wait until the connection is closed by the timer.

###### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `message` | `IMessage`\<`OcppRequest`\> |

###### Returns

`IMessageConfirmation`

##### send()

```ts
send(
   message,
   payload?,
state?): Promise<IMessageConfirmation>;
```

Defined in: [02_Util/src/queue/BrokerAwareMessageSender.ts:90](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L90)

Sends a message.

###### Parameters

| Parameter  | Type                                           | Description         |
| ---------- | ---------------------------------------------- | ------------------- |
| `message`  | `AnyMessage`                                   | The message object. |
| `payload?` | `OcppRequest` \| `OcppResponse` \| `OcppError` | The payload object. |
| `state?`   | `MessageState`                                 | The message state.  |

###### Returns

`Promise`\<`IMessageConfirmation`\>

A promise that resolves to the message confirmation.

###### Implementation of

```ts
IMessageSender.send;
```

##### sendRequest()

```ts
sendRequest(message, payload?): Promise<IMessageConfirmation>;
```

Defined in: [02_Util/src/queue/BrokerAwareMessageSender.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L76)

Sends a request message.

###### Parameters

| Parameter  | Type                        | Description         |
| ---------- | --------------------------- | ------------------- |
| `message`  | `IMessage`\<`OcppRequest`\> | The message object. |
| `payload?` | `OcppRequest`               | The payload object. |

###### Returns

`Promise`\<`IMessageConfirmation`\>

A promise that resolves to the message confirmation.

###### Implementation of

```ts
IMessageSender.sendRequest;
```

##### sendResponse()

```ts
sendResponse(message, payload?): Promise<IMessageConfirmation>;
```

Defined in: [02_Util/src/queue/BrokerAwareMessageSender.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L83)

Sends a response message.

###### Parameters

| Parameter  | Type                                        | Description         |
| ---------- | ------------------------------------------- | ------------------- |
| `message`  | `IMessage`\<`OcppResponse` \| `OcppError`\> | The message object. |
| `payload?` | `OcppResponse` \| `OcppError`               | The payload object. |

###### Returns

`Promise`\<`IMessageConfirmation`\>

A promise that resolves to the message confirmation.

###### Implementation of

```ts
IMessageSender.sendResponse;
```

##### shutdown()

```ts
shutdown(): Promise<void>;
```

Defined in: [02_Util/src/queue/BrokerAwareMessageSender.ts:109](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/queue/BrokerAwareMessageSender.ts#L109)

Shuts down the sender.

###### Returns

`Promise`\<`void`\>

###### Implementation of

```ts
IMessageSender.shutdown;
```
