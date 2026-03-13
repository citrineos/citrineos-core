[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/charging.station.sequence.dto

# 00_Base/src/interfaces/dto/charging.station.sequence.dto

## Type Aliases

### ChargingStationSequenceCreate

```ts
type ChargingStationSequenceCreate = z.infer<typeof ChargingStationSequenceCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.sequence.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.sequence.dto.ts#L30)

---

### ChargingStationSequenceDto

```ts
type ChargingStationSequenceDto = z.infer<typeof ChargingStationSequenceSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.sequence.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.sequence.dto.ts#L20)

## Variables

### ChargingStationSequenceCreateSchema

```ts
const ChargingStationSequenceCreateSchema: ZodObject<
  {
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    type: ZodEnum<{
      customerInformation: 'customerInformation';
      getBaseReport: 'getBaseReport';
      getChargingProfiles: 'getChargingProfiles';
      getDisplayMessages: 'getDisplayMessages';
      getLog: 'getLog';
      getMonitoringReport: 'getMonitoringReport';
      getReport: 'getReport';
      publishFirmware: 'publishFirmware';
      remoteStartId: 'remoteStartId';
      transactionId: 'transactionId';
      updateFirmware: 'updateFirmware';
    }>;
    value: ZodDefault<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.sequence.dto.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.sequence.dto.ts#L22)

---

### ChargingStationSequenceProps

```ts
const ChargingStationSequenceProps: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.sequence.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.sequence.dto.ts#L18)

#### Type Declaration

| Name                                        | Type          | Defined in |
| ------------------------------------------- | ------------- | ---------- |
| <a id="property-createdat"></a> `createdAt` | `"createdAt"` |            |
| <a id="property-id"></a> `id`               | `"id"`        |            |
| <a id="property-station"></a> `station`     | `"station"`   |            |
| <a id="property-stationid"></a> `stationId` | `"stationId"` |            |
| <a id="property-tenant"></a> `tenant`       | `"tenant"`    |            |
| <a id="property-tenantid"></a> `tenantId`   | `"tenantId"`  |            |
| <a id="property-type"></a> `type`           | `"type"`      |            |
| <a id="property-updatedat"></a> `updatedAt` | `"updatedAt"` |            |
| <a id="property-value"></a> `value`         | `"value"`     |            |

---

### ChargingStationSequenceSchema

```ts
const ChargingStationSequenceSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  station: ZodOptional<ZodObject<{
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
        chargingStation: ZodOptional<...>;
        connectorId: ZodNumber;
        createdAt: ZodOptional<...>;
        errorCode: ZodOptional<...>;
        evse: ZodOptional<...>;
        evseId: ZodNumber;
        evseTypeConnectorId: ZodOptional<...>;
        format: ZodOptional<...>;
        id: ZodOptional<...>;
        info: ZodOptional<...>;
        maximumAmperage: ZodOptional<...>;
        maximumPowerWatts: ZodOptional<...>;
        maximumVoltage: ZodOptional<...>;
        powerType: ZodOptional<...>;
        stationId: ZodString;
        status: ZodOptional<...>;
        tariff: ZodOptional<...>;
        tariffId: ZodOptional<...>;
        tenant: ZodOptional<...>;
        tenantId: ZodOptional<...>;
        termsAndConditionsUrl: ZodOptional<...>;
        timestamp: ZodISODateTime;
        type: ZodOptional<...>;
        updatedAt: ZodOptional<...>;
        vendorErrorCode: ZodOptional<...>;
        vendorId: ZodOptional<...>;
     }, $strip>>>>;
     coordinates: ZodOptional<ZodNullable<ZodObject<{
        coordinates: ZodArray<ZodNumber>;
        type: ZodLiteral<"Point">;
     }, $strip>>>;
     createdAt: ZodOptional<ZodDate>;
     evses: ZodOptional<ZodNullable<ZodArray<ZodObject<{
        connectors: ZodOptional<...>;
        createdAt: ZodOptional<...>;
        evseId: ZodString;
        evseTypeId: ZodOptional<...>;
        id: ZodOptional<...>;
        physicalReference: ZodOptional<...>;
        removed: ZodOptional<...>;
        stationId: ZodString;
        tenant: ZodOptional<...>;
        tenantId: ZodOptional<...>;
        updatedAt: ZodOptional<...>;
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
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     updatedAt: ZodOptional<ZodDate>;
     use16StatusNotification0: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
  }, $strip>>;
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
  type: ZodEnum<{
     customerInformation: "customerInformation";
     getBaseReport: "getBaseReport";
     getChargingProfiles: "getChargingProfiles";
     getDisplayMessages: "getDisplayMessages";
     getLog: "getLog";
     getMonitoringReport: "getMonitoringReport";
     getReport: "getReport";
     publishFirmware: "publishFirmware";
     remoteStartId: "remoteStartId";
     transactionId: "transactionId";
     updateFirmware: "updateFirmware";
  }>;
  updatedAt: ZodOptional<ZodDate>;
  value: ZodDefault<ZodNumber>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.sequence.dto.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.sequence.dto.ts#L10)

---

### chargingStationSequenceSchemas

```ts
const chargingStationSequenceSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.sequence.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.sequence.dto.ts#L32)

#### Type Declaration

| Name                                                                                | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Default value                         | Defined in                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-chargingstationsequence"></a> `ChargingStationSequence`             | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `station`: `ZodOptional`\<`ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `ChargingPreferencesCapable`: ...; `ChargingProfileCapable`: ...; `ChipCardSupport`: ...; `ContactlessCardSupport`: ...; `CreditCardPayable`: ...; `DebitCardPayable`: ...; `PEDTerminal`: ...; `RemoteStartStopCapable`: ...; `Reservable`: ...; `RFIDReader`: ...; `StartSessionConnectorRequired`: ...; `TokenGroupCapable`: ...; `UnlockCapable`: ...; \}\>\>\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `chargingStation`: ...; `connectorId`: ...; `createdAt`: ...; `errorCode`: ...; `evse`: ...; `evseId`: ...; `evseTypeConnectorId`: ...; `format`: ...; `id`: ...; `info`: ...; `maximumAmperage`: ...; `maximumPowerWatts`: ...; `maximumVoltage`: ...; `powerType`: ...; `stationId`: ...; `status`: ...; `tariff`: ...; `tariffId`: ...; `tenant`: ...; `tenantId`: ...; `termsAndConditionsUrl`: ...; `timestamp`: ...; `type`: ...; `updatedAt`: ...; `vendorErrorCode`: ...; `vendorId`: ...; \}, `$strip`\>\>\>\>; `coordinates`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `coordinates`: `ZodArray`\<...\>; `type`: `ZodLiteral`\<...\>; \}, `$strip`\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evses`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `connectors`: ...; `createdAt`: ...; `evseId`: ...; `evseTypeId`: ...; `id`: ...; `physicalReference`: ...; `removed`: ...; `stationId`: ...; `tenant`: ...; `tenantId`: ...; `updatedAt`: ...; \}, `$strip`\>\>\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `networkProfiles`: `ZodOptional`\<`ZodAny`\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `Customers`: ...; `Disabled`: ...; `EVOnly`: ...; `Motorcycles`: ...; `Plugged`: ...; \}\>\>\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; \}, `$strip`\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodEnum`\<\{ `customerInformation`: `"customerInformation"`; `getBaseReport`: `"getBaseReport"`; `getChargingProfiles`: `"getChargingProfiles"`; `getDisplayMessages`: `"getDisplayMessages"`; `getLog`: `"getLog"`; `getMonitoringReport`: `"getMonitoringReport"`; `getReport`: `"getReport"`; `publishFirmware`: `"publishFirmware"`; `remoteStartId`: `"remoteStartId"`; `transactionId`: `"transactionId"`; `updateFirmware`: `"updateFirmware"`; \}\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `value`: `ZodDefault`\<`ZodNumber`\>; \}, `$strip`\> | `ChargingStationSequenceSchema`       | [00_Base/src/interfaces/dto/charging.station.sequence.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.sequence.dto.ts#L33) |
| <a id="property-chargingstationsequencecreate"></a> `ChargingStationSequenceCreate` | `ZodObject`\<\{ `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodEnum`\<\{ `customerInformation`: `"customerInformation"`; `getBaseReport`: `"getBaseReport"`; `getChargingProfiles`: `"getChargingProfiles"`; `getDisplayMessages`: `"getDisplayMessages"`; `getLog`: `"getLog"`; `getMonitoringReport`: `"getMonitoringReport"`; `getReport`: `"getReport"`; `publishFirmware`: `"publishFirmware"`; `remoteStartId`: `"remoteStartId"`; `transactionId`: `"transactionId"`; `updateFirmware`: `"updateFirmware"`; \}\>; `value`: `ZodDefault`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `ChargingStationSequenceCreateSchema` | [00_Base/src/interfaces/dto/charging.station.sequence.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.sequence.dto.ts#L34) |
