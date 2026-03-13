[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/sales.tariff.dto

# 00_Base/src/interfaces/dto/sales.tariff.dto

## Type Aliases

### SalesTariffCreate

```ts
type SalesTariffCreate = z.infer<typeof SalesTariffCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/sales.tariff.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/sales.tariff.dto.ts#L30)

---

### SalesTariffDto

```ts
type SalesTariffDto = z.infer<typeof SalesTariffSchema>;
```

Defined in: [00_Base/src/interfaces/dto/sales.tariff.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/sales.tariff.dto.ts#L20)

## Variables

### SalesTariffCreateSchema

```ts
const SalesTariffCreateSchema: ZodObject<{
  chargingScheduleDatabaseId: ZodNumber;
  id: ZodNumber;
  numEPriceLevels: ZodOptional<ZodNullable<ZodNumber>>;
  salesTariffDescription: ZodOptional<ZodNullable<ZodString>>;
  salesTariffEntry: ZodTuple<[ZodObject<{
     consumptionCost: ZodOptional<ZodNullable<ZodUnion<readonly [ZodTuple<..., ...>, ZodTuple<..., ...>, ZodTuple<..., ...>]>>>;
     customData: ZodOptional<ZodNullable<ZodAny>>;
     ePriceLevel: ZodOptional<ZodNullable<ZodNumber>>;
     relativeTimeInterval: ZodObject<{
        customData: ZodOptional<ZodNullable<ZodAny>>;
        duration: ZodOptional<ZodNullable<ZodNumber>>;
        start: ZodNumber;
     }, $strip>;
   }, $strip>], ZodObject<{
     consumptionCost: ZodOptional<ZodNullable<ZodUnion<readonly [ZodTuple<[...], null>, ZodTuple<[..., ...], null>, ZodTuple<[..., ..., ...], null>]>>>;
     customData: ZodOptional<ZodNullable<ZodAny>>;
     ePriceLevel: ZodOptional<ZodNullable<ZodNumber>>;
     relativeTimeInterval: ZodObject<{
        customData: ZodOptional<ZodNullable<ZodAny>>;
        duration: ZodOptional<ZodNullable<ZodNumber>>;
        start: ZodNumber;
     }, $strip>;
  }, $strip>>;
  tenantId: ZodOptional<ZodNumber>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/sales.tariff.dto.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/sales.tariff.dto.ts#L22)

---

### SalesTariffProps

```ts
const SalesTariffProps: object;
```

Defined in: [00_Base/src/interfaces/dto/sales.tariff.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/sales.tariff.dto.ts#L18)

#### Type Declaration

| Name                                                                          | Type                           | Defined in |
| ----------------------------------------------------------------------------- | ------------------------------ | ---------- |
| <a id="property-chargingscheduledatabaseid"></a> `chargingScheduleDatabaseId` | `"chargingScheduleDatabaseId"` |            |
| <a id="property-createdat"></a> `createdAt`                                   | `"createdAt"`                  |            |
| <a id="property-databaseid"></a> `databaseId`                                 | `"databaseId"`                 |            |
| <a id="property-id"></a> `id`                                                 | `"id"`                         |            |
| <a id="property-numepricelevels"></a> `numEPriceLevels`                       | `"numEPriceLevels"`            |            |
| <a id="property-salestariffdescription"></a> `salesTariffDescription`         | `"salesTariffDescription"`     |            |
| <a id="property-salestariffentry"></a> `salesTariffEntry`                     | `"salesTariffEntry"`           |            |
| <a id="property-tenant"></a> `tenant`                                         | `"tenant"`                     |            |
| <a id="property-tenantid"></a> `tenantId`                                     | `"tenantId"`                   |            |
| <a id="property-updatedat"></a> `updatedAt`                                   | `"updatedAt"`                  |            |

---

### SalesTariffSchema

```ts
const SalesTariffSchema: ZodObject<{
  chargingScheduleDatabaseId: ZodNumber;
  createdAt: ZodOptional<ZodDate>;
  databaseId: ZodNumber;
  id: ZodNumber;
  numEPriceLevels: ZodOptional<ZodNullable<ZodNumber>>;
  salesTariffDescription: ZodOptional<ZodNullable<ZodString>>;
  salesTariffEntry: ZodTuple<[ZodObject<{
     consumptionCost: ZodOptional<ZodNullable<ZodUnion<readonly [ZodTuple<..., ...>, ZodTuple<..., ...>, ZodTuple<..., ...>]>>>;
     customData: ZodOptional<ZodNullable<ZodAny>>;
     ePriceLevel: ZodOptional<ZodNullable<ZodNumber>>;
     relativeTimeInterval: ZodObject<{
        customData: ZodOptional<ZodNullable<ZodAny>>;
        duration: ZodOptional<ZodNullable<ZodNumber>>;
        start: ZodNumber;
     }, $strip>;
   }, $strip>], ZodObject<{
     consumptionCost: ZodOptional<ZodNullable<ZodUnion<readonly [ZodTuple<[...], null>, ZodTuple<[..., ...], null>, ZodTuple<[..., ..., ...], null>]>>>;
     customData: ZodOptional<ZodNullable<ZodAny>>;
     ePriceLevel: ZodOptional<ZodNullable<ZodNumber>>;
     relativeTimeInterval: ZodObject<{
        customData: ZodOptional<ZodNullable<ZodAny>>;
        duration: ZodOptional<ZodNullable<ZodNumber>>;
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

Defined in: [00_Base/src/interfaces/dto/sales.tariff.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/sales.tariff.dto.ts#L9)

---

### salesTariffSchemas

```ts
const salesTariffSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/sales.tariff.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/sales.tariff.dto.ts#L32)

#### Type Declaration

| Name                                                        | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Default value             | Defined in                                                                                                                                                                                        |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-salestariff"></a> `SalesTariff`             | `ZodObject`\<\{ `chargingScheduleDatabaseId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `id`: `ZodNumber`; `numEPriceLevels`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `salesTariffDescription`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `salesTariffEntry`: `ZodTuple`\<\[`ZodObject`\<\{ `consumptionCost`: `ZodOptional`\<`ZodNullable`\<`ZodUnion`\<readonly \[..., ..., ...\]\>\>\>; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `ePriceLevel`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `relativeTimeInterval`: `ZodObject`\<\{ `customData`: `ZodOptional`\<`ZodNullable`\<...\>\>; `duration`: `ZodOptional`\<`ZodNullable`\<...\>\>; `start`: `ZodNumber`; \}, `$strip`\>; \}, `$strip`\>\], `ZodObject`\<\{ `consumptionCost`: `ZodOptional`\<`ZodNullable`\<`ZodUnion`\<readonly \[`ZodTuple`\<..., ...\>, `ZodTuple`\<..., ...\>, `ZodTuple`\<..., ...\>\]\>\>\>; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `ePriceLevel`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `relativeTimeInterval`: `ZodObject`\<\{ `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `duration`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `start`: `ZodNumber`; \}, `$strip`\>; \}, `$strip`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `SalesTariffSchema`       | [00_Base/src/interfaces/dto/sales.tariff.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/sales.tariff.dto.ts#L33) |
| <a id="property-salestariffcreate"></a> `SalesTariffCreate` | `ZodObject`\<\{ `chargingScheduleDatabaseId`: `ZodNumber`; `id`: `ZodNumber`; `numEPriceLevels`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `salesTariffDescription`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `salesTariffEntry`: `ZodTuple`\<\[`ZodObject`\<\{ `consumptionCost`: `ZodOptional`\<`ZodNullable`\<`ZodUnion`\<readonly \[..., ..., ...\]\>\>\>; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `ePriceLevel`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `relativeTimeInterval`: `ZodObject`\<\{ `customData`: `ZodOptional`\<`ZodNullable`\<...\>\>; `duration`: `ZodOptional`\<`ZodNullable`\<...\>\>; `start`: `ZodNumber`; \}, `$strip`\>; \}, `$strip`\>\], `ZodObject`\<\{ `consumptionCost`: `ZodOptional`\<`ZodNullable`\<`ZodUnion`\<readonly \[`ZodTuple`\<..., ...\>, `ZodTuple`\<..., ...\>, `ZodTuple`\<..., ...\>\]\>\>\>; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `ePriceLevel`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `relativeTimeInterval`: `ZodObject`\<\{ `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `duration`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `start`: `ZodNumber`; \}, `$strip`\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `SalesTariffCreateSchema` | [00_Base/src/interfaces/dto/sales.tariff.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/sales.tariff.dto.ts#L34) |
