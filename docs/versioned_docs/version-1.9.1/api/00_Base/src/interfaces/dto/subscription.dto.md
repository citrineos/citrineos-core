[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/subscription.dto

# 00_Base/src/interfaces/dto/subscription.dto

## Type Aliases

### SubscriptionCreate

```ts
type SubscriptionCreate = z.infer<typeof SubscriptionCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/subscription.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/subscription.dto.ts#L30)

---

### SubscriptionDto

```ts
type SubscriptionDto = z.infer<typeof SubscriptionSchema>;
```

Defined in: [00_Base/src/interfaces/dto/subscription.dto.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/subscription.dto.ts#L21)

## Variables

### SubscriptionCreateSchema

```ts
const SubscriptionCreateSchema: ZodObject<
  {
    messageRegexFilter: ZodOptional<ZodNullable<ZodString>>;
    onClose: ZodDefault<ZodBoolean>;
    onConnect: ZodDefault<ZodBoolean>;
    onMessage: ZodDefault<ZodBoolean>;
    sentMessage: ZodDefault<ZodBoolean>;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    url: ZodString;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/subscription.dto.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/subscription.dto.ts#L23)

---

### SubscriptionProps

```ts
const SubscriptionProps: object;
```

Defined in: [00_Base/src/interfaces/dto/subscription.dto.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/subscription.dto.ts#L19)

#### Type Declaration

| Name                                                          | Type                   | Defined in |
| ------------------------------------------------------------- | ---------------------- | ---------- |
| <a id="property-createdat"></a> `createdAt`                   | `"createdAt"`          |            |
| <a id="property-id"></a> `id`                                 | `"id"`                 |            |
| <a id="property-messageregexfilter"></a> `messageRegexFilter` | `"messageRegexFilter"` |            |
| <a id="property-onclose"></a> `onClose`                       | `"onClose"`            |            |
| <a id="property-onconnect"></a> `onConnect`                   | `"onConnect"`          |            |
| <a id="property-onmessage"></a> `onMessage`                   | `"onMessage"`          |            |
| <a id="property-sentmessage"></a> `sentMessage`               | `"sentMessage"`        |            |
| <a id="property-stationid"></a> `stationId`                   | `"stationId"`          |            |
| <a id="property-tenant"></a> `tenant`                         | `"tenant"`             |            |
| <a id="property-tenantid"></a> `tenantId`                     | `"tenantId"`           |            |
| <a id="property-updatedat"></a> `updatedAt`                   | `"updatedAt"`          |            |
| <a id="property-url"></a> `url`                               | `"url"`                |            |

---

### SubscriptionSchema

```ts
const SubscriptionSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  messageRegexFilter: ZodOptional<ZodNullable<ZodString>>;
  onClose: ZodDefault<ZodBoolean>;
  onConnect: ZodDefault<ZodBoolean>;
  onMessage: ZodDefault<ZodBoolean>;
  sentMessage: ZodDefault<ZodBoolean>;
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
  updatedAt: ZodOptional<ZodDate>;
  url: ZodString;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/subscription.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/subscription.dto.ts#L8)

---

### subscriptionSchemas

```ts
const subscriptionSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/subscription.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/subscription.dto.ts#L32)

#### Type Declaration

| Name                                                          | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Default value              | Defined in                                                                                                                                                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-subscription"></a> `Subscription`             | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `messageRegexFilter`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `onClose`: `ZodDefault`\<`ZodBoolean`\>; `onConnect`: `ZodDefault`\<`ZodBoolean`\>; `onMessage`: `ZodDefault`\<`ZodBoolean`\>; `sentMessage`: `ZodDefault`\<`ZodBoolean`\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodString`; \}, `$strip`\> | `SubscriptionSchema`       | [00_Base/src/interfaces/dto/subscription.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/subscription.dto.ts#L33) |
| <a id="property-subscriptioncreate"></a> `SubscriptionCreate` | `ZodObject`\<\{ `messageRegexFilter`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `onClose`: `ZodDefault`\<`ZodBoolean`\>; `onConnect`: `ZodDefault`\<`ZodBoolean`\>; `onMessage`: `ZodDefault`\<`ZodBoolean`\>; `sentMessage`: `ZodDefault`\<`ZodBoolean`\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `url`: `ZodString`; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `SubscriptionCreateSchema` | [00_Base/src/interfaces/dto/subscription.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/subscription.dto.ts#L34) |
