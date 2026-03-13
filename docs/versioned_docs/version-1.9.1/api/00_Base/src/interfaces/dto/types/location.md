[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/location

# 00_Base/src/interfaces/dto/types/location

## Type Aliases

### Point

```ts
type Point = z.infer<typeof PointSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/location.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/location.ts#L12)

---

### StatusInfo

```ts
type StatusInfo = z.infer<typeof StatusInfoSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/location.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/location.ts#L22)

## Variables

### LocationHoursSchema

```ts
const LocationHoursSchema: ZodAny;
```

Defined in: [00_Base/src/interfaces/dto/types/location.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/location.ts#L14)

---

### PointSchema

```ts
const PointSchema: ZodObject<
  {
    coordinates: ZodArray<ZodNumber>;
    type: ZodLiteral<'Point'>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/location.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/location.ts#L7)

---

### StatusInfoSchema

```ts
const StatusInfoSchema: ZodObject<
  {
    additionalInfo: ZodOptional<ZodNullable<ZodString>>;
    customData: ZodOptional<ZodNullable<ZodAny>>;
    reasonCode: ZodString;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/location.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/location.ts#L16)
