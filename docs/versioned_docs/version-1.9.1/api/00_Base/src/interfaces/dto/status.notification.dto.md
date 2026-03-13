[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/status.notification.dto

# 00_Base/src/interfaces/dto/status.notification.dto

## Type Aliases

### StatusNotificationCreate

```ts
type StatusNotificationCreate = z.infer<typeof StatusNotificationCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/status.notification.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/status.notification.dto.ts#L36)

---

### StatusNotificationDto

```ts
type StatusNotificationDto = z.infer<typeof StatusNotificationSchema>;
```

Defined in: [00_Base/src/interfaces/dto/status.notification.dto.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/status.notification.dto.ts#L26)

## Variables

### StatusNotificationCreateSchema

```ts
const StatusNotificationCreateSchema: ZodObject<
  {
    connectorId: ZodNumber;
    connectorStatus: ZodEnum<{
      Available: 'Available';
      Charging: 'Charging';
      Faulted: 'Faulted';
      Finishing: 'Finishing';
      Occupied: 'Occupied';
      Preparing: 'Preparing';
      Reserved: 'Reserved';
      SuspendedEV: 'SuspendedEV';
      SuspendedEVSE: 'SuspendedEVSE';
      Unavailable: 'Unavailable';
      Unknown: 'Unknown';
    }>;
    errorCode: ZodOptional<ZodNullable<ZodString>>;
    evseId: ZodOptional<ZodNullable<ZodNumber>>;
    info: ZodOptional<ZodNullable<ZodString>>;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    timestamp: ZodOptional<ZodNullable<ZodISODateTime>>;
    vendorErrorCode: ZodOptional<ZodNullable<ZodString>>;
    vendorId: ZodOptional<ZodNullable<ZodString>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/status.notification.dto.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/status.notification.dto.ts#L28)

---

### StatusNotificationProps

```ts
const StatusNotificationProps: object;
```

Defined in: [00_Base/src/interfaces/dto/status.notification.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/status.notification.dto.ts#L24)

#### Type Declaration

| Name                                                    | Type                | Defined in |
| ------------------------------------------------------- | ------------------- | ---------- |
| <a id="property-chargingstation"></a> `chargingStation` | `"chargingStation"` |            |
| <a id="property-connectorid"></a> `connectorId`         | `"connectorId"`     |            |
| <a id="property-connectorstatus"></a> `connectorStatus` | `"connectorStatus"` |            |
| <a id="property-createdat"></a> `createdAt`             | `"createdAt"`       |            |
| <a id="property-errorcode"></a> `errorCode`             | `"errorCode"`       |            |
| <a id="property-evseid"></a> `evseId`                   | `"evseId"`          |            |
| <a id="property-id"></a> `id`                           | `"id"`              |            |
| <a id="property-info"></a> `info`                       | `"info"`            |            |
| <a id="property-stationid"></a> `stationId`             | `"stationId"`       |            |
| <a id="property-tenant"></a> `tenant`                   | `"tenant"`          |            |
| <a id="property-tenantid"></a> `tenantId`               | `"tenantId"`        |            |
| <a id="property-timestamp"></a> `timestamp`             | `"timestamp"`       |            |
| <a id="property-updatedat"></a> `updatedAt`             | `"updatedAt"`       |            |
| <a id="property-vendorerrorcode"></a> `vendorErrorCode` | `"vendorErrorCode"` |            |
| <a id="property-vendorid"></a> `vendorId`               | `"vendorId"`        |            |

---

### StatusNotificationSchema

```ts
const StatusNotificationSchema: ZodObject<{
  chargingStation: ZodOptional<ZodObject<{
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
  connectorId: ZodNumber;
  connectorStatus: ZodEnum<{
     Available: "Available";
     Charging: "Charging";
     Faulted: "Faulted";
     Finishing: "Finishing";
     Occupied: "Occupied";
     Preparing: "Preparing";
     Reserved: "Reserved";
     SuspendedEV: "SuspendedEV";
     SuspendedEVSE: "SuspendedEVSE";
     Unavailable: "Unavailable";
     Unknown: "Unknown";
  }>;
  createdAt: ZodOptional<ZodDate>;
  errorCode: ZodOptional<ZodNullable<ZodString>>;
  evseId: ZodOptional<ZodNullable<ZodNumber>>;
  id: ZodOptional<ZodNumber>;
  info: ZodOptional<ZodNullable<ZodString>>;
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
  timestamp: ZodOptional<ZodNullable<ZodISODateTime>>;
  updatedAt: ZodOptional<ZodDate>;
  vendorErrorCode: ZodOptional<ZodNullable<ZodString>>;
  vendorId: ZodOptional<ZodNullable<ZodString>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/status.notification.dto.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/status.notification.dto.ts#L10)

---

### statusNotificationSchemas

```ts
const statusNotificationSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/status.notification.dto.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/status.notification.dto.ts#L38)

#### Type Declaration

| Name                                                                      | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Default value                    | Defined in                                                                                                                                                                                                      |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-statusnotification"></a> `StatusNotification`             | `ZodObject`\<\{ `chargingStation`: `ZodOptional`\<`ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `ChargingPreferencesCapable`: ...; `ChargingProfileCapable`: ...; `ChipCardSupport`: ...; `ContactlessCardSupport`: ...; `CreditCardPayable`: ...; `DebitCardPayable`: ...; `PEDTerminal`: ...; `RemoteStartStopCapable`: ...; `Reservable`: ...; `RFIDReader`: ...; `StartSessionConnectorRequired`: ...; `TokenGroupCapable`: ...; `UnlockCapable`: ...; \}\>\>\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `chargingStation`: ...; `connectorId`: ...; `createdAt`: ...; `errorCode`: ...; `evse`: ...; `evseId`: ...; `evseTypeConnectorId`: ...; `format`: ...; `id`: ...; `info`: ...; `maximumAmperage`: ...; `maximumPowerWatts`: ...; `maximumVoltage`: ...; `powerType`: ...; `stationId`: ...; `status`: ...; `tariff`: ...; `tariffId`: ...; `tenant`: ...; `tenantId`: ...; `termsAndConditionsUrl`: ...; `timestamp`: ...; `type`: ...; `updatedAt`: ...; `vendorErrorCode`: ...; `vendorId`: ...; \}, `$strip`\>\>\>\>; `coordinates`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `coordinates`: `ZodArray`\<...\>; `type`: `ZodLiteral`\<...\>; \}, `$strip`\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evses`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `connectors`: ...; `createdAt`: ...; `evseId`: ...; `evseTypeId`: ...; `id`: ...; `physicalReference`: ...; `removed`: ...; `stationId`: ...; `tenant`: ...; `tenantId`: ...; `updatedAt`: ...; \}, `$strip`\>\>\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `networkProfiles`: `ZodOptional`\<`ZodAny`\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `Customers`: ...; `Disabled`: ...; `EVOnly`: ...; `Motorcycles`: ...; `Plugged`: ...; \}\>\>\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; \}, `$strip`\>\>; `connectorId`: `ZodNumber`; `connectorStatus`: `ZodEnum`\<\{ `Available`: `"Available"`; `Charging`: `"Charging"`; `Faulted`: `"Faulted"`; `Finishing`: `"Finishing"`; `Occupied`: `"Occupied"`; `Preparing`: `"Preparing"`; `Reserved`: `"Reserved"`; `SuspendedEV`: `"SuspendedEV"`; `SuspendedEVSE`: `"SuspendedEVSE"`; `Unavailable`: `"Unavailable"`; `Unknown`: `"Unknown"`; \}\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `errorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `info`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `vendorErrorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `vendorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\> | `StatusNotificationSchema`       | [00_Base/src/interfaces/dto/status.notification.dto.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/status.notification.dto.ts#L39) |
| <a id="property-statusnotificationcreate"></a> `StatusNotificationCreate` | `ZodObject`\<\{ `connectorId`: `ZodNumber`; `connectorStatus`: `ZodEnum`\<\{ `Available`: `"Available"`; `Charging`: `"Charging"`; `Faulted`: `"Faulted"`; `Finishing`: `"Finishing"`; `Occupied`: `"Occupied"`; `Preparing`: `"Preparing"`; `Reserved`: `"Reserved"`; `SuspendedEV`: `"SuspendedEV"`; `SuspendedEVSE`: `"SuspendedEVSE"`; `Unavailable`: `"Unavailable"`; `Unknown`: `"Unknown"`; \}\>; `errorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `info`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `vendorErrorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `vendorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `StatusNotificationCreateSchema` | [00_Base/src/interfaces/dto/status.notification.dto.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/status.notification.dto.ts#L40) |
