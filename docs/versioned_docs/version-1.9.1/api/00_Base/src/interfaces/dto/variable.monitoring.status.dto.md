[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/variable.monitoring.status.dto

# 00_Base/src/interfaces/dto/variable.monitoring.status.dto

## Type Aliases

### VariableMonitoringStatusCreate

```ts
type VariableMonitoringStatusCreate = z.infer<typeof VariableMonitoringStatusCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts#L30)

---

### VariableMonitoringStatusDto

```ts
type VariableMonitoringStatusDto = z.infer<typeof VariableMonitoringStatusSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts#L20)

## Variables

### VariableMonitoringStatusCreateSchema

```ts
const VariableMonitoringStatusCreateSchema: ZodObject<
  {
    status: ZodString;
    statusInfo: ZodOptional<
      ZodNullable<
        ZodObject<
          {
            additionalInfo: ZodOptional<ZodNullable<ZodString>>;
            customData: ZodOptional<ZodNullable<ZodAny>>;
            reasonCode: ZodString;
          },
          $strip
        >
      >
    >;
    tenantId: ZodOptional<ZodNumber>;
    variableMonitoringId: ZodOptional<ZodNullable<ZodNumber>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts#L22)

---

### VariableMonitoringStatusProps

```ts
const VariableMonitoringStatusProps: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts#L18)

#### Type Declaration

| Name                                                              | Type                     | Defined in |
| ----------------------------------------------------------------- | ------------------------ | ---------- |
| <a id="property-createdat"></a> `createdAt`                       | `"createdAt"`            |            |
| <a id="property-id"></a> `id`                                     | `"id"`                   |            |
| <a id="property-status"></a> `status`                             | `"status"`               |            |
| <a id="property-statusinfo"></a> `statusInfo`                     | `"statusInfo"`           |            |
| <a id="property-tenant"></a> `tenant`                             | `"tenant"`               |            |
| <a id="property-tenantid"></a> `tenantId`                         | `"tenantId"`             |            |
| <a id="property-updatedat"></a> `updatedAt`                       | `"updatedAt"`            |            |
| <a id="property-variable"></a> `variable`                         | `"variable"`             |            |
| <a id="property-variablemonitoringid"></a> `variableMonitoringId` | `"variableMonitoringId"` |            |

---

### VariableMonitoringStatusSchema

```ts
const VariableMonitoringStatusSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  status: ZodString;
  statusInfo: ZodOptional<ZodNullable<ZodObject<{
     additionalInfo: ZodOptional<ZodNullable<ZodString>>;
     customData: ZodOptional<ZodNullable<ZodAny>>;
     reasonCode: ZodString;
  }, $strip>>>;
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
  variable: ZodObject<{
     component: ZodObject<{
        createdAt: ZodOptional<ZodDate>;
        evse: ZodOptional<ZodObject<{
           connectorId: ZodOptional<ZodNullable<...>>;
           createdAt: ZodOptional<ZodDate>;
           databaseId: ZodOptional<ZodNumber>;
           id: ZodNumber;
           tenant: ZodOptional<ZodObject<..., ...>>;
           tenantId: ZodOptional<ZodNumber>;
           updatedAt: ZodOptional<ZodDate>;
        }, $strip>>;
        evseDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
        id: ZodOptional<ZodNumber>;
        instance: ZodOptional<ZodNullable<ZodString>>;
        name: ZodString;
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
        updatedAt: ZodOptional<ZodDate>;
        variables: ZodOptional<ZodArray<ZodObject<{
           createdAt: ZodOptional<...>;
           id: ZodOptional<...>;
           instance: ZodOptional<...>;
           name: ZodString;
           tenant: ZodOptional<...>;
           tenantId: ZodOptional<...>;
           updatedAt: ZodOptional<...>;
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
           credentialsRole: ...;
           versionDetails: ...;
           versionEndpoints: ...;
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
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>;
     variableId: ZodOptional<ZodNullable<ZodNumber>>;
  }, $strip>;
  variableMonitoringId: ZodOptional<ZodNullable<ZodNumber>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts#L10)

---

### variableMonitoringStatusSchemas

```ts
const variableMonitoringStatusSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts#L32)

#### Type Declaration

| Name                                                                                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Default value                          | Defined in                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-variablemonitoringstatus"></a> `VariableMonitoringStatus`             | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `status`: `ZodString`; `statusInfo`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `additionalInfo`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `reasonCode`: `ZodString`; \}, `$strip`\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `variable`: `ZodObject`\<\{ `component`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `databaseId`: `ZodOptional`\<...\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `variables`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `createdAt`: ...; `id`: ...; `instance`: ...; `name`: ...; `tenant`: ...; `tenantId`: ...; `updatedAt`: ...; \}, `$strip`\>\>\>; \}, `$strip`\>; `componentId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `id`: `ZodNumber`; `severity`: `ZodNumber`; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `transaction`: `ZodBoolean`; `type`: `ZodEnum`\<\{ `Delta`: `"Delta"`; `LowerThreshold`: `"LowerThreshold"`; `Periodic`: `"Periodic"`; `PeriodicClockAligned`: `"PeriodicClockAligned"`; `UpperThreshold`: `"UpperThreshold"`; \}\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `value`: `ZodNumber`; `variable`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>; `variableId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>; `variableMonitoringId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\> | `VariableMonitoringStatusSchema`       | [00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts#L33) |
| <a id="property-variablemonitoringstatuscreate"></a> `VariableMonitoringStatusCreate` | `ZodObject`\<\{ `status`: `ZodString`; `statusInfo`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `additionalInfo`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `reasonCode`: `ZodString`; \}, `$strip`\>\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `variableMonitoringId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `VariableMonitoringStatusCreateSchema` | [00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.monitoring.status.dto.ts#L34) |
