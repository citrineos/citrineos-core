[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/messages/MessageHandler

# 00_Base/src/interfaces/messages/MessageHandler

## Interfaces

### IMessageHandler

Defined in: [00_Base/src/interfaces/messages/MessageHandler.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageHandler.ts#L16)

MessageHandler

The interface for all message handlers.

#### Accessors

##### module

###### Get Signature

```ts
get module(): IModule | undefined;
```

Defined in: [00_Base/src/interfaces/messages/MessageHandler.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageHandler.ts#L51)

###### Returns

[`IModule`](../modules/Module.md#imodule) \| `undefined`

###### Set Signature

```ts
set module(value): void;
```

Defined in: [00_Base/src/interfaces/messages/MessageHandler.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageHandler.ts#L52)

###### Parameters

| Parameter | Type                                                     |
| --------- | -------------------------------------------------------- |
| `value`   | [`IModule`](../modules/Module.md#imodule) \| `undefined` |

###### Returns

`void`

#### Methods

##### handle()

```ts
handle(message, props?): void;
```

Defined in: [00_Base/src/interfaces/messages/MessageHandler.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageHandler.ts#L44)

Handles incoming messages.

###### Parameters

| Parameter | Type                                                                                                                                    | Description                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `message` | [`IMessage`](Message.md#imessage)\< \| [`OcppRequest`](../../../src.md#ocpprequest) \| [`OcppResponse`](../../../src.md#ocppresponse)\> | The message to be handled.           |
| `props?`  | [`HandlerProperties`](../messages.md#handlerproperties)                                                                                 | Optional properties for the handler. |

###### Returns

`void`

##### shutdown()

```ts
shutdown(): Promise<void>;
```

Defined in: [00_Base/src/interfaces/messages/MessageHandler.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageHandler.ts#L49)

Shuts down the handler. Unregister all handlers and opening up any resources.

###### Returns

`Promise`\<`void`\>

##### subscribe()

```ts
subscribe(
   identifier,
   actions?,
filter?): Promise<boolean>;
```

Defined in: [00_Base/src/interfaces/messages/MessageHandler.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageHandler.ts#L25)

Subscribes to messages based on actions and context filters.

###### Parameters

| Parameter    | Type                                                   | Description                                                                                              |
| ------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `identifier` | `string`                                               | The identifier to subscribe for.                                                                         |
| `actions?`   | [`CallAction`](../../ocpp/rpc/message.md#callaction)[] | Optional. The list of call actions to subscribe to.                                                      |
| `filter?`    | \{ \[`k`: `string`\]: `string`; \}                     | Optional. An additional message context filter. **Note**: Might not be supported by all implementations. |

###### Returns

`Promise`\<`boolean`\>

A promise that resolves to a boolean value indicating whether the initialization was successful.

###### See

IMessageContext for available attributes.

##### unsubscribe()

```ts
unsubscribe(identifier): Promise<boolean>;
```

Defined in: [00_Base/src/interfaces/messages/MessageHandler.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageHandler.ts#L37)

Unsubscribe from messages. E.g. when a connection drops.

###### Parameters

| Parameter    | Type     | Description                         |
| ------------ | -------- | ----------------------------------- |
| `identifier` | `string` | The identifier to unsubscribe from. |

###### Returns

`Promise`\<`boolean`\>

A promise that resolves to a boolean value indicating whether the unsubscription was successful.
