[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/variable.status.dto

# 00_Base/src/interfaces/dto/variable.status.dto

## Type Aliases

### VariableStatusCreate

```ts
type VariableStatusCreate = z.infer<typeof VariableStatusCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.status.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.status.dto.ts#L31)

---

### VariableStatusDto

```ts
type VariableStatusDto = z.infer<typeof VariableStatusSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.status.dto.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.status.dto.ts#L21)

## Variables

### VariableStatusCreateSchema

```ts
const VariableStatusCreateSchema: ZodObject<
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
    value: ZodString;
    variableAttributeId: ZodOptional<ZodNullable<ZodNumber>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/variable.status.dto.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.status.dto.ts#L23)

---

### VariableStatusProps

```ts
const VariableStatusProps: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.status.dto.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.status.dto.ts#L19)

#### Type Declaration

| Name                                                            | Type                    | Defined in |
| --------------------------------------------------------------- | ----------------------- | ---------- |
| <a id="property-createdat"></a> `createdAt`                     | `"createdAt"`           |            |
| <a id="property-id"></a> `id`                                   | `"id"`                  |            |
| <a id="property-status"></a> `status`                           | `"status"`              |            |
| <a id="property-statusinfo"></a> `statusInfo`                   | `"statusInfo"`          |            |
| <a id="property-tenant"></a> `tenant`                           | `"tenant"`              |            |
| <a id="property-tenantid"></a> `tenantId`                       | `"tenantId"`            |            |
| <a id="property-updatedat"></a> `updatedAt`                     | `"updatedAt"`           |            |
| <a id="property-value"></a> `value`                             | `"value"`               |            |
| <a id="property-variable"></a> `variable`                       | `"variable"`            |            |
| <a id="property-variableattributeid"></a> `variableAttributeId` | `"variableAttributeId"` |            |

---

### VariableStatusSchema

```ts
const VariableStatusSchema: ZodObject<{
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
  value: ZodString;
  variable: ZodObject<{
     bootConfigId: ZodOptional<ZodNullable<ZodString>>;
     chargingStation: ZodObject<{
        capabilities: ZodOptional<ZodNullable<ZodArray<ZodEnum<{
           ChargingPreferencesCapable: ...;
           ChargingProfileCapable: ...;
           ChipCardSupport: ...;
           ContactlessCardSupport: ...;
           CreditCardPayable: ...;
           DebitCardPayable: ...;
           PEDTerminal: ...;
           RemoteStartStopCapable: ...;
           Reservable: ...;
           RFIDReader: ...;
           StartSessionConnectorRequired: ...;
           TokenGroupCapable: ...;
           UnlockCapable: ...;
        }>>>>;
        chargeBoxSerialNumber: ZodOptional<ZodNullable<ZodString>>;
        chargePointModel: ZodOptional<ZodNullable<ZodString>>;
        chargePointSerialNumber: ZodOptional<ZodNullable<ZodString>>;
        chargePointVendor: ZodOptional<ZodNullable<ZodString>>;
        connectors: ZodOptional<ZodNullable<ZodArray<ZodObject<{
           chargingStation: ...;
           connectorId: ...;
           createdAt: ...;
           errorCode: ...;
           evse: ...;
           evseId: ...;
           evseTypeConnectorId: ...;
           format: ...;
           id: ...;
           info: ...;
           maximumAmperage: ...;
           maximumPowerWatts: ...;
           maximumVoltage: ...;
           powerType: ...;
           stationId: ...;
           status: ...;
           tariff: ...;
           tariffId: ...;
           tenant: ...;
           tenantId: ...;
           termsAndConditionsUrl: ...;
           timestamp: ...;
           type: ...;
           updatedAt: ...;
           vendorErrorCode: ...;
           vendorId: ...;
        }, $strip>>>>;
        coordinates: ZodOptional<ZodNullable<ZodObject<{
           coordinates: ZodArray<...>;
           type: ZodLiteral<...>;
        }, $strip>>>;
        createdAt: ZodOptional<ZodDate>;
        evses: ZodOptional<ZodNullable<ZodArray<ZodObject<{
           connectors: ...;
           createdAt: ...;
           evseId: ...;
           evseTypeId: ...;
           id: ...;
           physicalReference: ...;
           removed: ...;
           stationId: ...;
           tenant: ...;
           tenantId: ...;
           updatedAt: ...;
        }, $strip>>>>;
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
        parkingRestrictions: ZodOptional<ZodNullable<ZodArray<ZodEnum<{
           Customers: ...;
           Disabled: ...;
           EVOnly: ...;
           Motorcycles: ...;
           Plugged: ...;
        }>>>>;
        protocol: ZodOptional<ZodNullable<ZodEnum<typeof OCPPVersion>>>;
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
        use16StatusNotification0: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
     }, $strip>;
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
     constant: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
     createdAt: ZodOptional<ZodDate>;
     dataType: ZodEnum<typeof DataEnumType>;
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
     generatedAt: ZodISODateTime;
     id: ZodOptional<ZodNumber>;
     mutability: ZodOptional<ZodNullable<ZodEnum<typeof MutabilityEnumType>>>;
     persistent: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
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
     type: ZodOptional<ZodNullable<ZodEnum<typeof AttributeEnumType>>>;
     updatedAt: ZodOptional<ZodDate>;
     value: ZodOptional<ZodNullable<ZodString>>;
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
  variableAttributeId: ZodOptional<ZodNullable<ZodNumber>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/variable.status.dto.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.status.dto.ts#L10)

---

### variableStatusSchemas

```ts
const variableStatusSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.status.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.status.dto.ts#L33)

#### Type Declaration

| Name                                                              | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Default value                | Defined in                                                                                                                                                                                              |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-variablestatus"></a> `VariableStatus`             | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `status`: `ZodString`; `statusInfo`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `additionalInfo`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `reasonCode`: `ZodString`; \}, `$strip`\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `value`: `ZodString`; `variable`: `ZodObject`\<\{ `bootConfigId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargingStation`: `ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<...\>\>\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<..., ...\>\>\>\>; `coordinates`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `coordinates`: ...; `type`: ...; \}, `$strip`\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evses`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<..., ...\>\>\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `networkProfiles`: `ZodOptional`\<`ZodAny`\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<...\>\>\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; \}, `$strip`\>; `component`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `databaseId`: `ZodOptional`\<...\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `variables`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `createdAt`: ...; `id`: ...; `instance`: ...; `name`: ...; `tenant`: ...; `tenantId`: ...; `updatedAt`: ...; \}, `$strip`\>\>\>; \}, `$strip`\>; `componentId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `constant`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `dataType`: `ZodEnum`\<_typeof_ [`DataEnumType`](../../ocpp/model/2.0.1/enums.md#dataenumtype)\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `generatedAt`: `ZodISODateTime`; `id`: `ZodOptional`\<`ZodNumber`\>; `mutability`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`MutabilityEnumType`](../../ocpp/model/2.0.1/enums.md#mutabilityenumtype)\>\>\>; `persistent`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`AttributeEnumType`](../../ocpp/model/2.0.1/enums.md#attributeenumtype)\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `value`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `variable`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>; `variableId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>; `variableAttributeId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\> | `VariableStatusSchema`       | [00_Base/src/interfaces/dto/variable.status.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.status.dto.ts#L34) |
| <a id="property-variablestatuscreate"></a> `VariableStatusCreate` | `ZodObject`\<\{ `status`: `ZodString`; `statusInfo`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `additionalInfo`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `reasonCode`: `ZodString`; \}, `$strip`\>\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `value`: `ZodString`; `variableAttributeId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `VariableStatusCreateSchema` | [00_Base/src/interfaces/dto/variable.status.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.status.dto.ts#L35) |
