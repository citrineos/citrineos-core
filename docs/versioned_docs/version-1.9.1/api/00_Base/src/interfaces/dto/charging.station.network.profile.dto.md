[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/charging.station.network.profile.dto

# 00_Base/src/interfaces/dto/charging.station.network.profile.dto

## Type Aliases

### ChargingStationNetworkProfileCreate

```ts
type ChargingStationNetworkProfileCreate = z.infer<
  typeof ChargingStationNetworkProfileCreateSchema
>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts#L33)

---

### ChargingStationNetworkProfileDto

```ts
type ChargingStationNetworkProfileDto = z.infer<typeof ChargingStationNetworkProfileSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts#L22)

## Variables

### ChargingStationNetworkProfileCreateSchema

```ts
const ChargingStationNetworkProfileCreateSchema: ZodObject<
  {
    configurationSlot: ZodNumber;
    setNetworkProfileId: ZodNumber;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    websocketServerConfigId: ZodOptional<ZodString>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts#L24)

---

### ChargingStationNetworkProfileProps

```ts
const ChargingStationNetworkProfileProps: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts#L20)

#### Type Declaration

| Name                                                                    | Type                        | Defined in |
| ----------------------------------------------------------------------- | --------------------------- | ---------- |
| <a id="property-configurationslot"></a> `configurationSlot`             | `"configurationSlot"`       |            |
| <a id="property-createdat"></a> `createdAt`                             | `"createdAt"`               |            |
| <a id="property-id"></a> `id`                                           | `"id"`                      |            |
| <a id="property-setnetworkprofile"></a> `setNetworkProfile`             | `"setNetworkProfile"`       |            |
| <a id="property-setnetworkprofileid"></a> `setNetworkProfileId`         | `"setNetworkProfileId"`     |            |
| <a id="property-stationid"></a> `stationId`                             | `"stationId"`               |            |
| <a id="property-tenant"></a> `tenant`                                   | `"tenant"`                  |            |
| <a id="property-tenantid"></a> `tenantId`                               | `"tenantId"`                |            |
| <a id="property-updatedat"></a> `updatedAt`                             | `"updatedAt"`               |            |
| <a id="property-websocketserverconfig"></a> `websocketServerConfig`     | `"websocketServerConfig"`   |            |
| <a id="property-websocketserverconfigid"></a> `websocketServerConfigId` | `"websocketServerConfigId"` |            |

---

### ChargingStationNetworkProfileSchema

```ts
const ChargingStationNetworkProfileSchema: ZodObject<{
  configurationSlot: ZodNumber;
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  setNetworkProfile: ZodObject<{
     apn: ZodOptional<ZodString>;
     configurationSlot: ZodNumber;
     correlationId: ZodString;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     messageTimeout: ZodNumber;
     ocppCsmsUrl: ZodString;
     ocppInterface: ZodEnum<{
        Wired0: "Wired0";
        Wired1: "Wired1";
        Wired2: "Wired2";
        Wired3: "Wired3";
        Wireless0: "Wireless0";
        Wireless1: "Wireless1";
        Wireless2: "Wireless2";
        Wireless3: "Wireless3";
     }>;
     ocppTransport: ZodEnum<{
        JSON: "JSON";
        SOAP: "SOAP";
     }>;
     ocppVersion: ZodEnum<{
        OCPP12: "OCPP12";
        OCPP15: "OCPP15";
        OCPP16: "OCPP16";
        OCPP20: "OCPP20";
     }>;
     securityProfile: ZodNumber;
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
     updatedAt: ZodOptional<ZodDate>;
     vpn: ZodOptional<ZodString>;
     websocketServerConfig: ZodOptional<ZodObject<{
        allowUnknownChargingStations: ZodBoolean;
        chargingStations: ZodOptional<ZodNullable<ZodArray<ZodObject<..., ...>>>>;
        createdAt: ZodOptional<ZodDate>;
        host: ZodString;
        id: ZodString;
        messageTimeout: ZodNumber;
        mtlsCertificateAuthorityKeyFilePath: ZodOptional<ZodString>;
        pingInterval: ZodNumber;
        port: ZodNumber;
        protocols: ZodArray<ZodString>;
        rootCACertificateFilePath: ZodOptional<ZodString>;
        securityProfile: ZodNumber;
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
        tlsCertificateChainFilePath: ZodOptional<ZodString>;
        tlsKeyFilePath: ZodOptional<ZodString>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>;
     websocketServerConfigId: ZodOptional<ZodString>;
  }, $strip>;
  setNetworkProfileId: ZodNumber;
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
  websocketServerConfig: ZodOptional<ZodObject<{
     allowUnknownChargingStations: ZodBoolean;
     chargingStations: ZodOptional<ZodNullable<ZodArray<ZodObject<{
        capabilities: ZodOptional<...>;
        chargeBoxSerialNumber: ZodOptional<...>;
        chargePointModel: ZodOptional<...>;
        chargePointSerialNumber: ZodOptional<...>;
        chargePointVendor: ZodOptional<...>;
        connectors: ZodOptional<...>;
        coordinates: ZodOptional<...>;
        createdAt: ZodOptional<...>;
        evses: ZodOptional<...>;
        firmwareVersion: ZodOptional<...>;
        floorLevel: ZodOptional<...>;
        iccid: ZodOptional<...>;
        id: ZodString;
        imsi: ZodOptional<...>;
        isOnline: ZodBoolean;
        latestOcppMessageTimestamp: ZodOptional<...>;
        locationId: ZodOptional<...>;
        meterSerialNumber: ZodOptional<...>;
        meterType: ZodOptional<...>;
        networkProfiles: ZodOptional<...>;
        parkingRestrictions: ZodOptional<...>;
        protocol: ZodOptional<...>;
        tenant: ZodOptional<...>;
        tenantId: ZodOptional<...>;
        updatedAt: ZodOptional<...>;
        use16StatusNotification0: ZodOptional<...>;
     }, $strip>>>>;
     createdAt: ZodOptional<ZodDate>;
     host: ZodString;
     id: ZodString;
     messageTimeout: ZodNumber;
     mtlsCertificateAuthorityKeyFilePath: ZodOptional<ZodString>;
     pingInterval: ZodNumber;
     port: ZodNumber;
     protocols: ZodArray<ZodString>;
     rootCACertificateFilePath: ZodOptional<ZodString>;
     securityProfile: ZodNumber;
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
     tlsCertificateChainFilePath: ZodOptional<ZodString>;
     tlsKeyFilePath: ZodOptional<ZodString>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>;
  websocketServerConfigId: ZodOptional<ZodString>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts#L10)

---

### chargingStationNetworkProfileSchemas

```ts
const chargingStationNetworkProfileSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts#L37)

#### Type Declaration

| Name                                                                                            | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Default value                               | Defined in                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-chargingstationnetworkprofile"></a> `ChargingStationNetworkProfile`             | `ZodObject`\<\{ `configurationSlot`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `setNetworkProfile`: `ZodObject`\<\{ `apn`: `ZodOptional`\<`ZodString`\>; `configurationSlot`: `ZodNumber`; `correlationId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `messageTimeout`: `ZodNumber`; `ocppCsmsUrl`: `ZodString`; `ocppInterface`: `ZodEnum`\<\{ `Wired0`: `"Wired0"`; `Wired1`: `"Wired1"`; `Wired2`: `"Wired2"`; `Wired3`: `"Wired3"`; `Wireless0`: `"Wireless0"`; `Wireless1`: `"Wireless1"`; `Wireless2`: `"Wireless2"`; `Wireless3`: `"Wireless3"`; \}\>; `ocppTransport`: `ZodEnum`\<\{ `JSON`: `"JSON"`; `SOAP`: `"SOAP"`; \}\>; `ocppVersion`: `ZodEnum`\<\{ `OCPP12`: `"OCPP12"`; `OCPP15`: `"OCPP15"`; `OCPP16`: `"OCPP16"`; `OCPP20`: `"OCPP20"`; \}\>; `securityProfile`: `ZodNumber`; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `vpn`: `ZodOptional`\<`ZodString`\>; `websocketServerConfig`: `ZodOptional`\<`ZodObject`\<\{ `allowUnknownChargingStations`: `ZodBoolean`; `chargingStations`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<...\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `host`: `ZodString`; `id`: `ZodString`; `messageTimeout`: `ZodNumber`; `mtlsCertificateAuthorityKeyFilePath`: `ZodOptional`\<`ZodString`\>; `pingInterval`: `ZodNumber`; `port`: `ZodNumber`; `protocols`: `ZodArray`\<`ZodString`\>; `rootCACertificateFilePath`: `ZodOptional`\<`ZodString`\>; `securityProfile`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tlsCertificateChainFilePath`: `ZodOptional`\<`ZodString`\>; `tlsKeyFilePath`: `ZodOptional`\<`ZodString`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `websocketServerConfigId`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>; `setNetworkProfileId`: `ZodNumber`; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `websocketServerConfig`: `ZodOptional`\<`ZodObject`\<\{ `allowUnknownChargingStations`: `ZodBoolean`; `chargingStations`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `capabilities`: ...; `chargeBoxSerialNumber`: ...; `chargePointModel`: ...; `chargePointSerialNumber`: ...; `chargePointVendor`: ...; `connectors`: ...; `coordinates`: ...; `createdAt`: ...; `evses`: ...; `firmwareVersion`: ...; `floorLevel`: ...; `iccid`: ...; `id`: ...; `imsi`: ...; `isOnline`: ...; `latestOcppMessageTimestamp`: ...; `locationId`: ...; `meterSerialNumber`: ...; `meterType`: ...; `networkProfiles`: ...; `parkingRestrictions`: ...; `protocol`: ...; `tenant`: ...; `tenantId`: ...; `updatedAt`: ...; `use16StatusNotification0`: ...; \}, `$strip`\>\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `host`: `ZodString`; `id`: `ZodString`; `messageTimeout`: `ZodNumber`; `mtlsCertificateAuthorityKeyFilePath`: `ZodOptional`\<`ZodString`\>; `pingInterval`: `ZodNumber`; `port`: `ZodNumber`; `protocols`: `ZodArray`\<`ZodString`\>; `rootCACertificateFilePath`: `ZodOptional`\<`ZodString`\>; `securityProfile`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tlsCertificateChainFilePath`: `ZodOptional`\<`ZodString`\>; `tlsKeyFilePath`: `ZodOptional`\<`ZodString`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `websocketServerConfigId`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\> | `ChargingStationNetworkProfileSchema`       | [00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts#L38) |
| <a id="property-chargingstationnetworkprofilecreate"></a> `ChargingStationNetworkProfileCreate` | `ZodObject`\<\{ `configurationSlot`: `ZodNumber`; `setNetworkProfileId`: `ZodNumber`; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `websocketServerConfigId`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `ChargingStationNetworkProfileCreateSchema` | [00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.network.profile.dto.ts#L39) |
