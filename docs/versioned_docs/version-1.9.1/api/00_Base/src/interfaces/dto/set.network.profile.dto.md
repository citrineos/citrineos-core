[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/set.network.profile.dto

# 00_Base/src/interfaces/dto/set.network.profile.dto

## Type Aliases

### SetNetworkProfileCreate

```ts
type SetNetworkProfileCreate = z.infer<typeof SetNetworkProfileCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/set.network.profile.dto.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/set.network.profile.dto.ts#L43)

---

### SetNetworkProfileDto

```ts
type SetNetworkProfileDto = z.infer<typeof SetNetworkProfileSchema>;
```

Defined in: [00_Base/src/interfaces/dto/set.network.profile.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/set.network.profile.dto.ts#L33)

## Variables

### SetNetworkProfileCreateSchema

```ts
const SetNetworkProfileCreateSchema: ZodObject<
  {
    apn: ZodOptional<ZodString>;
    configurationSlot: ZodNumber;
    correlationId: ZodString;
    messageTimeout: ZodNumber;
    ocppCsmsUrl: ZodString;
    ocppInterface: ZodEnum<{
      Wired0: 'Wired0';
      Wired1: 'Wired1';
      Wired2: 'Wired2';
      Wired3: 'Wired3';
      Wireless0: 'Wireless0';
      Wireless1: 'Wireless1';
      Wireless2: 'Wireless2';
      Wireless3: 'Wireless3';
    }>;
    ocppTransport: ZodEnum<{
      JSON: 'JSON';
      SOAP: 'SOAP';
    }>;
    ocppVersion: ZodEnum<{
      OCPP12: 'OCPP12';
      OCPP15: 'OCPP15';
      OCPP16: 'OCPP16';
      OCPP20: 'OCPP20';
    }>;
    securityProfile: ZodNumber;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    vpn: ZodOptional<ZodString>;
    websocketServerConfigId: ZodOptional<ZodString>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/set.network.profile.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/set.network.profile.dto.ts#L35)

---

### SetNetworkProfileProps

```ts
const SetNetworkProfileProps: object;
```

Defined in: [00_Base/src/interfaces/dto/set.network.profile.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/set.network.profile.dto.ts#L31)

#### Type Declaration

| Name                                                                    | Type                        | Defined in |
| ----------------------------------------------------------------------- | --------------------------- | ---------- |
| <a id="property-apn"></a> `apn`                                         | `"apn"`                     |            |
| <a id="property-configurationslot"></a> `configurationSlot`             | `"configurationSlot"`       |            |
| <a id="property-correlationid"></a> `correlationId`                     | `"correlationId"`           |            |
| <a id="property-createdat"></a> `createdAt`                             | `"createdAt"`               |            |
| <a id="property-id"></a> `id`                                           | `"id"`                      |            |
| <a id="property-messagetimeout"></a> `messageTimeout`                   | `"messageTimeout"`          |            |
| <a id="property-ocppcsmsurl"></a> `ocppCsmsUrl`                         | `"ocppCsmsUrl"`             |            |
| <a id="property-ocppinterface"></a> `ocppInterface`                     | `"ocppInterface"`           |            |
| <a id="property-ocpptransport"></a> `ocppTransport`                     | `"ocppTransport"`           |            |
| <a id="property-ocppversion"></a> `ocppVersion`                         | `"ocppVersion"`             |            |
| <a id="property-securityprofile"></a> `securityProfile`                 | `"securityProfile"`         |            |
| <a id="property-stationid"></a> `stationId`                             | `"stationId"`               |            |
| <a id="property-tenant"></a> `tenant`                                   | `"tenant"`                  |            |
| <a id="property-tenantid"></a> `tenantId`                               | `"tenantId"`                |            |
| <a id="property-updatedat"></a> `updatedAt`                             | `"updatedAt"`               |            |
| <a id="property-vpn"></a> `vpn`                                         | `"vpn"`                     |            |
| <a id="property-websocketserverconfig"></a> `websocketServerConfig`     | `"websocketServerConfig"`   |            |
| <a id="property-websocketserverconfigid"></a> `websocketServerConfigId` | `"websocketServerConfigId"` |            |

---

### SetNetworkProfileSchema

```ts
const SetNetworkProfileSchema: ZodObject<{
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
  vpn: ZodOptional<ZodString>;
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

Defined in: [00_Base/src/interfaces/dto/set.network.profile.dto.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/set.network.profile.dto.ts#L14)

---

### setNetworkProfileSchemas

```ts
const setNetworkProfileSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/set.network.profile.dto.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/set.network.profile.dto.ts#L45)

#### Type Declaration

| Name                                                                    | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Default value                   | Defined in                                                                                                                                                                                                      |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-setnetworkprofile"></a> `SetNetworkProfile`             | `ZodObject`\<\{ `apn`: `ZodOptional`\<`ZodString`\>; `configurationSlot`: `ZodNumber`; `correlationId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `messageTimeout`: `ZodNumber`; `ocppCsmsUrl`: `ZodString`; `ocppInterface`: `ZodEnum`\<\{ `Wired0`: `"Wired0"`; `Wired1`: `"Wired1"`; `Wired2`: `"Wired2"`; `Wired3`: `"Wired3"`; `Wireless0`: `"Wireless0"`; `Wireless1`: `"Wireless1"`; `Wireless2`: `"Wireless2"`; `Wireless3`: `"Wireless3"`; \}\>; `ocppTransport`: `ZodEnum`\<\{ `JSON`: `"JSON"`; `SOAP`: `"SOAP"`; \}\>; `ocppVersion`: `ZodEnum`\<\{ `OCPP12`: `"OCPP12"`; `OCPP15`: `"OCPP15"`; `OCPP16`: `"OCPP16"`; `OCPP20`: `"OCPP20"`; \}\>; `securityProfile`: `ZodNumber`; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `vpn`: `ZodOptional`\<`ZodString`\>; `websocketServerConfig`: `ZodOptional`\<`ZodObject`\<\{ `allowUnknownChargingStations`: `ZodBoolean`; `chargingStations`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `capabilities`: ...; `chargeBoxSerialNumber`: ...; `chargePointModel`: ...; `chargePointSerialNumber`: ...; `chargePointVendor`: ...; `connectors`: ...; `coordinates`: ...; `createdAt`: ...; `evses`: ...; `firmwareVersion`: ...; `floorLevel`: ...; `iccid`: ...; `id`: ...; `imsi`: ...; `isOnline`: ...; `latestOcppMessageTimestamp`: ...; `locationId`: ...; `meterSerialNumber`: ...; `meterType`: ...; `networkProfiles`: ...; `parkingRestrictions`: ...; `protocol`: ...; `tenant`: ...; `tenantId`: ...; `updatedAt`: ...; `use16StatusNotification0`: ...; \}, `$strip`\>\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `host`: `ZodString`; `id`: `ZodString`; `messageTimeout`: `ZodNumber`; `mtlsCertificateAuthorityKeyFilePath`: `ZodOptional`\<`ZodString`\>; `pingInterval`: `ZodNumber`; `port`: `ZodNumber`; `protocols`: `ZodArray`\<`ZodString`\>; `rootCACertificateFilePath`: `ZodOptional`\<`ZodString`\>; `securityProfile`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tlsCertificateChainFilePath`: `ZodOptional`\<`ZodString`\>; `tlsKeyFilePath`: `ZodOptional`\<`ZodString`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `websocketServerConfigId`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\> | `SetNetworkProfileSchema`       | [00_Base/src/interfaces/dto/set.network.profile.dto.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/set.network.profile.dto.ts#L46) |
| <a id="property-setnetworkprofilecreate"></a> `SetNetworkProfileCreate` | `ZodObject`\<\{ `apn`: `ZodOptional`\<`ZodString`\>; `configurationSlot`: `ZodNumber`; `correlationId`: `ZodString`; `messageTimeout`: `ZodNumber`; `ocppCsmsUrl`: `ZodString`; `ocppInterface`: `ZodEnum`\<\{ `Wired0`: `"Wired0"`; `Wired1`: `"Wired1"`; `Wired2`: `"Wired2"`; `Wired3`: `"Wired3"`; `Wireless0`: `"Wireless0"`; `Wireless1`: `"Wireless1"`; `Wireless2`: `"Wireless2"`; `Wireless3`: `"Wireless3"`; \}\>; `ocppTransport`: `ZodEnum`\<\{ `JSON`: `"JSON"`; `SOAP`: `"SOAP"`; \}\>; `ocppVersion`: `ZodEnum`\<\{ `OCPP12`: `"OCPP12"`; `OCPP15`: `"OCPP15"`; `OCPP16`: `"OCPP16"`; `OCPP20`: `"OCPP20"`; \}\>; `securityProfile`: `ZodNumber`; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `vpn`: `ZodOptional`\<`ZodString`\>; `websocketServerConfigId`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `SetNetworkProfileCreateSchema` | [00_Base/src/interfaces/dto/set.network.profile.dto.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/set.network.profile.dto.ts#L47) |
