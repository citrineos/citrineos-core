[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/variable.monitoring.dto

# 00_Base/src/interfaces/dto/variable.monitoring.dto

## Type Aliases

### VariableMonitoringCreate

```ts
type VariableMonitoringCreate = z.infer<typeof VariableMonitoringCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.dto.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.dto.ts#L38)

---

### VariableMonitoringDto

```ts
type VariableMonitoringDto = z.infer<typeof VariableMonitoringSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.dto.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.dto.ts#L27)

## Variables

### VariableMonitoringCreateSchema

```ts
const VariableMonitoringCreateSchema: ZodObject<
  {
    componentId: ZodOptional<ZodNullable<ZodNumber>>;
    id: ZodNumber;
    severity: ZodNumber;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    transaction: ZodBoolean;
    type: ZodEnum<{
      Delta: 'Delta';
      LowerThreshold: 'LowerThreshold';
      Periodic: 'Periodic';
      PeriodicClockAligned: 'PeriodicClockAligned';
      UpperThreshold: 'UpperThreshold';
    }>;
    value: ZodNumber;
    variableId: ZodOptional<ZodNullable<ZodNumber>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.dto.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.dto.ts#L29)

---

### VariableMonitoringProps

```ts
const VariableMonitoringProps: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.dto.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.dto.ts#L25)

#### Type Declaration

| Name                                            | Type            | Defined in |
| ----------------------------------------------- | --------------- | ---------- |
| <a id="property-component"></a> `component`     | `"component"`   |            |
| <a id="property-componentid"></a> `componentId` | `"componentId"` |            |
| <a id="property-createdat"></a> `createdAt`     | `"createdAt"`   |            |
| <a id="property-databaseid"></a> `databaseId`   | `"databaseId"`  |            |
| <a id="property-id"></a> `id`                   | `"id"`          |            |
| <a id="property-severity"></a> `severity`       | `"severity"`    |            |
| <a id="property-stationid"></a> `stationId`     | `"stationId"`   |            |
| <a id="property-tenant"></a> `tenant`           | `"tenant"`      |            |
| <a id="property-tenantid"></a> `tenantId`       | `"tenantId"`    |            |
| <a id="property-transaction"></a> `transaction` | `"transaction"` |            |
| <a id="property-type"></a> `type`               | `"type"`        |            |
| <a id="property-updatedat"></a> `updatedAt`     | `"updatedAt"`   |            |
| <a id="property-value"></a> `value`             | `"value"`       |            |
| <a id="property-variable"></a> `variable`       | `"variable"`    |            |
| <a id="property-variableid"></a> `variableId`   | `"variableId"`  |            |

---

### VariableMonitoringSchema

```ts
const VariableMonitoringSchema: ZodObject<{
  component: ZodObject<{
     createdAt: ZodOptional<ZodDate>;
     evse: ZodOptional<ZodObject<{
        connectorId: ZodOptional<ZodNullable<ZodNumber>>;
        createdAt: ZodOptional<ZodDate>;
        databaseId: ZodOptional<ZodNumber>;
        id: ZodNumber;
        tenant: ZodOptional<ZodObject<{
           countryCode: ZodOptional<...>;
           createdAt: ZodOptional<...>;
           id: ZodOptional<...>;
           isUserTenant: ZodDefault<...>;
           name: ZodString;
           partyId: ZodOptional<...>;
           serverProfileOCPI: ZodOptional<...>;
           updatedAt: ZodOptional<...>;
           url: ZodOptional<...>;
        }, $strip>>;
        tenantId: ZodOptional<ZodNumber>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>;
     evseDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
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
     variables: ZodOptional<ZodArray<ZodObject<{
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        instance: ZodOptional<ZodNullable<ZodString>>;
        name: ZodString;
        tenant: ZodOptional<ZodObject<{
           countryCode: ...;
           createdAt: ...;
           id: ...;
           isUserTenant: ...;
           name: ...;
           partyId: ...;
           serverProfileOCPI: ...;
           updatedAt: ...;
           url: ...;
        }, $strip>>;
        tenantId: ZodOptional<ZodNumber>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>>;
  }, $strip>;
  componentId: ZodOptional<ZodNullable<ZodNumber>>;
  createdAt: ZodOptional<ZodDate>;
  databaseId: ZodNumber;
  id: ZodNumber;
  severity: ZodNumber;
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
  transaction: ZodBoolean;
  type: ZodEnum<{
     Delta: "Delta";
     LowerThreshold: "LowerThreshold";
     Periodic: "Periodic";
     PeriodicClockAligned: "PeriodicClockAligned";
     UpperThreshold: "UpperThreshold";
  }>;
  updatedAt: ZodOptional<ZodDate>;
  value: ZodNumber;
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

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.dto.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.dto.ts#L11)

---

### variableMonitoringSchemas

```ts
const variableMonitoringSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.dto.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.dto.ts#L40)

#### Type Declaration

| Name                                                                      | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Default value                    | Defined in                                                                                                                                                                                                      |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-variablemonitoring"></a> `VariableMonitoring`             | `ZodObject`\<\{ `component`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `variables`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<...\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; \}, `$strip`\>; `componentId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `id`: `ZodNumber`; `severity`: `ZodNumber`; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `transaction`: `ZodBoolean`; `type`: `ZodEnum`\<\{ `Delta`: `"Delta"`; `LowerThreshold`: `"LowerThreshold"`; `Periodic`: `"Periodic"`; `PeriodicClockAligned`: `"PeriodicClockAligned"`; `UpperThreshold`: `"UpperThreshold"`; \}\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `value`: `ZodNumber`; `variable`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>; `variableId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\> | `VariableMonitoringSchema`       | [00_Base/src/interfaces/dto/variable.monitoring.dto.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.dto.ts#L41) |
| <a id="property-variablemonitoringcreate"></a> `VariableMonitoringCreate` | `ZodObject`\<\{ `componentId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodNumber`; `severity`: `ZodNumber`; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `transaction`: `ZodBoolean`; `type`: `ZodEnum`\<\{ `Delta`: `"Delta"`; `LowerThreshold`: `"LowerThreshold"`; `Periodic`: `"Periodic"`; `PeriodicClockAligned`: `"PeriodicClockAligned"`; `UpperThreshold`: `"UpperThreshold"`; \}\>; `value`: `ZodNumber`; `variableId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `VariableMonitoringCreateSchema` | [00_Base/src/interfaces/dto/variable.monitoring.dto.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.dto.ts#L42) |
