[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/change.configuration.dto

# 00_Base/src/interfaces/dto/change.configuration.dto

## Type Aliases

### ChangeConfigurationCreate

```ts
type ChangeConfigurationCreate = z.infer<typeof ChangeConfigurationCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/change.configuration.dto.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/change.configuration.dto.ts#L26)

---

### ChangeConfigurationDto

```ts
type ChangeConfigurationDto = z.infer<typeof ChangeConfigurationSchema>;
```

Defined in: [00_Base/src/interfaces/dto/change.configuration.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/change.configuration.dto.ts#L18)

## Variables

### ChangeConfigurationCreateSchema

```ts
const ChangeConfigurationCreateSchema: ZodObject<
  {
    id: ZodOptional<ZodNumber>;
    key: ZodString;
    readonly: ZodOptional<ZodNullable<ZodBoolean>>;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    value: ZodOptional<ZodNullable<ZodString>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/change.configuration.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/change.configuration.dto.ts#L20)

---

### ChangeConfigurationProps

```ts
const ChangeConfigurationProps: object;
```

Defined in: [00_Base/src/interfaces/dto/change.configuration.dto.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/change.configuration.dto.ts#L16)

#### Type Declaration

| Name                                        | Type          | Defined in |
| ------------------------------------------- | ------------- | ---------- |
| <a id="property-createdat"></a> `createdAt` | `"createdAt"` |            |
| <a id="property-id"></a> `id`               | `"id"`        |            |
| <a id="property-key"></a> `key`             | `"key"`       |            |
| <a id="property-readonly"></a> `readonly`   | `"readonly"`  |            |
| <a id="property-stationid"></a> `stationId` | `"stationId"` |            |
| <a id="property-tenant"></a> `tenant`       | `"tenant"`    |            |
| <a id="property-tenantid"></a> `tenantId`   | `"tenantId"`  |            |
| <a id="property-updatedat"></a> `updatedAt` | `"updatedAt"` |            |
| <a id="property-value"></a> `value`         | `"value"`     |            |

---

### ChangeConfigurationSchema

```ts
const ChangeConfigurationSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  key: ZodString;
  readonly: ZodOptional<ZodNullable<ZodBoolean>>;
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
  value: ZodOptional<ZodNullable<ZodString>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/change.configuration.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/change.configuration.dto.ts#L8)

---

### changeConfigurationSchemas

```ts
const changeConfigurationSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/change.configuration.dto.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/change.configuration.dto.ts#L28)

#### Type Declaration

| Name                                                                        | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Default value                     | Defined in                                                                                                                                                                                                        |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-changeconfiguration"></a> `ChangeConfiguration`             | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `key`: `ZodString`; `readonly`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `value`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\> | `ChangeConfigurationSchema`       | [00_Base/src/interfaces/dto/change.configuration.dto.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/change.configuration.dto.ts#L29) |
| <a id="property-changeconfigurationcreate"></a> `ChangeConfigurationCreate` | `ZodObject`\<\{ `id`: `ZodOptional`\<`ZodNumber`\>; `key`: `ZodString`; `readonly`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `value`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `ChangeConfigurationCreateSchema` | [00_Base/src/interfaces/dto/change.configuration.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/change.configuration.dto.ts#L30) |
