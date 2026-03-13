[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/charging.station.security.info.dto

# 00_Base/src/interfaces/dto/charging.station.security.info.dto

## Type Aliases

### ChargingStationSecurityInfoCreate

```ts
type ChargingStationSecurityInfoCreate = z.infer<typeof ChargingStationSecurityInfoCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.security.info.dto.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.security.info.dto.ts#L25)

---

### ChargingStationSecurityInfoDto

```ts
type ChargingStationSecurityInfoDto = z.infer<typeof ChargingStationSecurityInfoSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.security.info.dto.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.security.info.dto.ts#L16)

## Variables

### ChargingStationSecurityInfoCreateSchema

```ts
const ChargingStationSecurityInfoCreateSchema: ZodObject<
  {
    publicKeyFileId: ZodString;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.security.info.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.security.info.dto.ts#L18)

---

### ChargingStationSecurityInfoProps

```ts
const ChargingStationSecurityInfoProps: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.security.info.dto.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.security.info.dto.ts#L14)

#### Type Declaration

| Name                                                    | Type                | Defined in |
| ------------------------------------------------------- | ------------------- | ---------- |
| <a id="property-createdat"></a> `createdAt`             | `"createdAt"`       |            |
| <a id="property-id"></a> `id`                           | `"id"`              |            |
| <a id="property-publickeyfileid"></a> `publicKeyFileId` | `"publicKeyFileId"` |            |
| <a id="property-stationid"></a> `stationId`             | `"stationId"`       |            |
| <a id="property-tenant"></a> `tenant`                   | `"tenant"`          |            |
| <a id="property-tenantid"></a> `tenantId`               | `"tenantId"`        |            |
| <a id="property-updatedat"></a> `updatedAt`             | `"updatedAt"`       |            |

---

### ChargingStationSecurityInfoSchema

```ts
const ChargingStationSecurityInfoSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  publicKeyFileId: ZodString;
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
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.security.info.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.security.info.dto.ts#L8)

---

### chargingStationSecurityInfoSchemas

```ts
const chargingStationSecurityInfoSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.security.info.dto.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.security.info.dto.ts#L29)

#### Type Declaration

| Name                                                                                        | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Default value                             | Defined in                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-chargingstationsecurityinfo"></a> `ChargingStationSecurityInfo`             | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `publicKeyFileId`: `ZodString`; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `ChargingStationSecurityInfoSchema`       | [00_Base/src/interfaces/dto/charging.station.security.info.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.security.info.dto.ts#L30) |
| <a id="property-chargingstationsecurityinfocreate"></a> `ChargingStationSecurityInfoCreate` | `ZodObject`\<\{ `publicKeyFileId`: `ZodString`; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `ChargingStationSecurityInfoCreateSchema` | [00_Base/src/interfaces/dto/charging.station.security.info.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.security.info.dto.ts#L31) |
