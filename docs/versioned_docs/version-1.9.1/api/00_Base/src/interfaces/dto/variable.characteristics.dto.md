[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/variable.characteristics.dto

# 00_Base/src/interfaces/dto/variable.characteristics.dto

## Type Aliases

### VariableCharacteristicsCreate

```ts
type VariableCharacteristicsCreate = z.infer<typeof VariableCharacteristicsCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.characteristics.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.characteristics.dto.ts#L34)

---

### VariableCharacteristicsDto

```ts
type VariableCharacteristicsDto = z.infer<typeof VariableCharacteristicsSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.characteristics.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.characteristics.dto.ts#L24)

## Variables

### VariableCharacteristicsCreateSchema

```ts
const VariableCharacteristicsCreateSchema: ZodObject<
  {
    dataType: ZodEnum<typeof DataEnumType>;
    maxLimit: ZodOptional<ZodNullable<ZodNumber>>;
    minLimit: ZodOptional<ZodNullable<ZodNumber>>;
    supportsMonitoring: ZodBoolean;
    tenantId: ZodOptional<ZodNumber>;
    unit: ZodOptional<ZodNullable<ZodString>>;
    valuesList: ZodOptional<ZodNullable<ZodString>>;
    variableId: ZodOptional<ZodNullable<ZodNumber>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/variable.characteristics.dto.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.characteristics.dto.ts#L26)

---

### VariableCharacteristicsProps

```ts
const VariableCharacteristicsProps: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.characteristics.dto.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.characteristics.dto.ts#L22)

#### Type Declaration

| Name                                                          | Type                   | Defined in |
| ------------------------------------------------------------- | ---------------------- | ---------- |
| <a id="property-createdat"></a> `createdAt`                   | `"createdAt"`          |            |
| <a id="property-datatype"></a> `dataType`                     | `"dataType"`           |            |
| <a id="property-id"></a> `id`                                 | `"id"`                 |            |
| <a id="property-maxlimit"></a> `maxLimit`                     | `"maxLimit"`           |            |
| <a id="property-minlimit"></a> `minLimit`                     | `"minLimit"`           |            |
| <a id="property-supportsmonitoring"></a> `supportsMonitoring` | `"supportsMonitoring"` |            |
| <a id="property-tenant"></a> `tenant`                         | `"tenant"`             |            |
| <a id="property-tenantid"></a> `tenantId`                     | `"tenantId"`           |            |
| <a id="property-unit"></a> `unit`                             | `"unit"`               |            |
| <a id="property-updatedat"></a> `updatedAt`                   | `"updatedAt"`          |            |
| <a id="property-valueslist"></a> `valuesList`                 | `"valuesList"`         |            |
| <a id="property-variable"></a> `variable`                     | `"variable"`           |            |
| <a id="property-variableid"></a> `variableId`                 | `"variableId"`         |            |

---

### VariableCharacteristicsSchema

```ts
const VariableCharacteristicsSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
  dataType: ZodEnum<typeof DataEnumType>;
  id: ZodOptional<ZodNumber>;
  maxLimit: ZodOptional<ZodNullable<ZodNumber>>;
  minLimit: ZodOptional<ZodNullable<ZodNumber>>;
  supportsMonitoring: ZodBoolean;
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
  unit: ZodOptional<ZodNullable<ZodString>>;
  updatedAt: ZodOptional<ZodDate>;
  valuesList: ZodOptional<ZodNullable<ZodString>>;
  variable: ZodObject<{
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
           credentialsRole: ...;
           versionDetails: ...;
           versionEndpoints: ...;
        }, $strip>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>;
  variableId: ZodOptional<ZodNullable<ZodNumber>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/variable.characteristics.dto.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.characteristics.dto.ts#L10)

---

### variableCharacteristicsSchemas

```ts
const variableCharacteristicsSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.characteristics.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.characteristics.dto.ts#L36)

#### Type Declaration

| Name                                                                                | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Default value                         | Defined in                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-variablecharacteristics"></a> `VariableCharacteristics`             | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `dataType`: `ZodEnum`\<_typeof_ [`DataEnumType`](../../ocpp/model/2.0.1/enums.md#dataenumtype)\>; `id`: `ZodOptional`\<`ZodNumber`\>; `maxLimit`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `minLimit`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `supportsMonitoring`: `ZodBoolean`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `unit`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `valuesList`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `variable`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>; `variableId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\> | `VariableCharacteristicsSchema`       | [00_Base/src/interfaces/dto/variable.characteristics.dto.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.characteristics.dto.ts#L37) |
| <a id="property-variablecharacteristicscreate"></a> `VariableCharacteristicsCreate` | `ZodObject`\<\{ `dataType`: `ZodEnum`\<_typeof_ [`DataEnumType`](../../ocpp/model/2.0.1/enums.md#dataenumtype)\>; `maxLimit`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `minLimit`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `supportsMonitoring`: `ZodBoolean`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `unit`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `valuesList`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `variableId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `VariableCharacteristicsCreateSchema` | [00_Base/src/interfaces/dto/variable.characteristics.dto.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.characteristics.dto.ts#L38) |
