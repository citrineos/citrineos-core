[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/security.event.dto

# 00_Base/src/interfaces/dto/security.event.dto

## Type Aliases

### SecurityEventCreate

```ts
type SecurityEventCreate = z.infer<typeof SecurityEventCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/security.event.dto.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/security.event.dto.ts#L27)

---

### SecurityEventDto

```ts
type SecurityEventDto = z.infer<typeof SecurityEventSchema>;
```

Defined in: [00_Base/src/interfaces/dto/security.event.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/security.event.dto.ts#L18)

## Variables

### SecurityEventCreateSchema

```ts
const SecurityEventCreateSchema: ZodObject<
  {
    stationId: ZodString;
    techInfo: ZodOptional<ZodNullable<ZodString>>;
    tenantId: ZodOptional<ZodNumber>;
    timestamp: ZodISODateTime;
    type: ZodString;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/security.event.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/security.event.dto.ts#L20)

---

### SecurityEventProps

```ts
const SecurityEventProps: object;
```

Defined in: [00_Base/src/interfaces/dto/security.event.dto.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/security.event.dto.ts#L16)

#### Type Declaration

| Name                                        | Type          | Defined in |
| ------------------------------------------- | ------------- | ---------- |
| <a id="property-createdat"></a> `createdAt` | `"createdAt"` |            |
| <a id="property-id"></a> `id`               | `"id"`        |            |
| <a id="property-stationid"></a> `stationId` | `"stationId"` |            |
| <a id="property-techinfo"></a> `techInfo`   | `"techInfo"`  |            |
| <a id="property-tenant"></a> `tenant`       | `"tenant"`    |            |
| <a id="property-tenantid"></a> `tenantId`   | `"tenantId"`  |            |
| <a id="property-timestamp"></a> `timestamp` | `"timestamp"` |            |
| <a id="property-type"></a> `type`           | `"type"`      |            |
| <a id="property-updatedat"></a> `updatedAt` | `"updatedAt"` |            |

---

### SecurityEventSchema

```ts
const SecurityEventSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  stationId: ZodString;
  techInfo: ZodOptional<ZodNullable<ZodString>>;
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
  type: ZodString;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/security.event.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/security.event.dto.ts#L8)

---

### securityEventSchemas

```ts
const securityEventSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/security.event.dto.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/security.event.dto.ts#L29)

#### Type Declaration

| Name                                                            | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Default value               | Defined in                                                                                                                                                                                            |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-securityevent"></a> `SecurityEvent`             | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `stationId`: `ZodString`; `techInfo`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `type`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `SecurityEventSchema`       | [00_Base/src/interfaces/dto/security.event.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/security.event.dto.ts#L30) |
| <a id="property-securityeventcreate"></a> `SecurityEventCreate` | `ZodObject`\<\{ `stationId`: `ZodString`; `techInfo`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `type`: `ZodString`; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `SecurityEventCreateSchema` | [00_Base/src/interfaces/dto/security.event.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/security.event.dto.ts#L31) |
