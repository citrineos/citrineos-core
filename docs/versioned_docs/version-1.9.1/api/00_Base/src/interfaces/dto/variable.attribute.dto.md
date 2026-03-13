[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/variable.attribute.dto

# 00_Base/src/interfaces/dto/variable.attribute.dto

## Type Aliases

### VariableAttributeCreate

```ts
type VariableAttributeCreate = z.infer<typeof VariableAttributeCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.attribute.dto.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.attribute.dto.ts#L50)

---

### VariableAttributeDto

```ts
type VariableAttributeDto = z.infer<typeof VariableAttributeSchema>;
```

Defined in: [00_Base/src/interfaces/dto/variable.attribute.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.attribute.dto.ts#L35)

## Variables

### VariableAttributeCreateSchema

```ts
const VariableAttributeCreateSchema: ZodObject<
  {
    bootConfigId: ZodOptional<ZodNullable<ZodString>>;
    componentId: ZodOptional<ZodNullable<ZodNumber>>;
    constant: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
    dataType: ZodEnum<typeof DataEnumType>;
    evseDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
    generatedAt: ZodISODateTime;
    mutability: ZodOptional<ZodNullable<ZodEnum<typeof MutabilityEnumType>>>;
    persistent: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    type: ZodOptional<ZodNullable<ZodEnum<typeof AttributeEnumType>>>;
    value: ZodOptional<ZodNullable<ZodString>>;
    variableId: ZodOptional<ZodNullable<ZodNumber>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/variable.attribute.dto.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.attribute.dto.ts#L37)

---

### VariableAttributeProps

```ts
const VariableAttributeProps: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.attribute.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.attribute.dto.ts#L33)

#### Type Declaration

| Name                                                    | Type                | Defined in |
| ------------------------------------------------------- | ------------------- | ---------- |
| <a id="property-bootconfigid"></a> `bootConfigId`       | `"bootConfigId"`    |            |
| <a id="property-chargingstation"></a> `chargingStation` | `"chargingStation"` |            |
| <a id="property-component"></a> `component`             | `"component"`       |            |
| <a id="property-componentid"></a> `componentId`         | `"componentId"`     |            |
| <a id="property-constant"></a> `constant`               | `"constant"`        |            |
| <a id="property-createdat"></a> `createdAt`             | `"createdAt"`       |            |
| <a id="property-datatype"></a> `dataType`               | `"dataType"`        |            |
| <a id="property-evse"></a> `evse`                       | `"evse"`            |            |
| <a id="property-evsedatabaseid"></a> `evseDatabaseId`   | `"evseDatabaseId"`  |            |
| <a id="property-generatedat"></a> `generatedAt`         | `"generatedAt"`     |            |
| <a id="property-id"></a> `id`                           | `"id"`              |            |
| <a id="property-mutability"></a> `mutability`           | `"mutability"`      |            |
| <a id="property-persistent"></a> `persistent`           | `"persistent"`      |            |
| <a id="property-stationid"></a> `stationId`             | `"stationId"`       |            |
| <a id="property-tenant"></a> `tenant`                   | `"tenant"`          |            |
| <a id="property-tenantid"></a> `tenantId`               | `"tenantId"`        |            |
| <a id="property-type"></a> `type`                       | `"type"`            |            |
| <a id="property-updatedat"></a> `updatedAt`             | `"updatedAt"`       |            |
| <a id="property-value"></a> `value`                     | `"value"`           |            |
| <a id="property-variable"></a> `variable`               | `"variable"`        |            |
| <a id="property-variableid"></a> `variableId`           | `"variableId"`      |            |

---

### VariableAttributeSchema

```ts
const VariableAttributeSchema: ZodObject<{
  bootConfigId: ZodOptional<ZodNullable<ZodString>>;
  chargingStation: ZodObject<{
     capabilities: ZodOptional<ZodNullable<ZodArray<ZodEnum<{
        ChargingPreferencesCapable: "ChargingPreferencesCapable";
        ChargingProfileCapable: "ChargingProfileCapable";
        ChipCardSupport: "ChipCardSupport";
        ContactlessCardSupport: "ContactlessCardSupport";
        CreditCardPayable: "CreditCardPayable";
        DebitCardPayable: "DebitCardPayable";
        PEDTerminal: "PEDTerminal";
        RemoteStartStopCapable: "RemoteStartStopCapable";
        Reservable: "Reservable";
        RFIDReader: "RFIDReader";
        StartSessionConnectorRequired: "StartSessionConnectorRequired";
        TokenGroupCapable: "TokenGroupCapable";
        UnlockCapable: "UnlockCapable";
     }>>>>;
     chargeBoxSerialNumber: ZodOptional<ZodNullable<ZodString>>;
     chargePointModel: ZodOptional<ZodNullable<ZodString>>;
     chargePointSerialNumber: ZodOptional<ZodNullable<ZodString>>;
     chargePointVendor: ZodOptional<ZodNullable<ZodString>>;
     connectors: ZodOptional<ZodNullable<ZodArray<ZodObject<{
        chargingStation: ZodOptional<ZodAny>;
        connectorId: ZodNumber;
        createdAt: ZodOptional<ZodDate>;
        errorCode: ZodOptional<ZodNullable<...>>;
        evse: ZodOptional<ZodAny>;
        evseId: ZodNumber;
        evseTypeConnectorId: ZodOptional<ZodNumber>;
        format: ZodOptional<ZodNullable<...>>;
        id: ZodOptional<ZodNumber>;
        info: ZodOptional<ZodNullable<...>>;
        maximumAmperage: ZodOptional<ZodNullable<...>>;
        maximumPowerWatts: ZodOptional<ZodNullable<...>>;
        maximumVoltage: ZodOptional<ZodNullable<...>>;
        powerType: ZodOptional<ZodNullable<...>>;
        stationId: ZodString;
        status: ZodOptional<ZodNullable<...>>;
        tariff: ZodOptional<ZodNullable<...>>;
        tariffId: ZodOptional<ZodNullable<...>>;
        tenant: ZodOptional<ZodAny>;
        tenantId: ZodOptional<ZodNumber>;
        termsAndConditionsUrl: ZodOptional<ZodNullable<...>>;
        timestamp: ZodISODateTime;
        type: ZodOptional<ZodNullable<...>>;
        updatedAt: ZodOptional<ZodDate>;
        vendorErrorCode: ZodOptional<ZodNullable<...>>;
        vendorId: ZodOptional<ZodNullable<...>>;
     }, $strip>>>>;
     coordinates: ZodOptional<ZodNullable<ZodObject<{
        coordinates: ZodArray<ZodNumber>;
        type: ZodLiteral<"Point">;
     }, $strip>>>;
     createdAt: ZodOptional<ZodDate>;
     evses: ZodOptional<ZodNullable<ZodArray<ZodObject<{
        connectors: ZodOptional<ZodNullable<...>>;
        createdAt: ZodOptional<ZodDate>;
        evseId: ZodString;
        evseTypeId: ZodOptional<ZodNumber>;
        id: ZodOptional<ZodNumber>;
        physicalReference: ZodOptional<ZodNullable<...>>;
        removed: ZodOptional<ZodBoolean>;
        stationId: ZodString;
        tenant: ZodOptional<ZodObject<..., ...>>;
        tenantId: ZodOptional<ZodNumber>;
        updatedAt: ZodOptional<ZodDate>;
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
        Customers: "Customers";
        Disabled: "Disabled";
        EVOnly: "EVOnly";
        Motorcycles: "Motorcycles";
        Plugged: "Plugged";
     }>>>>;
     protocol: ZodOptional<ZodNullable<ZodEnum<typeof OCPPVersion>>>;
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
     use16StatusNotification0: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
  }, $strip>;
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
  constant: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
  createdAt: ZodOptional<ZodDate>;
  dataType: ZodEnum<typeof DataEnumType>;
  evse: ZodOptional<ZodObject<{
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
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
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
  type: ZodOptional<ZodNullable<ZodEnum<typeof AttributeEnumType>>>;
  updatedAt: ZodOptional<ZodDate>;
  value: ZodOptional<ZodNullable<ZodString>>;
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

Defined in: [00_Base/src/interfaces/dto/variable.attribute.dto.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.attribute.dto.ts#L13)

---

### variableAttributeSchemas

```ts
const variableAttributeSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/variable.attribute.dto.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.attribute.dto.ts#L52)

#### Type Declaration

| Name                                                                    | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Default value                   | Defined in                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-variableattribute"></a> `VariableAttribute`             | `ZodObject`\<\{ `bootConfigId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargingStation`: `ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `ChargingPreferencesCapable`: `"ChargingPreferencesCapable"`; `ChargingProfileCapable`: `"ChargingProfileCapable"`; `ChipCardSupport`: `"ChipCardSupport"`; `ContactlessCardSupport`: `"ContactlessCardSupport"`; `CreditCardPayable`: `"CreditCardPayable"`; `DebitCardPayable`: `"DebitCardPayable"`; `PEDTerminal`: `"PEDTerminal"`; `RemoteStartStopCapable`: `"RemoteStartStopCapable"`; `Reservable`: `"Reservable"`; `RFIDReader`: `"RFIDReader"`; `StartSessionConnectorRequired`: `"StartSessionConnectorRequired"`; `TokenGroupCapable`: `"TokenGroupCapable"`; `UnlockCapable`: `"UnlockCapable"`; \}\>\>\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `chargingStation`: `ZodOptional`\<...\>; `connectorId`: `ZodNumber`; `createdAt`: `ZodOptional`\<...\>; `errorCode`: `ZodOptional`\<...\>; `evse`: `ZodOptional`\<...\>; `evseId`: `ZodNumber`; `evseTypeConnectorId`: `ZodOptional`\<...\>; `format`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `info`: `ZodOptional`\<...\>; `maximumAmperage`: `ZodOptional`\<...\>; `maximumPowerWatts`: `ZodOptional`\<...\>; `maximumVoltage`: `ZodOptional`\<...\>; `powerType`: `ZodOptional`\<...\>; `stationId`: `ZodString`; `status`: `ZodOptional`\<...\>; `tariff`: `ZodOptional`\<...\>; `tariffId`: `ZodOptional`\<...\>; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `termsAndConditionsUrl`: `ZodOptional`\<...\>; `timestamp`: `ZodISODateTime`; `type`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `vendorErrorCode`: `ZodOptional`\<...\>; `vendorId`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>\>; `coordinates`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `coordinates`: `ZodArray`\<`ZodNumber`\>; `type`: `ZodLiteral`\<`"Point"`\>; \}, `$strip`\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evses`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `connectors`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `evseId`: `ZodString`; `evseTypeId`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `physicalReference`: `ZodOptional`\<...\>; `removed`: `ZodOptional`\<...\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `networkProfiles`: `ZodOptional`\<`ZodAny`\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `Customers`: `"Customers"`; `Disabled`: `"Disabled"`; `EVOnly`: `"EVOnly"`; `Motorcycles`: `"Motorcycles"`; `Plugged`: `"Plugged"`; \}\>\>\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; \}, `$strip`\>; `component`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `variables`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<...\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; \}, `$strip`\>; `componentId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `constant`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `dataType`: `ZodEnum`\<_typeof_ [`DataEnumType`](../../ocpp/model/2.0.1/enums.md#dataenumtype)\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `generatedAt`: `ZodISODateTime`; `id`: `ZodOptional`\<`ZodNumber`\>; `mutability`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`MutabilityEnumType`](../../ocpp/model/2.0.1/enums.md#mutabilityenumtype)\>\>\>; `persistent`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`AttributeEnumType`](../../ocpp/model/2.0.1/enums.md#attributeenumtype)\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `value`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `variable`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>; `variableId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\> | `VariableAttributeSchema`       | [00_Base/src/interfaces/dto/variable.attribute.dto.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.attribute.dto.ts#L53) |
| <a id="property-variableattributecreate"></a> `VariableAttributeCreate` | `ZodObject`\<\{ `bootConfigId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `componentId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `constant`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `dataType`: `ZodEnum`\<_typeof_ [`DataEnumType`](../../ocpp/model/2.0.1/enums.md#dataenumtype)\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `generatedAt`: `ZodISODateTime`; `mutability`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`MutabilityEnumType`](../../ocpp/model/2.0.1/enums.md#mutabilityenumtype)\>\>\>; `persistent`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`AttributeEnumType`](../../ocpp/model/2.0.1/enums.md#attributeenumtype)\>\>\>; `value`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `variableId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `VariableAttributeCreateSchema` | [00_Base/src/interfaces/dto/variable.attribute.dto.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/variable.attribute.dto.ts#L54) |
