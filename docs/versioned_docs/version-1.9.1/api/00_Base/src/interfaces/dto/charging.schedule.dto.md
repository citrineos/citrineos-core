[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/charging.schedule.dto

# 00_Base/src/interfaces/dto/charging.schedule.dto

## Type Aliases

### ChargingScheduleCreate

```ts
type ChargingScheduleCreate = z.infer<typeof ChargingScheduleCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.schedule.dto.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.schedule.dto.ts#L37)

---

### ChargingScheduleDto

```ts
type ChargingScheduleDto = z.infer<typeof ChargingScheduleSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.schedule.dto.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.schedule.dto.ts#L26)

## Variables

### ChargingScheduleCreateSchema

```ts
const ChargingScheduleCreateSchema: ZodObject<
  {
    chargingProfileDatabaseId: ZodOptional<ZodNumber>;
    chargingRateUnit: ZodEnum<{
      A: 'A';
      W: 'W';
    }>;
    chargingSchedulePeriod: ZodTuple<[ZodAny], ZodAny>;
    duration: ZodOptional<ZodNullable<ZodNumber>>;
    id: ZodNumber;
    minChargingRate: ZodOptional<ZodNullable<ZodNumber>>;
    startSchedule: ZodOptional<ZodNullable<ZodString>>;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    timeBase: ZodOptional<ZodISODateTime>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/charging.schedule.dto.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.schedule.dto.ts#L28)

---

### ChargingScheduleProps

```ts
const ChargingScheduleProps: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.schedule.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.schedule.dto.ts#L24)

#### Type Declaration

| Name                                                                        | Type                          | Defined in |
| --------------------------------------------------------------------------- | ----------------------------- | ---------- |
| <a id="property-chargingprofiledatabaseid"></a> `chargingProfileDatabaseId` | `"chargingProfileDatabaseId"` |            |
| <a id="property-chargingrateunit"></a> `chargingRateUnit`                   | `"chargingRateUnit"`          |            |
| <a id="property-chargingscheduleperiod"></a> `chargingSchedulePeriod`       | `"chargingSchedulePeriod"`    |            |
| <a id="property-createdat"></a> `createdAt`                                 | `"createdAt"`                 |            |
| <a id="property-databaseid"></a> `databaseId`                               | `"databaseId"`                |            |
| <a id="property-duration"></a> `duration`                                   | `"duration"`                  |            |
| <a id="property-id"></a> `id`                                               | `"id"`                        |            |
| <a id="property-minchargingrate"></a> `minChargingRate`                     | `"minChargingRate"`           |            |
| <a id="property-salestariff"></a> `salesTariff`                             | `"salesTariff"`               |            |
| <a id="property-startschedule"></a> `startSchedule`                         | `"startSchedule"`             |            |
| <a id="property-stationid"></a> `stationId`                                 | `"stationId"`                 |            |
| <a id="property-tenant"></a> `tenant`                                       | `"tenant"`                    |            |
| <a id="property-tenantid"></a> `tenantId`                                   | `"tenantId"`                  |            |
| <a id="property-timebase"></a> `timeBase`                                   | `"timeBase"`                  |            |
| <a id="property-updatedat"></a> `updatedAt`                                 | `"updatedAt"`                 |            |

---

### ChargingScheduleSchema

```ts
const ChargingScheduleSchema: ZodObject<{
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
     chargingScheduleDatabaseId: ZodNumber;
     createdAt: ZodOptional<ZodDate>;
     databaseId: ZodNumber;
     id: ZodNumber;
     numEPriceLevels: ZodOptional<ZodNullable<ZodNumber>>;
     salesTariffDescription: ZodOptional<ZodNullable<ZodString>>;
     salesTariffEntry: ZodTuple<[ZodObject<{
        consumptionCost: ZodOptional<ZodNullable<...>>;
        customData: ZodOptional<ZodNullable<...>>;
        ePriceLevel: ZodOptional<ZodNullable<...>>;
        relativeTimeInterval: ZodObject<{
           customData: ...;
           duration: ...;
           start: ...;
        }, $strip>;
      }, $strip>], ZodObject<{
        consumptionCost: ZodOptional<ZodNullable<ZodUnion<...>>>;
        customData: ZodOptional<ZodNullable<ZodAny>>;
        ePriceLevel: ZodOptional<ZodNullable<ZodNumber>>;
        relativeTimeInterval: ZodObject<{
           customData: ZodOptional<...>;
           duration: ZodOptional<...>;
           start: ZodNumber;
        }, $strip>;
     }, $strip>>;
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
  startSchedule: ZodOptional<ZodNullable<ZodString>>;
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
  timeBase: ZodOptional<ZodISODateTime>;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/charging.schedule.dto.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.schedule.dto.ts#L10)

---

### chargingScheduleSchemas

```ts
const chargingScheduleSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.schedule.dto.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.schedule.dto.ts#L39)

#### Type Declaration

| Name                                                                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Default value                  | Defined in                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-chargingschedule"></a> `ChargingSchedule`             | `ZodObject`\<\{ `chargingProfileDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `chargingRateUnit`: `ZodEnum`\<\{ `A`: `"A"`; `W`: `"W"`; \}\>; `chargingSchedulePeriod`: `ZodTuple`\<\[`ZodAny`\], `ZodAny`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `duration`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodNumber`; `minChargingRate`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `salesTariff`: `ZodOptional`\<`ZodObject`\<\{ `chargingScheduleDatabaseId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `id`: `ZodNumber`; `numEPriceLevels`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `salesTariffDescription`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `salesTariffEntry`: `ZodTuple`\<\[`ZodObject`\<\{ `consumptionCost`: `ZodOptional`\<...\>; `customData`: `ZodOptional`\<...\>; `ePriceLevel`: `ZodOptional`\<...\>; `relativeTimeInterval`: `ZodObject`\<..., ...\>; \}, `$strip`\>\], `ZodObject`\<\{ `consumptionCost`: `ZodOptional`\<`ZodNullable`\<...\>\>; `customData`: `ZodOptional`\<`ZodNullable`\<...\>\>; `ePriceLevel`: `ZodOptional`\<`ZodNullable`\<...\>\>; `relativeTimeInterval`: `ZodObject`\<\{ `customData`: ...; `duration`: ...; `start`: ...; \}, `$strip`\>; \}, `$strip`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `startSchedule`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeBase`: `ZodOptional`\<`ZodISODateTime`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `ChargingScheduleSchema`       | [00_Base/src/interfaces/dto/charging.schedule.dto.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.schedule.dto.ts#L40) |
| <a id="property-chargingschedulecreate"></a> `ChargingScheduleCreate` | `ZodObject`\<\{ `chargingProfileDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `chargingRateUnit`: `ZodEnum`\<\{ `A`: `"A"`; `W`: `"W"`; \}\>; `chargingSchedulePeriod`: `ZodTuple`\<\[`ZodAny`\], `ZodAny`\>; `duration`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodNumber`; `minChargingRate`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `startSchedule`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeBase`: `ZodOptional`\<`ZodISODateTime`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `ChargingScheduleCreateSchema` | [00_Base/src/interfaces/dto/charging.schedule.dto.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.schedule.dto.ts#L41) |
