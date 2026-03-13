[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 00_Base/src/util/request

# 00_Base/src/util/request

## Classes

### RequestBuilder

Defined in: [00_Base/src/util/request.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/request.ts#L8)

#### Constructors

##### Constructor

```ts
new RequestBuilder(): RequestBuilder;
```

###### Returns

[`RequestBuilder`](#requestbuilder)

#### Methods

##### buildCall()

```ts
static buildCall(
   stationId,
   correlationId,
   tenantId,
   action,
   payload,
   eventGroup,
   origin,
   protocol,
timestamp?): IMessage<OcppRequest>;
```

Defined in: [00_Base/src/util/request.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/request.ts#L9)

###### Parameters

| Parameter       | Type                                                        |
| --------------- | ----------------------------------------------------------- |
| `stationId`     | `string`                                                    |
| `correlationId` | `string`                                                    |
| `tenantId`      | `number`                                                    |
| `action`        | [`CallAction`](../ocpp/rpc/message.md#callaction)           |
| `payload`       | [`OcppRequest`](../../src.md#ocpprequest)                   |
| `eventGroup`    | [`EventGroup`](../interfaces/messages.md#eventgroup)        |
| `origin`        | [`MessageOrigin`](../interfaces/messages.md#messageorigin)  |
| `protocol`      | [`OCPPVersionType`](../ocpp/rpc/message.md#ocppversiontype) |
| `timestamp`     | `Date`                                                      |

###### Returns

[`IMessage`](../interfaces/messages/Message.md#imessage)\<[`OcppRequest`](../../src.md#ocpprequest)\>

##### buildCallError()

```ts
static buildCallError(
   stationId,
   correlationId,
   tenantId,
   action,
   payload,
   eventGroup,
   origin,
   protocol,
timestamp?): IMessage<OcppError>;
```

Defined in: [00_Base/src/util/request.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/request.ts#L63)

###### Parameters

| Parameter       | Type                                                        |
| --------------- | ----------------------------------------------------------- |
| `stationId`     | `string`                                                    |
| `correlationId` | `string`                                                    |
| `tenantId`      | `number`                                                    |
| `action`        | [`CallAction`](../ocpp/rpc/message.md#callaction)           |
| `payload`       | [`OcppError`](../ocpp/rpc/message.md#ocpperror)             |
| `eventGroup`    | [`EventGroup`](../interfaces/messages.md#eventgroup)        |
| `origin`        | [`MessageOrigin`](../interfaces/messages.md#messageorigin)  |
| `protocol`      | [`OCPPVersionType`](../ocpp/rpc/message.md#ocppversiontype) |
| `timestamp`     | `Date`                                                      |

###### Returns

[`IMessage`](../interfaces/messages/Message.md#imessage)\<[`OcppError`](../ocpp/rpc/message.md#ocpperror)\>

##### buildCallResult()

```ts
static buildCallResult(
   stationId,
   correlationId,
   tenantId,
   action,
   payload,
   eventGroup,
   origin,
   protocol,
timestamp?): IMessage<OcppResponse>;
```

Defined in: [00_Base/src/util/request.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/request.ts#L36)

###### Parameters

| Parameter       | Type                                                        |
| --------------- | ----------------------------------------------------------- |
| `stationId`     | `string`                                                    |
| `correlationId` | `string`                                                    |
| `tenantId`      | `number`                                                    |
| `action`        | [`CallAction`](../ocpp/rpc/message.md#callaction)           |
| `payload`       | [`OcppResponse`](../../src.md#ocppresponse)                 |
| `eventGroup`    | [`EventGroup`](../interfaces/messages.md#eventgroup)        |
| `origin`        | [`MessageOrigin`](../interfaces/messages.md#messageorigin)  |
| `protocol`      | [`OCPPVersionType`](../ocpp/rpc/message.md#ocppversiontype) |
| `timestamp`     | `Date`                                                      |

###### Returns

[`IMessage`](../interfaces/messages/Message.md#imessage)\<[`OcppResponse`](../../src.md#ocppresponse)\>
