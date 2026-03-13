[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/evse.dto

# 00_Base/src/interfaces/dto/evse.dto

## Type Aliases

### EvseCreate

```ts
type EvseCreate = z.infer<typeof EvseCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/evse.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.dto.ts#L32)

---

### EvseDto

```ts
type EvseDto = z.infer<typeof EvseSchema>;
```

Defined in: [00_Base/src/interfaces/dto/evse.dto.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.dto.ts#L21)

## Variables

### EvseCreateSchema

```ts
const EvseCreateSchema: ZodObject<
  {
    evseId: ZodString;
    evseTypeId: ZodOptional<ZodNumber>;
    physicalReference: ZodOptional<ZodNullable<ZodString>>;
    removed: ZodOptional<ZodBoolean>;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/evse.dto.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.dto.ts#L23)

---

### EvseProps

```ts
const EvseProps: object;
```

Defined in: [00_Base/src/interfaces/dto/evse.dto.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.dto.ts#L19)

#### Type Declaration

| Name                                                        | Type                  | Defined in |
| ----------------------------------------------------------- | --------------------- | ---------- |
| <a id="property-connectors"></a> `connectors`               | `"connectors"`        |            |
| <a id="property-createdat"></a> `createdAt`                 | `"createdAt"`         |            |
| <a id="property-evseid"></a> `evseId`                       | `"evseId"`            |            |
| <a id="property-evsetypeid"></a> `evseTypeId`               | `"evseTypeId"`        |            |
| <a id="property-id"></a> `id`                               | `"id"`                |            |
| <a id="property-physicalreference"></a> `physicalReference` | `"physicalReference"` |            |
| <a id="property-removed"></a> `removed`                     | `"removed"`           |            |
| <a id="property-stationid"></a> `stationId`                 | `"stationId"`         |            |
| <a id="property-tenant"></a> `tenant`                       | `"tenant"`            |            |
| <a id="property-tenantid"></a> `tenantId`                   | `"tenantId"`          |            |
| <a id="property-updatedat"></a> `updatedAt`                 | `"updatedAt"`         |            |

---

### EvseSchema

```ts
const EvseSchema: ZodObject<{
  connectors: ZodOptional<ZodNullable<ZodArray<ZodObject<{
     connectorId: ZodNumber;
     createdAt: ZodOptional<ZodDate>;
     errorCode: ZodOptional<ZodNullable<ZodDefault<ZodEnum<...>>>>;
     evseId: ZodNumber;
     evseTypeConnectorId: ZodOptional<ZodNumber>;
     format: ZodOptional<ZodNullable<ZodEnum<{
        Cable: ...;
        Socket: ...;
     }>>>;
     id: ZodOptional<ZodNumber>;
     info: ZodOptional<ZodNullable<ZodString>>;
     maximumAmperage: ZodOptional<ZodNullable<ZodNumber>>;
     maximumPowerWatts: ZodOptional<ZodNullable<ZodNumber>>;
     maximumVoltage: ZodOptional<ZodNullable<ZodNumber>>;
     powerType: ZodOptional<ZodNullable<ZodEnum<{
        AC1Phase: ...;
        AC2Phase: ...;
        AC2PhaseSplit: ...;
        AC3Phase: ...;
        DC: ...;
     }>>>;
     stationId: ZodString;
     status: ZodOptional<ZodNullable<ZodDefault<ZodEnum<...>>>>;
     tariff: ZodOptional<ZodNullable<ZodObject<{
        authorizationAmount: ...;
        createdAt: ...;
        currency: ...;
        id: ...;
        paymentFee: ...;
        pricePerKwh: ...;
        pricePerMin: ...;
        pricePerSession: ...;
        tariffAltText: ...;
        taxRate: ...;
        tenant: ...;
        tenantId: ...;
        updatedAt: ...;
     }, $strip>>>;
     tariffId: ZodOptional<ZodNullable<ZodNumber>>;
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
     termsAndConditionsUrl: ZodOptional<ZodNullable<ZodString>>;
     timestamp: ZodISODateTime;
     type: ZodOptional<ZodNullable<ZodEnum<{
        CHAdeMO: ...;
        ChaoJi: ...;
        DomesticA: ...;
        DomesticB: ...;
        DomesticC: ...;
        DomesticD: ...;
        DomesticE: ...;
        DomesticF: ...;
        DomesticG: ...;
        DomesticH: ...;
        DomesticI: ...;
        DomesticJ: ...;
        DomesticK: ...;
        DomesticL: ...;
        DomesticM: ...;
        DomesticN: ...;
        DomesticO: ...;
        GBTAC: ...;
        GBTDC: ...;
        IEC603092Single16: ...;
        IEC603092Three16: ...;
        IEC603092Three32: ...;
        IEC603092Three64: ...;
        IEC62196T1: ...;
        IEC62196T1COMBO: ...;
        IEC62196T2: ...;
        IEC62196T2COMBO: ...;
        IEC62196T3A: ...;
        IEC62196T3C: ...;
        NEMA1030: ...;
        NEMA1050: ...;
        NEMA1430: ...;
        NEMA1450: ...;
        NEMA520: ...;
        NEMA630: ...;
        NEMA650: ...;
        PantographBottomUp: ...;
        PantographTopDown: ...;
        TeslaR: ...;
        TeslaS: ...;
     }>>>;
     updatedAt: ZodOptional<ZodDate>;
     vendorErrorCode: ZodOptional<ZodNullable<ZodString>>;
     vendorId: ZodOptional<ZodNullable<ZodString>>;
  }, $strip>>>>;
  createdAt: ZodOptional<ZodDate>;
  evseId: ZodString;
  evseTypeId: ZodOptional<ZodNumber>;
  id: ZodOptional<ZodNumber>;
  physicalReference: ZodOptional<ZodNullable<ZodString>>;
  removed: ZodOptional<ZodBoolean>;
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

Defined in: [00_Base/src/interfaces/dto/evse.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.dto.ts#L9)

---

### evseSchemas

```ts
const evseSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/evse.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.dto.ts#L34)

#### Type Declaration

| Name                                          | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default value      | Defined in                                                                                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-evse"></a> `Evse`             | `ZodObject`\<\{ `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `connectorId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `errorCode`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<...\>\>\>; `evseId`: `ZodNumber`; `evseTypeConnectorId`: `ZodOptional`\<`ZodNumber`\>; `format`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<...\>\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `info`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `maximumAmperage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumPowerWatts`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumVoltage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `powerType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<...\>\>\>; `stationId`: `ZodString`; `status`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<...\>\>\>; `tariff`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `termsAndConditionsUrl`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `timestamp`: `ZodISODateTime`; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `vendorErrorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `vendorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evseId`: `ZodString`; `evseTypeId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `physicalReference`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `removed`: `ZodOptional`\<`ZodBoolean`\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `EvseSchema`       | [00_Base/src/interfaces/dto/evse.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.dto.ts#L35) |
| <a id="property-evsecreate"></a> `EvseCreate` | `ZodObject`\<\{ `evseId`: `ZodString`; `evseTypeId`: `ZodOptional`\<`ZodNumber`\>; `physicalReference`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `removed`: `ZodOptional`\<`ZodBoolean`\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `EvseCreateSchema` | [00_Base/src/interfaces/dto/evse.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/evse.dto.ts#L36) |
