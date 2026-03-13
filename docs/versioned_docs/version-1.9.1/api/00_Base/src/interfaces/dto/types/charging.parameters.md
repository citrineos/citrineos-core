[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/charging.parameters

# 00_Base/src/interfaces/dto/types/charging.parameters

## Type Aliases

### ACChargingParametersType

```ts
type ACChargingParametersType = z.infer<typeof ACChargingParametersSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/charging.parameters.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/charging.parameters.ts#L14)

---

### DCChargingParametersType

```ts
type DCChargingParametersType = z.infer<typeof DCChargingParametersSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/charging.parameters.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/charging.parameters.ts#L27)

## Variables

### ACChargingParametersSchema

```ts
const ACChargingParametersSchema: ZodObject<
  {
    energyAmount: ZodNumber;
    evMaxCurrent: ZodNumber;
    evMaxVoltage: ZodNumber;
    evMinCurrent: ZodNumber;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/charging.parameters.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/charging.parameters.ts#L7)

---

### DCChargingParametersSchema

```ts
const DCChargingParametersSchema: ZodObject<
  {
    bulkSoC: ZodOptional<ZodNullable<ZodNumber>>;
    energyAmount: ZodOptional<ZodNullable<ZodNumber>>;
    evEnergyCapacity: ZodOptional<ZodNullable<ZodNumber>>;
    evMaxCurrent: ZodNumber;
    evMaxPower: ZodOptional<ZodNullable<ZodNumber>>;
    evMaxVoltage: ZodNumber;
    fullSoC: ZodOptional<ZodNullable<ZodNumber>>;
    stateOfCharge: ZodOptional<ZodNullable<ZodNumber>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/charging.parameters.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/charging.parameters.ts#L16)
