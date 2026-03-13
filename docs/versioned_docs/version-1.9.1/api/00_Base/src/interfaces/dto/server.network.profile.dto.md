[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/server.network.profile.dto

# 00_Base/src/interfaces/dto/server.network.profile.dto

## Type Aliases

### ServerNetworkProfileCreate

```ts
type ServerNetworkProfileCreate = z.infer<typeof ServerNetworkProfileCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/server.network.profile.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/server.network.profile.dto.ts#L36)

---

### ServerNetworkProfileDto

```ts
type ServerNetworkProfileDto = z.infer<typeof ServerNetworkProfileSchema>;
```

Defined in: [00_Base/src/interfaces/dto/server.network.profile.dto.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/server.network.profile.dto.ts#L27)

## Variables

### ServerNetworkProfileCreateSchema

```ts
const ServerNetworkProfileCreateSchema: ZodObject<
  {
    allowUnknownChargingStations: ZodBoolean;
    host: ZodString;
    id: ZodString;
    messageTimeout: ZodNumber;
    mtlsCertificateAuthorityKeyFilePath: ZodOptional<ZodString>;
    pingInterval: ZodNumber;
    port: ZodNumber;
    protocols: ZodArray<ZodString>;
    rootCACertificateFilePath: ZodOptional<ZodString>;
    securityProfile: ZodNumber;
    tenantId: ZodOptional<ZodNumber>;
    tlsCertificateChainFilePath: ZodOptional<ZodString>;
    tlsKeyFilePath: ZodOptional<ZodString>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/server.network.profile.dto.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/server.network.profile.dto.ts#L29)

---

### ServerNetworkProfileProps

```ts
const ServerNetworkProfileProps: object;
```

Defined in: [00_Base/src/interfaces/dto/server.network.profile.dto.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/server.network.profile.dto.ts#L25)

#### Type Declaration

| Name                                                                                            | Type                                    | Defined in |
| ----------------------------------------------------------------------------------------------- | --------------------------------------- | ---------- |
| <a id="property-allowunknownchargingstations"></a> `allowUnknownChargingStations`               | `"allowUnknownChargingStations"`        |            |
| <a id="property-chargingstations"></a> `chargingStations`                                       | `"chargingStations"`                    |            |
| <a id="property-createdat"></a> `createdAt`                                                     | `"createdAt"`                           |            |
| <a id="property-host"></a> `host`                                                               | `"host"`                                |            |
| <a id="property-id"></a> `id`                                                                   | `"id"`                                  |            |
| <a id="property-messagetimeout"></a> `messageTimeout`                                           | `"messageTimeout"`                      |            |
| <a id="property-mtlscertificateauthoritykeyfilepath"></a> `mtlsCertificateAuthorityKeyFilePath` | `"mtlsCertificateAuthorityKeyFilePath"` |            |
| <a id="property-pinginterval"></a> `pingInterval`                                               | `"pingInterval"`                        |            |
| <a id="property-port"></a> `port`                                                               | `"port"`                                |            |
| <a id="property-protocols"></a> `protocols`                                                     | `"protocols"`                           |            |
| <a id="property-rootcacertificatefilepath"></a> `rootCACertificateFilePath`                     | `"rootCACertificateFilePath"`           |            |
| <a id="property-securityprofile"></a> `securityProfile`                                         | `"securityProfile"`                     |            |
| <a id="property-tenant"></a> `tenant`                                                           | `"tenant"`                              |            |
| <a id="property-tenantid"></a> `tenantId`                                                       | `"tenantId"`                            |            |
| <a id="property-tlscertificatechainfilepath"></a> `tlsCertificateChainFilePath`                 | `"tlsCertificateChainFilePath"`         |            |
| <a id="property-tlskeyfilepath"></a> `tlsKeyFilePath`                                           | `"tlsKeyFilePath"`                      |            |
| <a id="property-updatedat"></a> `updatedAt`                                                     | `"updatedAt"`                           |            |

---

### ServerNetworkProfileSchema

```ts
const ServerNetworkProfileSchema: ZodObject<{
  allowUnknownChargingStations: ZodBoolean;
  chargingStations: ZodOptional<ZodNullable<ZodArray<ZodObject<{
     capabilities: ZodOptional<ZodNullable<ZodArray<ZodEnum<...>>>>;
     chargeBoxSerialNumber: ZodOptional<ZodNullable<ZodString>>;
     chargePointModel: ZodOptional<ZodNullable<ZodString>>;
     chargePointSerialNumber: ZodOptional<ZodNullable<ZodString>>;
     chargePointVendor: ZodOptional<ZodNullable<ZodString>>;
     connectors: ZodOptional<ZodNullable<ZodArray<ZodObject<..., ...>>>>;
     coordinates: ZodOptional<ZodNullable<ZodObject<{
        coordinates: ...;
        type: ...;
     }, $strip>>>;
     createdAt: ZodOptional<ZodDate>;
     evses: ZodOptional<ZodNullable<ZodArray<ZodObject<..., ...>>>>;
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
     parkingRestrictions: ZodOptional<ZodNullable<ZodArray<ZodEnum<...>>>>;
     protocol: ZodOptional<ZodNullable<ZodEnum<typeof OCPPVersion>>>;
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
     use16StatusNotification0: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
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
  tlsCertificateChainFilePath: ZodOptional<ZodString>;
  tlsKeyFilePath: ZodOptional<ZodString>;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/server.network.profile.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/server.network.profile.dto.ts#L9)

---

### serverNetworkProfileSchemas

```ts
const serverNetworkProfileSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/server.network.profile.dto.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/server.network.profile.dto.ts#L38)

#### Type Declaration

| Name                                                                          | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Default value                      | Defined in                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-servernetworkprofile"></a> `ServerNetworkProfile`             | `ZodObject`\<\{ `allowUnknownChargingStations`: `ZodBoolean`; `chargingStations`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<...\>\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<...\>\>\>; `coordinates`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evses`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<...\>\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `networkProfiles`: `ZodOptional`\<`ZodAny`\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<...\>\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<...\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<...\>\>\>; \}, `$strip`\>\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `host`: `ZodString`; `id`: `ZodString`; `messageTimeout`: `ZodNumber`; `mtlsCertificateAuthorityKeyFilePath`: `ZodOptional`\<`ZodString`\>; `pingInterval`: `ZodNumber`; `port`: `ZodNumber`; `protocols`: `ZodArray`\<`ZodString`\>; `rootCACertificateFilePath`: `ZodOptional`\<`ZodString`\>; `securityProfile`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tlsCertificateChainFilePath`: `ZodOptional`\<`ZodString`\>; `tlsKeyFilePath`: `ZodOptional`\<`ZodString`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `ServerNetworkProfileSchema`       | [00_Base/src/interfaces/dto/server.network.profile.dto.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/server.network.profile.dto.ts#L39) |
| <a id="property-servernetworkprofilecreate"></a> `ServerNetworkProfileCreate` | `ZodObject`\<\{ `allowUnknownChargingStations`: `ZodBoolean`; `host`: `ZodString`; `id`: `ZodString`; `messageTimeout`: `ZodNumber`; `mtlsCertificateAuthorityKeyFilePath`: `ZodOptional`\<`ZodString`\>; `pingInterval`: `ZodNumber`; `port`: `ZodNumber`; `protocols`: `ZodArray`\<`ZodString`\>; `rootCACertificateFilePath`: `ZodOptional`\<`ZodString`\>; `securityProfile`: `ZodNumber`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tlsCertificateChainFilePath`: `ZodOptional`\<`ZodString`\>; `tlsKeyFilePath`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `ServerNetworkProfileCreateSchema` | [00_Base/src/interfaces/dto/server.network.profile.dto.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/server.network.profile.dto.ts#L40) |
