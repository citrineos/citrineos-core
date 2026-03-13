[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/charging.profile.dto

# 00_Base/src/interfaces/dto/charging.profile.dto

## Type Aliases

### ChargingProfileCreate

```ts
type ChargingProfileCreate = z.infer<typeof ChargingProfileCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.profile.dto.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.profile.dto.ts#L49)

---

### ChargingProfileDto

```ts
type ChargingProfileDto = z.infer<typeof ChargingProfileSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.profile.dto.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.profile.dto.ts#L38)

## Variables

### ChargingProfileCreateSchema

```ts
const ChargingProfileCreateSchema: ZodObject<
  {
    chargingLimitSource: ZodOptional<
      ZodNullable<
        ZodDefault<
          ZodEnum<{
            CSO: 'CSO';
            EMS: 'EMS';
            Other: 'Other';
            SO: 'SO';
          }>
        >
      >
    >;
    chargingProfileKind: ZodEnum<{
      Absolute: 'Absolute';
      Recurring: 'Recurring';
      Relative: 'Relative';
    }>;
    chargingProfilePurpose: ZodEnum<{
      ChargingStationExternalConstraints: 'ChargingStationExternalConstraints';
      ChargingStationMaxProfile: 'ChargingStationMaxProfile';
      TxDefaultProfile: 'TxDefaultProfile';
      TxProfile: 'TxProfile';
    }>;
    evseId: ZodOptional<ZodNullable<ZodNumber>>;
    id: ZodOptional<ZodNumber>;
    isActive: ZodDefault<ZodBoolean>;
    recurrencyKind: ZodOptional<
      ZodNullable<
        ZodEnum<{
          Daily: 'Daily';
          Weekly: 'Weekly';
        }>
      >
    >;
    stackLevel: ZodNumber;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    transactionDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
    validFrom: ZodOptional<ZodNullable<ZodISODateTime>>;
    validTo: ZodOptional<ZodNullable<ZodISODateTime>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/charging.profile.dto.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.profile.dto.ts#L40)

---

### ChargingProfileProps

```ts
const ChargingProfileProps: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.profile.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.profile.dto.ts#L36)

#### Type Declaration

| Name                                                                  | Type                       | Defined in |
| --------------------------------------------------------------------- | -------------------------- | ---------- |
| <a id="property-charginglimitsource"></a> `chargingLimitSource`       | `"chargingLimitSource"`    |            |
| <a id="property-chargingprofilekind"></a> `chargingProfileKind`       | `"chargingProfileKind"`    |            |
| <a id="property-chargingprofilepurpose"></a> `chargingProfilePurpose` | `"chargingProfilePurpose"` |            |
| <a id="property-chargingschedule"></a> `chargingSchedule`             | `"chargingSchedule"`       |            |
| <a id="property-createdat"></a> `createdAt`                           | `"createdAt"`              |            |
| <a id="property-databaseid"></a> `databaseId`                         | `"databaseId"`             |            |
| <a id="property-evseid"></a> `evseId`                                 | `"evseId"`                 |            |
| <a id="property-id"></a> `id`                                         | `"id"`                     |            |
| <a id="property-isactive"></a> `isActive`                             | `"isActive"`               |            |
| <a id="property-recurrencykind"></a> `recurrencyKind`                 | `"recurrencyKind"`         |            |
| <a id="property-stacklevel"></a> `stackLevel`                         | `"stackLevel"`             |            |
| <a id="property-stationid"></a> `stationId`                           | `"stationId"`              |            |
| <a id="property-tenant"></a> `tenant`                                 | `"tenant"`                 |            |
| <a id="property-tenantid"></a> `tenantId`                             | `"tenantId"`               |            |
| <a id="property-transactiondatabaseid"></a> `transactionDatabaseId`   | `"transactionDatabaseId"`  |            |
| <a id="property-updatedat"></a> `updatedAt`                           | `"updatedAt"`              |            |
| <a id="property-validfrom"></a> `validFrom`                           | `"validFrom"`              |            |
| <a id="property-validto"></a> `validTo`                               | `"validTo"`                |            |

---

### ChargingProfileSchema

```ts
const ChargingProfileSchema: ZodObject<{
  chargingLimitSource: ZodOptional<ZodNullable<ZodDefault<ZodEnum<{
     CSO: "CSO";
     EMS: "EMS";
     Other: "Other";
     SO: "SO";
  }>>>>;
  chargingProfileKind: ZodEnum<{
     Absolute: "Absolute";
     Recurring: "Recurring";
     Relative: "Relative";
  }>;
  chargingProfilePurpose: ZodEnum<{
     ChargingStationExternalConstraints: "ChargingStationExternalConstraints";
     ChargingStationMaxProfile: "ChargingStationMaxProfile";
     TxDefaultProfile: "TxDefaultProfile";
     TxProfile: "TxProfile";
  }>;
  chargingSchedule: ZodUnion<readonly [ZodTuple<[ZodObject<{
     chargingProfileDatabaseId: ZodOptional<ZodNumber>;
     chargingRateUnit: ZodEnum<{
        A: "A";
        W: "W";
     }>;
     chargingSchedulePeriod: ZodTuple<[ZodAny], ZodAny>;
     createdAt: ZodOptional<ZodDate>;
     databaseId: ZodNumber;
     duration: ZodOptional<ZodNullable<ZodNumber>>;
     id: ZodNumber;
     minChargingRate: ZodOptional<ZodNullable<ZodNumber>>;
     salesTariff: ZodOptional<ZodObject<{
        chargingScheduleDatabaseId: ...;
        createdAt: ...;
        databaseId: ...;
        id: ...;
        numEPriceLevels: ...;
        salesTariffDescription: ...;
        salesTariffEntry: ...;
        tenant: ...;
        tenantId: ...;
        updatedAt: ...;
     }, $strip>>;
     startSchedule: ZodOptional<ZodNullable<ZodString>>;
     stationId: ZodString;
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
     timeBase: ZodOptional<ZodISODateTime>;
     updatedAt: ZodOptional<ZodDate>;
   }, $strip>], null>, ZodTuple<[ZodObject<{
     chargingProfileDatabaseId: ZodOptional<ZodNumber>;
     chargingRateUnit: ZodEnum<{
        A: "A";
        W: "W";
     }>;
     chargingSchedulePeriod: ZodTuple<[ZodAny], ZodAny>;
     createdAt: ZodOptional<ZodDate>;
     databaseId: ZodNumber;
     duration: ZodOptional<ZodNullable<ZodNumber>>;
     id: ZodNumber;
     minChargingRate: ZodOptional<ZodNullable<ZodNumber>>;
     salesTariff: ZodOptional<ZodObject<{
        chargingScheduleDatabaseId: ...;
        createdAt: ...;
        databaseId: ...;
        id: ...;
        numEPriceLevels: ...;
        salesTariffDescription: ...;
        salesTariffEntry: ...;
        tenant: ...;
        tenantId: ...;
        updatedAt: ...;
     }, $strip>>;
     startSchedule: ZodOptional<ZodNullable<ZodString>>;
     stationId: ZodString;
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
     timeBase: ZodOptional<ZodISODateTime>;
     updatedAt: ZodOptional<ZodDate>;
   }, $strip>, ZodObject<{
     chargingProfileDatabaseId: ZodOptional<ZodNumber>;
     chargingRateUnit: ZodEnum<{
        A: "A";
        W: "W";
     }>;
     chargingSchedulePeriod: ZodTuple<[ZodAny], ZodAny>;
     createdAt: ZodOptional<ZodDate>;
     databaseId: ZodNumber;
     duration: ZodOptional<ZodNullable<ZodNumber>>;
     id: ZodNumber;
     minChargingRate: ZodOptional<ZodNullable<ZodNumber>>;
     salesTariff: ZodOptional<ZodObject<{
        chargingScheduleDatabaseId: ...;
        createdAt: ...;
        databaseId: ...;
        id: ...;
        numEPriceLevels: ...;
        salesTariffDescription: ...;
        salesTariffEntry: ...;
        tenant: ...;
        tenantId: ...;
        updatedAt: ...;
     }, $strip>>;
     startSchedule: ZodOptional<ZodNullable<ZodString>>;
     stationId: ZodString;
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
     timeBase: ZodOptional<ZodISODateTime>;
     updatedAt: ZodOptional<ZodDate>;
   }, $strip>], null>, ZodTuple<[ZodObject<{
     chargingProfileDatabaseId: ZodOptional<ZodNumber>;
     chargingRateUnit: ZodEnum<{
        A: "A";
        W: "W";
     }>;
     chargingSchedulePeriod: ZodTuple<[ZodAny], ZodAny>;
     createdAt: ZodOptional<ZodDate>;
     databaseId: ZodNumber;
     duration: ZodOptional<ZodNullable<ZodNumber>>;
     id: ZodNumber;
     minChargingRate: ZodOptional<ZodNullable<ZodNumber>>;
     salesTariff: ZodOptional<ZodObject<{
        chargingScheduleDatabaseId: ...;
        createdAt: ...;
        databaseId: ...;
        id: ...;
        numEPriceLevels: ...;
        salesTariffDescription: ...;
        salesTariffEntry: ...;
        tenant: ...;
        tenantId: ...;
        updatedAt: ...;
     }, $strip>>;
     startSchedule: ZodOptional<ZodNullable<ZodString>>;
     stationId: ZodString;
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
     timeBase: ZodOptional<ZodISODateTime>;
     updatedAt: ZodOptional<ZodDate>;
   }, $strip>, ZodObject<{
     chargingProfileDatabaseId: ZodOptional<ZodNumber>;
     chargingRateUnit: ZodEnum<{
        A: "A";
        W: "W";
     }>;
     chargingSchedulePeriod: ZodTuple<[ZodAny], ZodAny>;
     createdAt: ZodOptional<ZodDate>;
     databaseId: ZodNumber;
     duration: ZodOptional<ZodNullable<ZodNumber>>;
     id: ZodNumber;
     minChargingRate: ZodOptional<ZodNullable<ZodNumber>>;
     salesTariff: ZodOptional<ZodObject<{
        chargingScheduleDatabaseId: ...;
        createdAt: ...;
        databaseId: ...;
        id: ...;
        numEPriceLevels: ...;
        salesTariffDescription: ...;
        salesTariffEntry: ...;
        tenant: ...;
        tenantId: ...;
        updatedAt: ...;
     }, $strip>>;
     startSchedule: ZodOptional<ZodNullable<ZodString>>;
     stationId: ZodString;
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
     timeBase: ZodOptional<ZodISODateTime>;
     updatedAt: ZodOptional<ZodDate>;
   }, $strip>, ZodObject<{
     chargingProfileDatabaseId: ZodOptional<ZodNumber>;
     chargingRateUnit: ZodEnum<{
        A: "A";
        W: "W";
     }>;
     chargingSchedulePeriod: ZodTuple<[ZodAny], ZodAny>;
     createdAt: ZodOptional<ZodDate>;
     databaseId: ZodNumber;
     duration: ZodOptional<ZodNullable<ZodNumber>>;
     id: ZodNumber;
     minChargingRate: ZodOptional<ZodNullable<ZodNumber>>;
     salesTariff: ZodOptional<ZodObject<{
        chargingScheduleDatabaseId: ...;
        createdAt: ...;
        databaseId: ...;
        id: ...;
        numEPriceLevels: ...;
        salesTariffDescription: ...;
        salesTariffEntry: ...;
        tenant: ...;
        tenantId: ...;
        updatedAt: ...;
     }, $strip>>;
     startSchedule: ZodOptional<ZodNullable<ZodString>>;
     stationId: ZodString;
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
     timeBase: ZodOptional<ZodISODateTime>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>], null>]>;
  createdAt: ZodOptional<ZodDate>;
  databaseId: ZodNumber;
  evseId: ZodOptional<ZodNullable<ZodNumber>>;
  id: ZodOptional<ZodNumber>;
  isActive: ZodDefault<ZodBoolean>;
  recurrencyKind: ZodOptional<ZodNullable<ZodEnum<{
     Daily: "Daily";
     Weekly: "Weekly";
  }>>>;
  stackLevel: ZodNumber;
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
  transactionDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
  updatedAt: ZodOptional<ZodDate>;
  validFrom: ZodOptional<ZodNullable<ZodISODateTime>>;
  validTo: ZodOptional<ZodNullable<ZodISODateTime>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/charging.profile.dto.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.profile.dto.ts#L15)

---

### chargingProfileSchemas

```ts
const chargingProfileSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.profile.dto.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.profile.dto.ts#L51)

#### Type Declaration

| Name                                                                | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Default value                 | Defined in                                                                                                                                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-chargingprofile"></a> `ChargingProfile`             | `ZodObject`\<\{ `chargingLimitSource`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<\{ `CSO`: `"CSO"`; `EMS`: `"EMS"`; `Other`: `"Other"`; `SO`: `"SO"`; \}\>\>\>\>; `chargingProfileKind`: `ZodEnum`\<\{ `Absolute`: `"Absolute"`; `Recurring`: `"Recurring"`; `Relative`: `"Relative"`; \}\>; `chargingProfilePurpose`: `ZodEnum`\<\{ `ChargingStationExternalConstraints`: `"ChargingStationExternalConstraints"`; `ChargingStationMaxProfile`: `"ChargingStationMaxProfile"`; `TxDefaultProfile`: `"TxDefaultProfile"`; `TxProfile`: `"TxProfile"`; \}\>; `chargingSchedule`: `ZodUnion`\<readonly \[`ZodTuple`\<\[`ZodObject`\<\{ `chargingProfileDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `chargingRateUnit`: `ZodEnum`\<\{ `A`: ...; `W`: ...; \}\>; `chargingSchedulePeriod`: `ZodTuple`\<\[...\], `ZodAny`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `duration`: `ZodOptional`\<`ZodNullable`\<...\>\>; `id`: `ZodNumber`; `minChargingRate`: `ZodOptional`\<`ZodNullable`\<...\>\>; `salesTariff`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `startSchedule`: `ZodOptional`\<`ZodNullable`\<...\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeBase`: `ZodOptional`\<`ZodISODateTime`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\], `null`\>, `ZodTuple`\<\[`ZodObject`\<\{ `chargingProfileDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `chargingRateUnit`: `ZodEnum`\<\{ `A`: ...; `W`: ...; \}\>; `chargingSchedulePeriod`: `ZodTuple`\<\[...\], `ZodAny`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `duration`: `ZodOptional`\<`ZodNullable`\<...\>\>; `id`: `ZodNumber`; `minChargingRate`: `ZodOptional`\<`ZodNullable`\<...\>\>; `salesTariff`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `startSchedule`: `ZodOptional`\<`ZodNullable`\<...\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeBase`: `ZodOptional`\<`ZodISODateTime`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>, `ZodObject`\<\{ `chargingProfileDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `chargingRateUnit`: `ZodEnum`\<\{ `A`: ...; `W`: ...; \}\>; `chargingSchedulePeriod`: `ZodTuple`\<\[...\], `ZodAny`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `duration`: `ZodOptional`\<`ZodNullable`\<...\>\>; `id`: `ZodNumber`; `minChargingRate`: `ZodOptional`\<`ZodNullable`\<...\>\>; `salesTariff`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `startSchedule`: `ZodOptional`\<`ZodNullable`\<...\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeBase`: `ZodOptional`\<`ZodISODateTime`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\], `null`\>, `ZodTuple`\<\[`ZodObject`\<\{ `chargingProfileDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `chargingRateUnit`: `ZodEnum`\<\{ `A`: ...; `W`: ...; \}\>; `chargingSchedulePeriod`: `ZodTuple`\<\[...\], `ZodAny`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `duration`: `ZodOptional`\<`ZodNullable`\<...\>\>; `id`: `ZodNumber`; `minChargingRate`: `ZodOptional`\<`ZodNullable`\<...\>\>; `salesTariff`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `startSchedule`: `ZodOptional`\<`ZodNullable`\<...\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeBase`: `ZodOptional`\<`ZodISODateTime`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>, `ZodObject`\<\{ `chargingProfileDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `chargingRateUnit`: `ZodEnum`\<\{ `A`: ...; `W`: ...; \}\>; `chargingSchedulePeriod`: `ZodTuple`\<\[...\], `ZodAny`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `duration`: `ZodOptional`\<`ZodNullable`\<...\>\>; `id`: `ZodNumber`; `minChargingRate`: `ZodOptional`\<`ZodNullable`\<...\>\>; `salesTariff`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `startSchedule`: `ZodOptional`\<`ZodNullable`\<...\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeBase`: `ZodOptional`\<`ZodISODateTime`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>, `ZodObject`\<\{ `chargingProfileDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `chargingRateUnit`: `ZodEnum`\<\{ `A`: ...; `W`: ...; \}\>; `chargingSchedulePeriod`: `ZodTuple`\<\[...\], `ZodAny`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `duration`: `ZodOptional`\<`ZodNullable`\<...\>\>; `id`: `ZodNumber`; `minChargingRate`: `ZodOptional`\<`ZodNullable`\<...\>\>; `salesTariff`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `startSchedule`: `ZodOptional`\<`ZodNullable`\<...\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeBase`: `ZodOptional`\<`ZodISODateTime`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\], `null`\>\]\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isActive`: `ZodDefault`\<`ZodBoolean`\>; `recurrencyKind`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Daily`: `"Daily"`; `Weekly`: `"Weekly"`; \}\>\>\>; `stackLevel`: `ZodNumber`; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `transactionDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `validFrom`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `validTo`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; \}, `$strip`\> | `ChargingProfileSchema`       | [00_Base/src/interfaces/dto/charging.profile.dto.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.profile.dto.ts#L52) |
| <a id="property-chargingprofilecreate"></a> `ChargingProfileCreate` | `ZodObject`\<\{ `chargingLimitSource`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<\{ `CSO`: `"CSO"`; `EMS`: `"EMS"`; `Other`: `"Other"`; `SO`: `"SO"`; \}\>\>\>\>; `chargingProfileKind`: `ZodEnum`\<\{ `Absolute`: `"Absolute"`; `Recurring`: `"Recurring"`; `Relative`: `"Relative"`; \}\>; `chargingProfilePurpose`: `ZodEnum`\<\{ `ChargingStationExternalConstraints`: `"ChargingStationExternalConstraints"`; `ChargingStationMaxProfile`: `"ChargingStationMaxProfile"`; `TxDefaultProfile`: `"TxDefaultProfile"`; `TxProfile`: `"TxProfile"`; \}\>; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isActive`: `ZodDefault`\<`ZodBoolean`\>; `recurrencyKind`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Daily`: `"Daily"`; `Weekly`: `"Weekly"`; \}\>\>\>; `stackLevel`: `ZodNumber`; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `transactionDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `validFrom`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `validTo`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `ChargingProfileCreateSchema` | [00_Base/src/interfaces/dto/charging.profile.dto.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.profile.dto.ts#L53) |
