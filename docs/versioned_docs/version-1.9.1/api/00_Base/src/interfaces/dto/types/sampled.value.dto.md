[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/sampled.value.dto

# 00_Base/src/interfaces/dto/types/sampled.value.dto

## Type Aliases

### SampledValue

```ts
type SampledValue = z.infer<typeof SampledValueSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/sampled.value.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sampled.value.dto.ts#L35)

---

### SignedMeterValue

```ts
type SignedMeterValue = z.infer<typeof SignedMeterValueSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/sampled.value.dto.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sampled.value.dto.ts#L37)

---

### UnitOfMeasure

```ts
type UnitOfMeasure = z.infer<typeof UnitOfMeasureSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/sampled.value.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sampled.value.dto.ts#L36)

## Variables

### SampledValueSchema

```ts
const SampledValueSchema: ZodObject<{
  context: ZodOptional<ZodNullable<ZodEnum<{
     Interruption.Begin: "Interruption.Begin";
     Interruption.End: "Interruption.End";
     Other: "Other";
     Sample.Clock: "Sample.Clock";
     Sample.Periodic: "Sample.Periodic";
     Transaction.Begin: "Transaction.Begin";
     Transaction.End: "Transaction.End";
     Trigger: "Trigger";
  }>>>;
  location: ZodOptional<ZodNullable<ZodEnum<{
     Body: "Body";
     Cable: "Cable";
     EV: "EV";
     Inlet: "Inlet";
     Outlet: "Outlet";
  }>>>;
  measurand: ZodOptional<ZodNullable<ZodEnum<{
     Current.Export: "Current.Export";
     Current.Import: "Current.Import";
     Current.Offered: "Current.Offered";
     Energy.Active.Export.Interval: "Energy.Active.Export.Interval";
     Energy.Active.Export.Register: "Energy.Active.Export.Register";
     Energy.Active.Import.Interval: "Energy.Active.Import.Interval";
     Energy.Active.Import.Register: "Energy.Active.Import.Register";
     Energy.Active.Net: "Energy.Active.Net";
     Energy.Apparent.Export: "Energy.Apparent.Export";
     Energy.Apparent.Import: "Energy.Apparent.Import";
     Energy.Apparent.Net: "Energy.Apparent.Net";
     Energy.Reactive.Export.Interval: "Energy.Reactive.Export.Interval";
     Energy.Reactive.Export.Register: "Energy.Reactive.Export.Register";
     Energy.Reactive.Import.Interval: "Energy.Reactive.Import.Interval";
     Energy.Reactive.Import.Register: "Energy.Reactive.Import.Register";
     Energy.Reactive.Net: "Energy.Reactive.Net";
     Frequency: "Frequency";
     Power.Active.Export: "Power.Active.Export";
     Power.Active.Import: "Power.Active.Import";
     Power.Factor: "Power.Factor";
     Power.Offered: "Power.Offered";
     Power.Reactive.Export: "Power.Reactive.Export";
     Power.Reactive.Import: "Power.Reactive.Import";
     RPM: "RPM";
     SoC: "SoC";
     Temperature: "Temperature";
     Voltage: "Voltage";
  }>>>;
  phase: ZodOptional<ZodNullable<ZodEnum<{
     L1: "L1";
     L1-L2: "L1-L2";
     L1-N: "L1-N";
     L2: "L2";
     L2-L3: "L2-L3";
     L2-N: "L2-N";
     L3: "L3";
     L3-L1: "L3-L1";
     L3-N: "L3-N";
     N: "N";
  }>>>;
  signedMeterValue: ZodOptional<ZodNullable<ZodObject<{
     encodingMethod: ZodString;
     publicKey: ZodString;
     signedMeterData: ZodString;
     signingMethod: ZodString;
  }, $strip>>>;
  unitOfMeasure: ZodOptional<ZodNullable<ZodObject<{
     multiplier: ZodOptional<ZodNullable<ZodNumber>>;
     unit: ZodOptional<ZodNullable<ZodString>>;
  }, $strip>>>;
  value: ZodNumber;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/types/sampled.value.dto.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sampled.value.dto.ts#L25)

---

### SignedMeterValueSchema

```ts
const SignedMeterValueSchema: ZodObject<
  {
    encodingMethod: ZodString;
    publicKey: ZodString;
    signedMeterData: ZodString;
    signingMethod: ZodString;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/sampled.value.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sampled.value.dto.ts#L18)

---

### UnitOfMeasureSchema

```ts
const UnitOfMeasureSchema: ZodObject<
  {
    multiplier: ZodOptional<ZodNullable<ZodNumber>>;
    unit: ZodOptional<ZodNullable<ZodString>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/sampled.value.dto.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/sampled.value.dto.ts#L13)
