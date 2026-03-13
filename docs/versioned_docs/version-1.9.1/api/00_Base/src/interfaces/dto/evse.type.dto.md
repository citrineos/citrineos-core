[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/evse.type.dto

# 00_Base/src/interfaces/dto/evse.type.dto

## Type Aliases

### EvseTypeCreate

```ts
type EvseTypeCreate = z.infer<typeof EvseTypeCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/evse.type.dto.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.type.dto.ts#L25)

---

### EvseTypeDto

```ts
type EvseTypeDto = z.infer<typeof EvseTypeSchema>;
```

Defined in: [00_Base/src/interfaces/dto/evse.type.dto.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.type.dto.ts#L16)

## Variables

### EvseTypeCreateSchema

```ts
const EvseTypeCreateSchema: ZodObject<
  {
    connectorId: ZodOptional<ZodNullable<ZodNumber>>;
    id: ZodNumber;
    tenantId: ZodOptional<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/evse.type.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.type.dto.ts#L18)

---

### EvseTypeProps

```ts
const EvseTypeProps: object;
```

Defined in: [00_Base/src/interfaces/dto/evse.type.dto.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.type.dto.ts#L14)

#### Type Declaration

| Name                                            | Type            | Defined in |
| ----------------------------------------------- | --------------- | ---------- |
| <a id="property-connectorid"></a> `connectorId` | `"connectorId"` |            |
| <a id="property-createdat"></a> `createdAt`     | `"createdAt"`   |            |
| <a id="property-databaseid"></a> `databaseId`   | `"databaseId"`  |            |
| <a id="property-id"></a> `id`                   | `"id"`          |            |
| <a id="property-tenant"></a> `tenant`           | `"tenant"`      |            |
| <a id="property-tenantid"></a> `tenantId`       | `"tenantId"`    |            |
| <a id="property-updatedat"></a> `updatedAt`     | `"updatedAt"`   |            |

---

### EvseTypeSchema

```ts
const EvseTypeSchema: ZodObject<{
  connectorId: ZodOptional<ZodNullable<ZodNumber>>;
  createdAt: ZodOptional<ZodDate>;
  databaseId: ZodOptional<ZodNumber>;
  id: ZodNumber;
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
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/evse.type.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.type.dto.ts#L8)

---

### evseTypeSchemas

```ts
const evseTypeSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/evse.type.dto.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.type.dto.ts#L27)

#### Type Declaration

| Name                                                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Default value          | Defined in                                                                                                                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-evsetype"></a> `EvseType`             | `ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `EvseTypeSchema`       | [00_Base/src/interfaces/dto/evse.type.dto.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.type.dto.ts#L28) |
| <a id="property-evsetypecreate"></a> `EvseTypeCreate` | `ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodNumber`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `EvseTypeCreateSchema` | [00_Base/src/interfaces/dto/evse.type.dto.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.type.dto.ts#L29) |
