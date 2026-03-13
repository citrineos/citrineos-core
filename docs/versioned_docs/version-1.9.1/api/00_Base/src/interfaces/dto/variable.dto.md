[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/variable.dto

# 00_Base/src/interfaces/dto/variable.dto

## Type Aliases

### VariableCreate

```ts
type VariableCreate = z.infer<typeof VariableCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.dto.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.dto.ts#L28)

---

### VariableDto

```ts
type VariableDto = z.infer<typeof VariableSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.dto.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.dto.ts#L16)

## Variables

### VariableCreateSchema

```ts
const VariableCreateSchema: ZodObject<
  {
    instance: ZodOptional<ZodNullable<ZodString>>;
    name: ZodString;
    tenantId: ZodOptional<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/variable.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.dto.ts#L18)

---

### VariableProps

```ts
const VariableProps: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.dto.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.dto.ts#L14)

#### Type Declaration

| Name                                        | Type          | Defined in |
| ------------------------------------------- | ------------- | ---------- |
| <a id="property-createdat"></a> `createdAt` | `"createdAt"` |            |
| <a id="property-id"></a> `id`               | `"id"`        |            |
| <a id="property-instance"></a> `instance`   | `"instance"`  |            |
| <a id="property-name"></a> `name`           | `"name"`      |            |
| <a id="property-tenant"></a> `tenant`       | `"tenant"`    |            |
| <a id="property-tenantid"></a> `tenantId`   | `"tenantId"`  |            |
| <a id="property-updatedat"></a> `updatedAt` | `"updatedAt"` |            |

---

### VariableSchema

```ts
const VariableSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  instance: ZodOptional<ZodNullable<ZodString>>;
  name: ZodString;
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

Defined in: [00_Base/src/interfaces/dto/variable.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.dto.ts#L8)

---

### variableSchemas

```ts
const variableSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.dto.ts#L30)

#### Type Declaration

| Name                                                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Default value          | Defined in                                                                                                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-variable"></a> `Variable`             | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `VariableSchema`       | [00_Base/src/interfaces/dto/variable.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.dto.ts#L31) |
| <a id="property-variablecreate"></a> `VariableCreate` | `ZodObject`\<\{ `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `VariableCreateSchema` | [00_Base/src/interfaces/dto/variable.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.dto.ts#L32) |
