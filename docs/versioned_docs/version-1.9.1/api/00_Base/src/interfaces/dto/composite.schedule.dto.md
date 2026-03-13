[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/composite.schedule.dto

# 00_Base/src/interfaces/dto/composite.schedule.dto

## Type Aliases

### CompositeScheduleCreate

```ts
type CompositeScheduleCreate = z.infer<typeof CompositeScheduleCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/composite.schedule.dto.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/composite.schedule.dto.ts#L29)

---

### CompositeScheduleDto

```ts
type CompositeScheduleDto = z.infer<typeof CompositeScheduleSchema>;
```

Defined in: [00_Base/src/interfaces/dto/composite.schedule.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/composite.schedule.dto.ts#L20)

## Variables

### CompositeScheduleCreateSchema

```ts
const CompositeScheduleCreateSchema: ZodObject<
  {
    chargingRateUnit: ZodString;
    chargingSchedulePeriod: ZodTuple<[ZodAny], ZodAny>;
    duration: ZodNumber;
    evseId: ZodNumber;
    scheduleStart: ZodISODateTime;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/composite.schedule.dto.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/composite.schedule.dto.ts#L22)

---

### CompositeScheduleProps

```ts
const CompositeScheduleProps: object;
```

Defined in: [00_Base/src/interfaces/dto/composite.schedule.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/composite.schedule.dto.ts#L18)

#### Type Declaration

| Name                                                                  | Type                       | Defined in |
| --------------------------------------------------------------------- | -------------------------- | ---------- |
| <a id="property-chargingrateunit"></a> `chargingRateUnit`             | `"chargingRateUnit"`       |            |
| <a id="property-chargingscheduleperiod"></a> `chargingSchedulePeriod` | `"chargingSchedulePeriod"` |            |
| <a id="property-createdat"></a> `createdAt`                           | `"createdAt"`              |            |
| <a id="property-duration"></a> `duration`                             | `"duration"`               |            |
| <a id="property-evseid"></a> `evseId`                                 | `"evseId"`                 |            |
| <a id="property-id"></a> `id`                                         | `"id"`                     |            |
| <a id="property-schedulestart"></a> `scheduleStart`                   | `"scheduleStart"`          |            |
| <a id="property-stationid"></a> `stationId`                           | `"stationId"`              |            |
| <a id="property-tenant"></a> `tenant`                                 | `"tenant"`                 |            |
| <a id="property-tenantid"></a> `tenantId`                             | `"tenantId"`               |            |
| <a id="property-updatedat"></a> `updatedAt`                           | `"updatedAt"`              |            |

---

### CompositeScheduleSchema

```ts
const CompositeScheduleSchema: ZodObject<{
  chargingRateUnit: ZodString;
  chargingSchedulePeriod: ZodTuple<[ZodAny], ZodAny>;
  createdAt: ZodOptional<ZodDate>;
  duration: ZodNumber;
  evseId: ZodNumber;
  id: ZodOptional<ZodNumber>;
  scheduleStart: ZodISODateTime;
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

Defined in: [00_Base/src/interfaces/dto/composite.schedule.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/composite.schedule.dto.ts#L8)

---

### compositeScheduleSchemas

```ts
const compositeScheduleSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/composite.schedule.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/composite.schedule.dto.ts#L31)

#### Type Declaration

| Name                                                                    | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Default value                   | Defined in                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-compositeschedule"></a> `CompositeSchedule`             | `ZodObject`\<\{ `chargingRateUnit`: `ZodString`; `chargingSchedulePeriod`: `ZodTuple`\<\[`ZodAny`\], `ZodAny`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `duration`: `ZodNumber`; `evseId`: `ZodNumber`; `id`: `ZodOptional`\<`ZodNumber`\>; `scheduleStart`: `ZodISODateTime`; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `CompositeScheduleSchema`       | [00_Base/src/interfaces/dto/composite.schedule.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/composite.schedule.dto.ts#L32) |
| <a id="property-compositeschedulecreate"></a> `CompositeScheduleCreate` | `ZodObject`\<\{ `chargingRateUnit`: `ZodString`; `chargingSchedulePeriod`: `ZodTuple`\<\[`ZodAny`\], `ZodAny`\>; `duration`: `ZodNumber`; `evseId`: `ZodNumber`; `scheduleStart`: `ZodISODateTime`; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `CompositeScheduleCreateSchema` | [00_Base/src/interfaces/dto/composite.schedule.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/composite.schedule.dto.ts#L33) |
