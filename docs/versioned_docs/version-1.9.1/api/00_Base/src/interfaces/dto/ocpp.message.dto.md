[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/ocpp.message.dto

# 00_Base/src/interfaces/dto/ocpp.message.dto

## Type Aliases

### OCPPMessageCreate

```ts
type OCPPMessageCreate = z.infer<typeof OCPPMessageCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/ocpp.message.dto.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/ocpp.message.dto.ts#L42)

---

### OCPPMessageDto

```ts
type OCPPMessageDto = z.infer<typeof OCPPMessageSchema>;
```

Defined in: [00_Base/src/interfaces/dto/ocpp.message.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/ocpp.message.dto.ts#L33)

## Variables

### OCPPMessageCreateSchema

```ts
const OCPPMessageCreateSchema: ZodObject<{
  action: ZodString;
  correlationId: ZodOptional<ZodString>;
  message: ZodAny;
  origin: ZodEnum<typeof MessageOrigin>;
  protocol: ZodEnum<typeof OCPPVersion>;
  requestMessage: ZodOptional<ZodObject<{
     action: ZodString;
     correlationId: ZodOptional<ZodString>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     message: ZodAny;
     origin: ZodEnum<typeof MessageOrigin>;
     protocol: ZodEnum<typeof OCPPVersion>;
     state: ZodEnum<typeof MessageState>;
     stationId: ZodString;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<ZodString>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<ZodString>>;
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     timestamp: ZodISODateTime;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>;
  requestMessageId: ZodOptional<ZodNumber>;
  responseMessages: ZodOptional<ZodArray<ZodObject<{
     action: ZodString;
     correlationId: ZodOptional<ZodString>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     message: ZodAny;
     origin: ZodEnum<typeof MessageOrigin>;
     protocol: ZodEnum<typeof OCPPVersion>;
     state: ZodEnum<typeof MessageState>;
     stationId: ZodString;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<...>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<...>>;
        serverProfileOCPI: ZodOptional<ZodNullable<...>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<...>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     timestamp: ZodISODateTime;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>>;
  state: ZodEnum<typeof MessageState>;
  stationId: ZodString;
  tenantId: ZodOptional<ZodNumber>;
  timestamp: ZodISODateTime;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/ocpp.message.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/ocpp.message.dto.ts#L35)

---

### OCPPMessageProps

```ts
const OCPPMessageProps: object;
```

Defined in: [00_Base/src/interfaces/dto/ocpp.message.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/ocpp.message.dto.ts#L31)

#### Type Declaration

| Name                                                      | Type                 | Defined in |
| --------------------------------------------------------- | -------------------- | ---------- |
| <a id="property-action"></a> `action`                     | `"action"`           |            |
| <a id="property-correlationid"></a> `correlationId`       | `"correlationId"`    |            |
| <a id="property-createdat"></a> `createdAt`               | `"createdAt"`        |            |
| <a id="property-id"></a> `id`                             | `"id"`               |            |
| <a id="property-message"></a> `message`                   | `"message"`          |            |
| <a id="property-origin"></a> `origin`                     | `"origin"`           |            |
| <a id="property-protocol"></a> `protocol`                 | `"protocol"`         |            |
| <a id="property-requestmessage"></a> `requestMessage`     | `"requestMessage"`   |            |
| <a id="property-requestmessageid"></a> `requestMessageId` | `"requestMessageId"` |            |
| <a id="property-responsemessages"></a> `responseMessages` | `"responseMessages"` |            |
| <a id="property-state"></a> `state`                       | `"state"`            |            |
| <a id="property-stationid"></a> `stationId`               | `"stationId"`        |            |
| <a id="property-tenant"></a> `tenant`                     | `"tenant"`           |            |
| <a id="property-tenantid"></a> `tenantId`                 | `"tenantId"`         |            |
| <a id="property-timestamp"></a> `timestamp`               | `"timestamp"`        |            |
| <a id="property-updatedat"></a> `updatedAt`               | `"updatedAt"`        |            |

---

### ocppMessageSchemas

```ts
const ocppMessageSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/ocpp.message.dto.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/ocpp.message.dto.ts#L44)

#### Type Declaration

| Name                                                        | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Default value             | Defined in                                                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-ocppmessage"></a> `OCPPMessage`             | `ZodObject`\<\{ `action`: `ZodString`; `correlationId`: `ZodOptional`\<`ZodString`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `message`: `ZodAny`; `origin`: `ZodEnum`\<_typeof_ [`MessageOrigin`](../messages.md#messageorigin)\>; `protocol`: `ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>; `requestMessage`: `ZodOptional`\<`ZodObject`\<\{ `action`: `ZodString`; `correlationId`: `ZodOptional`\<`ZodString`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `message`: `ZodAny`; `origin`: `ZodEnum`\<_typeof_ [`MessageOrigin`](../messages.md#messageorigin)\>; `protocol`: `ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>; `state`: `ZodEnum`\<_typeof_ [`MessageState`](../messages.md#messagestate)\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `requestMessageId`: `ZodOptional`\<`ZodNumber`\>; `responseMessages`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `action`: `ZodString`; `correlationId`: `ZodOptional`\<`ZodString`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `message`: `ZodAny`; `origin`: `ZodEnum`\<_typeof_ [`MessageOrigin`](../messages.md#messageorigin)\>; `protocol`: `ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>; `state`: `ZodEnum`\<_typeof_ [`MessageState`](../messages.md#messagestate)\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `state`: `ZodEnum`\<_typeof_ [`MessageState`](../messages.md#messagestate)\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `OCPPMessageSchema`       | [00_Base/src/interfaces/dto/ocpp.message.dto.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/ocpp.message.dto.ts#L45) |
| <a id="property-ocppmessagecreate"></a> `OCPPMessageCreate` | `ZodObject`\<\{ `action`: `ZodString`; `correlationId`: `ZodOptional`\<`ZodString`\>; `message`: `ZodAny`; `origin`: `ZodEnum`\<_typeof_ [`MessageOrigin`](../messages.md#messageorigin)\>; `protocol`: `ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>; `requestMessage`: `ZodOptional`\<`ZodObject`\<\{ `action`: `ZodString`; `correlationId`: `ZodOptional`\<`ZodString`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `message`: `ZodAny`; `origin`: `ZodEnum`\<_typeof_ [`MessageOrigin`](../messages.md#messageorigin)\>; `protocol`: `ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>; `state`: `ZodEnum`\<_typeof_ [`MessageState`](../messages.md#messagestate)\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `requestMessageId`: `ZodOptional`\<`ZodNumber`\>; `responseMessages`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `action`: `ZodString`; `correlationId`: `ZodOptional`\<`ZodString`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `message`: `ZodAny`; `origin`: `ZodEnum`\<_typeof_ [`MessageOrigin`](../messages.md#messageorigin)\>; `protocol`: `ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>; `state`: `ZodEnum`\<_typeof_ [`MessageState`](../messages.md#messagestate)\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `state`: `ZodEnum`\<_typeof_ [`MessageState`](../messages.md#messagestate)\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `OCPPMessageCreateSchema` | [00_Base/src/interfaces/dto/ocpp.message.dto.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/ocpp.message.dto.ts#L46) |

---

### OCPPMessageWithoutRequestResponseSchema

```ts
const OCPPMessageWithoutRequestResponseSchema: ZodObject<{
  action: ZodString;
  correlationId: ZodOptional<ZodString>;
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  message: ZodAny;
  origin: ZodEnum<typeof MessageOrigin>;
  protocol: ZodEnum<typeof OCPPVersion>;
  state: ZodEnum<typeof MessageState>;
  stationId: ZodString;
  tenant: ZodOptional<ZodObject<{
     countryCode: ZodOptional<ZodNullable<ZodString>>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     isUserTenant: ZodDefault<ZodBoolean>;
     name: ZodString;
     partyId: ZodOptional<ZodNullable<ZodString>>;
     serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<{
        credentialsRole: ZodObject<{
           businessDetails: ...;
           role: ...;
        }, $strip>;
        versionDetails: ZodArray<ZodObject<..., ...>>;
        versionEndpoints: ZodRecord<ZodString, ZodArray<...>>;
     }, $strip>>>;
     updatedAt: ZodOptional<ZodDate>;
     url: ZodOptional<ZodNullable<ZodString>>;
  }, $strip>>;
  tenantId: ZodOptional<ZodNumber>;
  timestamp: ZodISODateTime;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/ocpp.message.dto.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/ocpp.message.dto.ts#L13)
