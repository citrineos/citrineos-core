[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/messages/Message

# 00_Base/src/interfaces/messages/Message

## Classes

### Message

Defined in: [00_Base/src/interfaces/messages/Message.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L61)

Default implementation of IMessage

#### Type Parameters

| Type Parameter                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `T` _extends_ \| [`OcppRequest`](../../../src.md#ocpprequest) \| [`OcppResponse`](../../../src.md#ocppresponse) \| [`OcppError`](../../ocpp/rpc/message.md#ocpperror) |

#### Implements

- [`IMessage`](#imessage)\<`T`\>

#### Constructors

##### Constructor

```ts
new Message<T>(
   origin,
   eventGroup,
   action,
   state,
   context,
   payload,
protocol?): Message<T>;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:84](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L84)

Constructs a new instance of Message.

###### Parameters

| Parameter    | Type                                                           | Description                                     |
| ------------ | -------------------------------------------------------------- | ----------------------------------------------- |
| `origin`     | [`MessageOrigin`](../messages.md#messageorigin)                | The origin of the message.                      |
| `eventGroup` | [`EventGroup`](../messages.md#eventgroup)                      | The event group of the message.                 |
| `action`     | [`CallAction`](../../ocpp/rpc/message.md#callaction)           | The action of the message.                      |
| `state`      | [`MessageState`](../messages.md#messagestate)                  | The state of the message.                       |
| `context`    | [`IMessageContext`](MessageContext.md#imessagecontext)         | The context of the message.                     |
| `payload`    | `T`                                                            | The payload of the message.                     |
| `protocol?`  | [`OCPPVersionType`](../../ocpp/rpc/message.md#ocppversiontype) | The protocol of the message, example "ocpp1.6". |

###### Returns

[`Message`](#message)\<`T`\>

#### Properties

| Property                               | Modifier    | Type                                                           | Description | Defined in                                                                                                                                                                                |
| -------------------------------------- | ----------- | -------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_action"></a> `_action`         | `protected` | [`CallAction`](../../ocpp/rpc/message.md#callaction)           | -           | [00_Base/src/interfaces/messages/Message.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L67) |
| <a id="_context"></a> `_context`       | `protected` | [`IMessageContext`](MessageContext.md#imessagecontext)         | -           | [00_Base/src/interfaces/messages/Message.ts:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L69) |
| <a id="_eventgroup"></a> `_eventGroup` | `protected` | [`EventGroup`](../messages.md#eventgroup)                      | -           | [00_Base/src/interfaces/messages/Message.ts:66](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L66) |
| <a id="_origin"></a> `_origin`         | `protected` | [`MessageOrigin`](../messages.md#messageorigin)                | Fields      | [00_Base/src/interfaces/messages/Message.ts:65](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L65) |
| <a id="_payload"></a> `_payload`       | `protected` | `T`                                                            | -           | [00_Base/src/interfaces/messages/Message.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L70) |
| <a id="_protocol"></a> `_protocol`     | `protected` | [`OCPPVersionType`](../../ocpp/rpc/message.md#ocppversiontype) | -           | [00_Base/src/interfaces/messages/Message.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L71) |
| <a id="_state"></a> `_state`           | `protected` | [`MessageState`](../messages.md#messagestate)                  | -           | [00_Base/src/interfaces/messages/Message.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L68) |

#### Accessors

##### action

###### Get Signature

```ts
get action(): CallAction;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L111)

The event type (within the event group)

###### Returns

[`CallAction`](../../ocpp/rpc/message.md#callaction)

###### Set Signature

```ts
set action(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:132](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L132)

The event type (within the event group)

###### Parameters

| Parameter | Type                                                 |
| --------- | ---------------------------------------------------- |
| `value`   | [`CallAction`](../../ocpp/rpc/message.md#callaction) |

###### Returns

`void`

###### Implementation of

[`IMessage`](#imessage).[`action`](#action-1)

##### context

###### Get Signature

```ts
get context(): IMessageContext;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:117](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L117)

The context of the message (the module that sent the message)

###### Returns

[`IMessageContext`](MessageContext.md#imessagecontext)

###### Set Signature

```ts
set context(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:138](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L138)

The context of the message (the module that sent the message)

###### Parameters

| Parameter | Type                                                   |
| --------- | ------------------------------------------------------ |
| `value`   | [`IMessageContext`](MessageContext.md#imessagecontext) |

###### Returns

`void`

###### Implementation of

[`IMessage`](#imessage).[`context`](#context-1)

##### eventGroup

###### Get Signature

```ts
get eventGroup(): EventGroup;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L108)

The event group of the target module

###### Returns

[`EventGroup`](../messages.md#eventgroup)

###### Set Signature

```ts
set eventGroup(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:129](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L129)

The event group of the target module

###### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `value`   | [`EventGroup`](../messages.md#eventgroup) |

###### Returns

`void`

###### Implementation of

[`IMessage`](#imessage).[`eventGroup`](#eventgroup-1)

##### origin

###### Get Signature

```ts
get origin(): MessageOrigin;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:105](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L105)

Getter & Setter

###### Returns

[`MessageOrigin`](../messages.md#messageorigin)

###### Set Signature

```ts
set origin(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:126](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L126)

The event group of the source module

###### Parameters

| Parameter | Type                                            |
| --------- | ----------------------------------------------- |
| `value`   | [`MessageOrigin`](../messages.md#messageorigin) |

###### Returns

`void`

###### Implementation of

[`IMessage`](#imessage).[`origin`](#origin-1)

##### payload

###### Get Signature

```ts
get payload(): T;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:120](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L120)

The payload of the message (the data sent with the message)

###### Returns

`T`

###### Set Signature

```ts
set payload(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:141](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L141)

The payload of the message (the data sent with the message)

###### Parameters

| Parameter | Type |
| --------- | ---- |
| `value`   | `T`  |

###### Returns

`void`

###### Implementation of

[`IMessage`](#imessage).[`payload`](#payload-1)

##### protocol

###### Get Signature

```ts
get protocol(): OCPPVersionType;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L123)

The protocol of the message (ocpp1.6, ocpp2.0.1, etc)

###### Returns

[`OCPPVersionType`](../../ocpp/rpc/message.md#ocppversiontype)

###### Set Signature

```ts
set protocol(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:144](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L144)

The protocol of the message (ocpp1.6, ocpp2.0.1, etc)

###### Parameters

| Parameter | Type                                                           |
| --------- | -------------------------------------------------------------- |
| `value`   | [`OCPPVersionType`](../../ocpp/rpc/message.md#ocppversiontype) |

###### Returns

`void`

###### Implementation of

[`IMessage`](#imessage).[`protocol`](#protocol-1)

##### state

###### Get Signature

```ts
get state(): MessageState;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:114](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L114)

The message state representative of the roundtrip status

###### Returns

[`MessageState`](../messages.md#messagestate)

###### Set Signature

```ts
set state(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:135](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L135)

The message state representative of the roundtrip status

###### Parameters

| Parameter | Type                                          |
| --------- | --------------------------------------------- |
| `value`   | [`MessageState`](../messages.md#messagestate) |

###### Returns

`void`

###### Implementation of

[`IMessage`](#imessage).[`state`](#state-1)

## Interfaces

### IMessage

Defined in: [00_Base/src/interfaces/messages/Message.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L15)

Message

The base interface for all messages traversing the system.

#### Type Parameters

| Type Parameter                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- |
| `T` _extends_ \| [`OcppRequest`](../../../src.md#ocpprequest) \| [`OcppResponse`](../../../src.md#ocppresponse) |

#### Accessors

##### action

###### Get Signature

```ts
get action(): CallAction;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L31)

The event type (within the event group)

###### Returns

[`CallAction`](../../ocpp/rpc/message.md#callaction)

###### Set Signature

```ts
set action(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L32)

###### Parameters

| Parameter | Type                                                 |
| --------- | ---------------------------------------------------- |
| `value`   | [`CallAction`](../../ocpp/rpc/message.md#callaction) |

###### Returns

`void`

##### context

###### Get Signature

```ts
get context(): IMessageContext;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L43)

The context of the message (the module that sent the message)

###### Returns

[`IMessageContext`](MessageContext.md#imessagecontext)

###### Set Signature

```ts
set context(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L44)

###### Parameters

| Parameter | Type                                                   |
| --------- | ------------------------------------------------------ |
| `value`   | [`IMessageContext`](MessageContext.md#imessagecontext) |

###### Returns

`void`

##### eventGroup

###### Get Signature

```ts
get eventGroup(): EventGroup;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L25)

The event group of the target module

###### Returns

[`EventGroup`](../messages.md#eventgroup)

###### Set Signature

```ts
set eventGroup(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L26)

###### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `value`   | [`EventGroup`](../messages.md#eventgroup) |

###### Returns

`void`

##### origin

###### Get Signature

```ts
get origin(): MessageOrigin;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L19)

The event group of the source module

###### Returns

[`MessageOrigin`](../messages.md#messageorigin)

###### Set Signature

```ts
set origin(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L20)

###### Parameters

| Parameter | Type                                            |
| --------- | ----------------------------------------------- |
| `value`   | [`MessageOrigin`](../messages.md#messageorigin) |

###### Returns

`void`

##### payload

###### Get Signature

```ts
get payload(): T;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L49)

The payload of the message (the data sent with the message)

###### Returns

`T`

###### Set Signature

```ts
set payload(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L50)

###### Parameters

| Parameter | Type |
| --------- | ---- |
| `value`   | `T`  |

###### Returns

`void`

##### protocol

###### Get Signature

```ts
get protocol(): OCPPVersionType;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L55)

The protocol of the message (ocpp1.6, ocpp2.0.1, etc)

###### Returns

[`OCPPVersionType`](../../ocpp/rpc/message.md#ocppversiontype)

###### Set Signature

```ts
set protocol(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L56)

###### Parameters

| Parameter | Type                                                           |
| --------- | -------------------------------------------------------------- |
| `value`   | [`OCPPVersionType`](../../ocpp/rpc/message.md#ocppversiontype) |

###### Returns

`void`

##### state

###### Get Signature

```ts
get state(): MessageState;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L37)

The message state representative of the roundtrip status

###### Returns

[`MessageState`](../messages.md#messagestate)

###### Set Signature

```ts
set state(value): void;
```

Defined in: [00_Base/src/interfaces/messages/Message.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/Message.ts#L38)

###### Parameters

| Parameter | Type                                          |
| --------- | --------------------------------------------- |
| `value`   | [`MessageState`](../messages.md#messagestate) |

###### Returns

`void`
