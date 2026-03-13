[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/messages/AbstractMessageHandler

# 00_Base/src/interfaces/messages/AbstractMessageHandler

## Classes

### `abstract` AbstractMessageHandler

Defined in: [00_Base/src/interfaces/messages/AbstractMessageHandler.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractMessageHandler.ts#L15)

Abstract class implementing [IMessageHandler](MessageHandler.md#imessagehandler).

#### Implements

- [`IMessageHandler`](MessageHandler.md#imessagehandler)

#### Constructors

##### Constructor

```ts
new AbstractMessageHandler(logger?, module?): AbstractMessageHandler;
```

Defined in: [00_Base/src/interfaces/messages/AbstractMessageHandler.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractMessageHandler.ts#L29)

Constructor

###### Parameters

| Parameter | Type                                      | Description                   |
| --------- | ----------------------------------------- | ----------------------------- |
| `logger?` | `Logger`\<`ILogObj`\>                     | [Optional] The logger to use. |
| `module?` | [`IModule`](../modules/Module.md#imodule) | -                             |

###### Returns

[`AbstractMessageHandler`](#abstract-abstractmessagehandler)

#### Properties

| Property                        | Modifier    | Type                                      | Description | Defined in                                                                                                                                                                                                              |
| ------------------------------- | ----------- | ----------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger`  | `protected` | `Logger`\<`ILogObj`\>                     | -           | [00_Base/src/interfaces/messages/AbstractMessageHandler.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractMessageHandler.ts#L21) |
| <a id="_module"></a> `_module?` | `protected` | [`IModule`](../modules/Module.md#imodule) | Fields      | [00_Base/src/interfaces/messages/AbstractMessageHandler.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractMessageHandler.ts#L20) |

#### Accessors

##### module

###### Get Signature

```ts
get module(): IModule | undefined;
```

Defined in: [00_Base/src/interfaces/messages/AbstractMessageHandler.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractMessageHandler.ts#L40)

Getter & Setter

###### Returns

[`IModule`](../modules/Module.md#imodule) \| `undefined`

###### Set Signature

```ts
set module(value): void;
```

Defined in: [00_Base/src/interfaces/messages/AbstractMessageHandler.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractMessageHandler.ts#L43)

###### Parameters

| Parameter | Type                                                     |
| --------- | -------------------------------------------------------- |
| `value`   | [`IModule`](../modules/Module.md#imodule) \| `undefined` |

###### Returns

`void`

###### Implementation of

[`IMessageHandler`](MessageHandler.md#imessagehandler).[`module`](MessageHandler.md#module)

#### Methods

##### handle()

```ts
handle(message, props?): Promise<void>;
```

Defined in: [00_Base/src/interfaces/messages/AbstractMessageHandler.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractMessageHandler.ts#L51)

Methods

###### Parameters

| Parameter | Type                                                                                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message` | [`IMessage`](Message.md#imessage)\< \| [`OcppRequest`](../../../src.md#ocpprequest) \| [`OcppResponse`](../../../src.md#ocppresponse) \| [`OcppError`](../../ocpp/rpc/message.md#ocpperror)\> |
| `props?`  | [`HandlerProperties`](../messages.md#handlerproperties)                                                                                                                                       |

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`IMessageHandler`](MessageHandler.md#imessagehandler).[`handle`](MessageHandler.md#handle)

##### shutdown()

```ts
abstract shutdown(): Promise<void>;
```

Defined in: [00_Base/src/interfaces/messages/AbstractMessageHandler.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractMessageHandler.ts#L68)

Shuts down the handler. Unregister all handlers and opening up any resources.

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`IMessageHandler`](MessageHandler.md#imessagehandler).[`shutdown`](MessageHandler.md#shutdown)

##### subscribe()

```ts
abstract subscribe(
   identifier,
   actions?,
filter?): Promise<boolean>;
```

Defined in: [00_Base/src/interfaces/messages/AbstractMessageHandler.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractMessageHandler.ts#L62)

Abstract Methods

###### Parameters

| Parameter    | Type                                                   |
| ------------ | ------------------------------------------------------ |
| `identifier` | `string`                                               |
| `actions?`   | [`CallAction`](../../ocpp/rpc/message.md#callaction)[] |
| `filter?`    | \{ \[`k`: `string`\]: `string`; \}                     |

###### Returns

`Promise`\<`boolean`\>

###### Implementation of

[`IMessageHandler`](MessageHandler.md#imessagehandler).[`subscribe`](MessageHandler.md#subscribe)

##### unsubscribe()

```ts
abstract unsubscribe(identifier): Promise<boolean>;
```

Defined in: [00_Base/src/interfaces/messages/AbstractMessageHandler.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/AbstractMessageHandler.ts#L67)

Unsubscribe from messages. E.g. when a connection drops.

###### Parameters

| Parameter    | Type     | Description                         |
| ------------ | -------- | ----------------------------------- |
| `identifier` | `string` | The identifier to unsubscribe from. |

###### Returns

`Promise`\<`boolean`\>

A promise that resolves to a boolean value indicating whether the unsubscription was successful.

###### Implementation of

[`IMessageHandler`](MessageHandler.md#imessagehandler).[`unsubscribe`](MessageHandler.md#unsubscribe)
