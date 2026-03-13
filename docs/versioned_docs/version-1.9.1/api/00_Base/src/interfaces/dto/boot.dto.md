[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/boot.dto

# 00_Base/src/interfaces/dto/boot.dto

## Type Aliases

### BootCreate

```ts
type BootCreate = z.infer<typeof BootCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/boot.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L35)

---

### BootDto

```ts
type BootDto = z.infer<typeof BootSchema>;
```

Defined in: [00_Base/src/interfaces/dto/boot.dto.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L26)

---

### BootUpdate

```ts
type BootUpdate = z.infer<typeof BootUpdateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/boot.dto.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L46)

## Variables

### BootCreateSchema

```ts
const BootCreateSchema: ZodObject<
  {
    bootRetryInterval: ZodOptional<ZodNullable<ZodNumber>>;
    bootWithRejectedVariables: ZodOptional<ZodNullable<ZodBoolean>>;
    changeConfigurationsOnPending: ZodOptional<ZodNullable<ZodBoolean>>;
    getBaseReportOnPending: ZodOptional<ZodNullable<ZodBoolean>>;
    getConfigurationsOnPending: ZodOptional<ZodNullable<ZodBoolean>>;
    heartbeatInterval: ZodOptional<ZodNullable<ZodNumber>>;
    id: ZodString;
    lastBootTime: ZodOptional<ZodNullable<ZodISODateTime>>;
    status: ZodAny;
    statusInfo: ZodOptional<ZodNullable<ZodRecord<ZodString, ZodAny>>>;
    tenantId: ZodOptional<ZodNumber>;
    variablesRejectedOnLastBoot: ZodOptional<ZodNullable<ZodArray<ZodRecord<ZodString, ZodAny>>>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/boot.dto.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L28)

---

### BootProps

```ts
const BootProps: object;
```

Defined in: [00_Base/src/interfaces/dto/boot.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L24)

#### Type Declaration

| Name                                                                                | Type                              | Defined in |
| ----------------------------------------------------------------------------------- | --------------------------------- | ---------- |
| <a id="property-bootretryinterval"></a> `bootRetryInterval`                         | `"bootRetryInterval"`             |            |
| <a id="property-bootwithrejectedvariables"></a> `bootWithRejectedVariables`         | `"bootWithRejectedVariables"`     |            |
| <a id="property-changeconfigurationsonpending"></a> `changeConfigurationsOnPending` | `"changeConfigurationsOnPending"` |            |
| <a id="property-createdat"></a> `createdAt`                                         | `"createdAt"`                     |            |
| <a id="property-getbasereportonpending"></a> `getBaseReportOnPending`               | `"getBaseReportOnPending"`        |            |
| <a id="property-getconfigurationsonpending"></a> `getConfigurationsOnPending`       | `"getConfigurationsOnPending"`    |            |
| <a id="property-heartbeatinterval"></a> `heartbeatInterval`                         | `"heartbeatInterval"`             |            |
| <a id="property-id"></a> `id`                                                       | `"id"`                            |            |
| <a id="property-lastboottime"></a> `lastBootTime`                                   | `"lastBootTime"`                  |            |
| <a id="property-pendingbootsetvariables"></a> `pendingBootSetVariables`             | `"pendingBootSetVariables"`       |            |
| <a id="property-status"></a> `status`                                               | `"status"`                        |            |
| <a id="property-statusinfo"></a> `statusInfo`                                       | `"statusInfo"`                    |            |
| <a id="property-tenant"></a> `tenant`                                               | `"tenant"`                        |            |
| <a id="property-tenantid"></a> `tenantId`                                           | `"tenantId"`                      |            |
| <a id="property-updatedat"></a> `updatedAt`                                         | `"updatedAt"`                     |            |
| <a id="property-variablesrejectedonlastboot"></a> `variablesRejectedOnLastBoot`     | `"variablesRejectedOnLastBoot"`   |            |

---

### BootSchema

```ts
const BootSchema: ZodObject<{
  bootRetryInterval: ZodOptional<ZodNullable<ZodNumber>>;
  bootWithRejectedVariables: ZodOptional<ZodNullable<ZodBoolean>>;
  changeConfigurationsOnPending: ZodOptional<ZodNullable<ZodBoolean>>;
  createdAt: ZodOptional<ZodDate>;
  getBaseReportOnPending: ZodOptional<ZodNullable<ZodBoolean>>;
  getConfigurationsOnPending: ZodOptional<ZodNullable<ZodBoolean>>;
  heartbeatInterval: ZodOptional<ZodNullable<ZodNumber>>;
  id: ZodString;
  lastBootTime: ZodOptional<ZodNullable<ZodISODateTime>>;
  pendingBootSetVariables: ZodOptional<ZodArray<ZodObject<{
     bootConfigId: ZodOptional<ZodNullable<ZodString>>;
     chargingStation: ZodObject<{
        capabilities: ZodOptional<ZodNullable<ZodArray<...>>>;
        chargeBoxSerialNumber: ZodOptional<ZodNullable<ZodString>>;
        chargePointModel: ZodOptional<ZodNullable<ZodString>>;
        chargePointSerialNumber: ZodOptional<ZodNullable<ZodString>>;
        chargePointVendor: ZodOptional<ZodNullable<ZodString>>;
        connectors: ZodOptional<ZodNullable<ZodArray<...>>>;
        coordinates: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        createdAt: ZodOptional<ZodDate>;
        evses: ZodOptional<ZodNullable<ZodArray<...>>>;
        firmwareVersion: ZodOptional<ZodNullable<ZodString>>;
        floorLevel: ZodOptional<ZodNullable<ZodString>>;
        iccid: ZodOptional<ZodNullable<ZodString>>;
        id: ZodString;
        imsi: ZodOptional<ZodNullable<ZodString>>;
        isOnline: ZodBoolean;
        latestOcppMessageTimestamp: ZodOptional<ZodNullable<ZodString>>;
        locationId: ZodOptional<ZodNullable<ZodNumber>>;
        meterSerialNumber: ZodOptional<ZodNullable<ZodString>>;
        meterType: ZodOptional<ZodNullable<ZodString>>;
        networkProfiles: ZodOptional<ZodAny>;
        parkingRestrictions: ZodOptional<ZodNullable<ZodArray<...>>>;
        protocol: ZodOptional<ZodNullable<ZodEnum<...>>>;
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
        use16StatusNotification0: ZodOptional<ZodNullable<ZodDefault<...>>>;
     }, $strip>;
     component: ZodObject<{
        createdAt: ZodOptional<ZodDate>;
        evse: ZodOptional<ZodObject<{
           connectorId: ...;
           createdAt: ...;
           databaseId: ...;
           id: ...;
           tenant: ...;
           tenantId: ...;
           updatedAt: ...;
        }, $strip>>;
        evseDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
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
        variables: ZodOptional<ZodArray<ZodObject<..., ...>>>;
     }, $strip>;
     componentId: ZodOptional<ZodNullable<ZodNumber>>;
     constant: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
     createdAt: ZodOptional<ZodDate>;
     dataType: ZodEnum<typeof DataEnumType>;
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
     generatedAt: ZodISODateTime;
     id: ZodOptional<ZodNumber>;
     mutability: ZodOptional<ZodNullable<ZodEnum<typeof MutabilityEnumType>>>;
     persistent: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
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
     type: ZodOptional<ZodNullable<ZodEnum<typeof AttributeEnumType>>>;
     updatedAt: ZodOptional<ZodDate>;
     value: ZodOptional<ZodNullable<ZodString>>;
     variable: ZodObject<{
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
     }, $strip>;
     variableId: ZodOptional<ZodNullable<ZodNumber>>;
  }, $strip>>>;
  status: ZodAny;
  statusInfo: ZodOptional<ZodNullable<ZodRecord<ZodString, ZodAny>>>;
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
  variablesRejectedOnLastBoot: ZodOptional<ZodNullable<ZodArray<ZodRecord<ZodString, ZodAny>>>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/boot.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L9)

---

### bootSchemas

```ts
const bootSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/boot.dto.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L48)

#### Type Declaration

| Name                                          | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Default value      | Defined in                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-boot"></a> `Boot`             | `ZodObject`\<\{ `bootRetryInterval`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `bootWithRejectedVariables`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `changeConfigurationsOnPending`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `getBaseReportOnPending`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `getConfigurationsOnPending`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `heartbeatInterval`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodString`; `lastBootTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `pendingBootSetVariables`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `bootConfigId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargingStation`: `ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<...\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<...\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<...\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<...\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<...\>\>; `connectors`: `ZodOptional`\<`ZodNullable`\<...\>\>; `coordinates`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evses`: `ZodOptional`\<`ZodNullable`\<...\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<...\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<...\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<...\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<...\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<...\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<...\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<...\>\>; `networkProfiles`: `ZodOptional`\<`ZodAny`\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<...\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<...\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>; `component`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `evse`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<...\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `variables`: `ZodOptional`\<`ZodArray`\<...\>\>; \}, `$strip`\>; `componentId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `constant`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `dataType`: `ZodEnum`\<_typeof_ [`DataEnumType`](../../ocpp/model/2.0.1/enums.md#dataenumtype)\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `databaseId`: `ZodOptional`\<...\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `generatedAt`: `ZodISODateTime`; `id`: `ZodOptional`\<`ZodNumber`\>; `mutability`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`MutabilityEnumType`](../../ocpp/model/2.0.1/enums.md#mutabilityenumtype)\>\>\>; `persistent`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`AttributeEnumType`](../../ocpp/model/2.0.1/enums.md#attributeenumtype)\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `value`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `variable`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<...\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>; `variableId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>\>\>; `status`: `ZodAny`; `statusInfo`: `ZodOptional`\<`ZodNullable`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `variablesRejectedOnLastBoot`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>\>; \}, `$strip`\> | `BootSchema`       | [00_Base/src/interfaces/dto/boot.dto.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L49) |
| <a id="property-bootcreate"></a> `BootCreate` | `ZodObject`\<\{ `bootRetryInterval`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `bootWithRejectedVariables`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `changeConfigurationsOnPending`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `getBaseReportOnPending`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `getConfigurationsOnPending`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `heartbeatInterval`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodString`; `lastBootTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `status`: `ZodAny`; `statusInfo`: `ZodOptional`\<`ZodNullable`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `variablesRejectedOnLastBoot`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `BootCreateSchema` | [00_Base/src/interfaces/dto/boot.dto.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L50) |
| <a id="property-bootupdate"></a> `BootUpdate` | `ZodObject`\<\{ `bootRetryInterval`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>\>; `bootWithRejectedVariables`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>\>; `changeConfigurationsOnPending`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>\>; `getBaseReportOnPending`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>\>; `getConfigurationsOnPending`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>\>; `heartbeatInterval`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>\>; `id`: `ZodNonOptional`\<`ZodOptional`\<`ZodString`\>\>; `lastBootTime`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>\>; `status`: `ZodOptional`\<`ZodAny`\>; `statusInfo`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>\>; `tenantId`: `ZodNonOptional`\<`ZodOptional`\<`ZodOptional`\<`ZodNumber`\>\>\>; `variablesRejectedOnLastBoot`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `BootUpdateSchema` | [00_Base/src/interfaces/dto/boot.dto.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L51) |

---

### BootUpdateSchema

```ts
const BootUpdateSchema: ZodObject<
  {
    bootRetryInterval: ZodOptional<ZodOptional<ZodNullable<ZodNumber>>>;
    bootWithRejectedVariables: ZodOptional<ZodOptional<ZodNullable<ZodBoolean>>>;
    changeConfigurationsOnPending: ZodOptional<ZodOptional<ZodNullable<ZodBoolean>>>;
    getBaseReportOnPending: ZodOptional<ZodOptional<ZodNullable<ZodBoolean>>>;
    getConfigurationsOnPending: ZodOptional<ZodOptional<ZodNullable<ZodBoolean>>>;
    heartbeatInterval: ZodOptional<ZodOptional<ZodNullable<ZodNumber>>>;
    id: ZodNonOptional<ZodOptional<ZodString>>;
    lastBootTime: ZodOptional<ZodOptional<ZodNullable<ZodISODateTime>>>;
    status: ZodOptional<ZodAny>;
    statusInfo: ZodOptional<ZodOptional<ZodNullable<ZodRecord<ZodString, ZodAny>>>>;
    tenantId: ZodNonOptional<ZodOptional<ZodOptional<ZodNumber>>>;
    variablesRejectedOnLastBoot: ZodOptional<
      ZodOptional<ZodNullable<ZodArray<ZodRecord<ZodString, ZodAny>>>>
    >;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/boot.dto.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/boot.dto.ts#L37)
