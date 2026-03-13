[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/messages/MessageSender

# 00_Base/src/interfaces/messages/MessageSender

## Interfaces

### IMessageSender

Defined in: [00_Base/src/interfaces/messages/MessageSender.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageSender.ts#L18)

IMessageSender

Represents an interface for sending messages.

All implementations of this interface should carry any context from the [IMessage](Message.md#imessage)
to be sent as metadata in the underlying message transport. This will allow to route
messages to the correct module and filter them accordingly.

#### Methods

##### send()

```ts
send(
   message,
   payload?,
state?): Promise<IMessageConfirmation>;
```

Defined in: [00_Base/src/interfaces/messages/MessageSender.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageSender.ts#L48)

Sends a message.

###### Parameters

| Parameter  | Type                                                                                                                                                                                          | Description         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `message`  | [`IMessage`](Message.md#imessage)\< \| [`OcppRequest`](../../../src.md#ocpprequest) \| [`OcppResponse`](../../../src.md#ocppresponse) \| [`OcppError`](../../ocpp/rpc/message.md#ocpperror)\> | The message object. |
| `payload?` | \| [`OcppRequest`](../../../src.md#ocpprequest) \| [`OcppResponse`](../../../src.md#ocppresponse) \| [`OcppError`](../../ocpp/rpc/message.md#ocpperror)                                       | The payload object. |
| `state?`   | [`MessageState`](../messages.md#messagestate)                                                                                                                                                 | The message state.  |

###### Returns

`Promise`\<[`IMessageConfirmation`](MessageConfirmation.md#imessageconfirmation)\>

A promise that resolves to the message confirmation.

##### sendRequest()

```ts
sendRequest(message, payload?): Promise<IMessageConfirmation>;
```

Defined in: [00_Base/src/interfaces/messages/MessageSender.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageSender.ts#L26)

Sends a request message.

###### Parameters

| Parameter  | Type                                                                              | Description         |
| ---------- | --------------------------------------------------------------------------------- | ------------------- |
| `message`  | [`IMessage`](Message.md#imessage)\<[`OcppRequest`](../../../src.md#ocpprequest)\> | The message object. |
| `payload?` | [`OcppRequest`](../../../src.md#ocpprequest)                                      | The payload object. |

###### Returns

`Promise`\<[`IMessageConfirmation`](MessageConfirmation.md#imessageconfirmation)\>

A promise that resolves to the message confirmation.

##### sendResponse()

```ts
sendResponse(message, payload?): Promise<IMessageConfirmation>;
```

Defined in: [00_Base/src/interfaces/messages/MessageSender.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageSender.ts#L35)

Sends a response message.

###### Parameters

| Parameter  | Type                                                                                                                                          | Description         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `message`  | [`IMessage`](Message.md#imessage)\< \| [`OcppResponse`](../../../src.md#ocppresponse) \| [`OcppError`](../../ocpp/rpc/message.md#ocpperror)\> | The message object. |
| `payload?` | \| [`OcppResponse`](../../../src.md#ocppresponse) \| [`OcppError`](../../ocpp/rpc/message.md#ocpperror)                                       | The payload object. |

###### Returns

`Promise`\<[`IMessageConfirmation`](MessageConfirmation.md#imessageconfirmation)\>

A promise that resolves to the message confirmation.

##### shutdown()

```ts
shutdown(): Promise<void>;
```

Defined in: [00_Base/src/interfaces/messages/MessageSender.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/messages/MessageSender.ts#L57)

Shuts down the sender.

###### Returns

`Promise`\<`void`\>
