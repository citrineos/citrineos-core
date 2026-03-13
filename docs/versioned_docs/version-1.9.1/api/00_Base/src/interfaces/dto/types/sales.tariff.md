[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/sales.tariff

# 00_Base/src/interfaces/dto/types/sales.tariff

## Type Aliases

### ConsumptionCost

```ts
type ConsumptionCost = z.infer<typeof ConsumptionCostSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/sales.tariff.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sales.tariff.ts#L48)

---

### Cost

```ts
type Cost = z.infer<typeof CostSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/sales.tariff.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sales.tariff.ts#L47)

---

### RelativeTimeInterval

```ts
type RelativeTimeInterval = z.infer<typeof RelativeTimeIntervalSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/sales.tariff.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sales.tariff.ts#L46)

---

### SalesTariffEntry

```ts
type SalesTariffEntry = z.infer<typeof SalesTariffEntrySchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/sales.tariff.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sales.tariff.ts#L45)

## Variables

### ConsumptionCostSchema

```ts
const ConsumptionCostSchema: ZodObject<
  {
    cost: ZodUnion<
      readonly [
        ZodTuple<
          [
            ZodObject<
              {
                amount: ZodNumber;
                amountMultiplier: ZodOptional<ZodNullable<ZodNumber>>;
                costKind: ZodEnum<{
                  CarbonDioxideEmission: 'CarbonDioxideEmission';
                  RelativePricePercentage: 'RelativePricePercentage';
                  RenewableGenerationPercentage: 'RenewableGenerationPercentage';
                }>;
                customData: ZodOptional<ZodNullable<ZodAny>>;
              },
              $strip
            >,
          ],
          null
        >,
        ZodTuple<
          [
            ZodObject<
              {
                amount: ZodNumber;
                amountMultiplier: ZodOptional<ZodNullable<ZodNumber>>;
                costKind: ZodEnum<{
                  CarbonDioxideEmission: 'CarbonDioxideEmission';
                  RelativePricePercentage: 'RelativePricePercentage';
                  RenewableGenerationPercentage: 'RenewableGenerationPercentage';
                }>;
                customData: ZodOptional<ZodNullable<ZodAny>>;
              },
              $strip
            >,
            ZodObject<
              {
                amount: ZodNumber;
                amountMultiplier: ZodOptional<ZodNullable<ZodNumber>>;
                costKind: ZodEnum<{
                  CarbonDioxideEmission: 'CarbonDioxideEmission';
                  RelativePricePercentage: 'RelativePricePercentage';
                  RenewableGenerationPercentage: 'RenewableGenerationPercentage';
                }>;
                customData: ZodOptional<ZodNullable<ZodAny>>;
              },
              $strip
            >,
          ],
          null
        >,
        ZodTuple<
          [
            ZodObject<
              {
                amount: ZodNumber;
                amountMultiplier: ZodOptional<ZodNullable<ZodNumber>>;
                costKind: ZodEnum<{
                  CarbonDioxideEmission: 'CarbonDioxideEmission';
                  RelativePricePercentage: 'RelativePricePercentage';
                  RenewableGenerationPercentage: 'RenewableGenerationPercentage';
                }>;
                customData: ZodOptional<ZodNullable<ZodAny>>;
              },
              $strip
            >,
            ZodObject<
              {
                amount: ZodNumber;
                amountMultiplier: ZodOptional<ZodNullable<ZodNumber>>;
                costKind: ZodEnum<{
                  CarbonDioxideEmission: 'CarbonDioxideEmission';
                  RelativePricePercentage: 'RelativePricePercentage';
                  RenewableGenerationPercentage: 'RenewableGenerationPercentage';
                }>;
                customData: ZodOptional<ZodNullable<ZodAny>>;
              },
              $strip
            >,
            ZodObject<
              {
                amount: ZodNumber;
                amountMultiplier: ZodOptional<ZodNullable<ZodNumber>>;
                costKind: ZodEnum<{
                  CarbonDioxideEmission: 'CarbonDioxideEmission';
                  RelativePricePercentage: 'RelativePricePercentage';
                  RenewableGenerationPercentage: 'RenewableGenerationPercentage';
                }>;
                customData: ZodOptional<ZodNullable<ZodAny>>;
              },
              $strip
            >,
          ],
          null
        >,
      ]
    >;
    customData: ZodOptional<ZodNullable<ZodAny>>;
    startValue: ZodNumber;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/sales.tariff.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sales.tariff.ts#L21)

---

### CostSchema

```ts
const CostSchema: ZodObject<
  {
    amount: ZodNumber;
    amountMultiplier: ZodOptional<ZodNullable<ZodNumber>>;
    costKind: ZodEnum<{
      CarbonDioxideEmission: 'CarbonDioxideEmission';
      RelativePricePercentage: 'RelativePricePercentage';
      RenewableGenerationPercentage: 'RenewableGenerationPercentage';
    }>;
    customData: ZodOptional<ZodNullable<ZodAny>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/sales.tariff.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sales.tariff.ts#L14)

---

### RelativeTimeIntervalSchema

```ts
const RelativeTimeIntervalSchema: ZodObject<
  {
    customData: ZodOptional<ZodNullable<ZodAny>>;
    duration: ZodOptional<ZodNullable<ZodNumber>>;
    start: ZodNumber;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/sales.tariff.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sales.tariff.ts#L8)

---

### SalesTariffEntrySchema

```ts
const SalesTariffEntrySchema: ZodObject<{
  consumptionCost: ZodOptional<ZodNullable<ZodUnion<readonly [ZodTuple<[ZodObject<{
     cost: ZodUnion<...>;
     customData: ZodOptional<...>;
     startValue: ZodNumber;
   }, $strip>], null>, ZodTuple<[ZodObject<{
     cost: ZodUnion<...>;
     customData: ZodOptional<...>;
     startValue: ZodNumber;
   }, $strip>, ZodObject<{
     cost: ZodUnion<...>;
     customData: ZodOptional<...>;
     startValue: ZodNumber;
   }, $strip>], null>, ZodTuple<[ZodObject<{
     cost: ZodUnion<...>;
     customData: ZodOptional<...>;
     startValue: ZodNumber;
   }, $strip>, ZodObject<{
     cost: ZodUnion<...>;
     customData: ZodOptional<...>;
     startValue: ZodNumber;
   }, $strip>, ZodObject<{
     cost: ZodUnion<...>;
     customData: ZodOptional<...>;
     startValue: ZodNumber;
  }, $strip>], null>]>>>;
  customData: ZodOptional<ZodNullable<ZodAny>>;
  ePriceLevel: ZodOptional<ZodNullable<ZodNumber>>;
  relativeTimeInterval: ZodObject<{
     customData: ZodOptional<ZodNullable<ZodAny>>;
     duration: ZodOptional<ZodNullable<ZodNumber>>;
     start: ZodNumber;
  }, $strip>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/types/sales.tariff.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sales.tariff.ts#L31)
