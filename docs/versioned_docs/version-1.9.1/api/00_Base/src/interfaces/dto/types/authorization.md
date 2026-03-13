[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/authorization

# 00_Base/src/interfaces/dto/types/authorization

## Type Aliases

### AdditionalInfo

```ts
type AdditionalInfo = z.infer<typeof AdditionalInfoSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/authorization.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/authorization.ts#L14)

---

### RealTimeAuthLastAttempt

```ts
type RealTimeAuthLastAttempt = z.infer<typeof RealTimeAuthLastAttemptSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/authorization.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/authorization.ts#L24)

## Variables

### AdditionalInfoSchema

```ts
const AdditionalInfoSchema: ZodObject<
  {
    additionalIdToken: ZodString;
    id: ZodOptional<ZodNumber>;
    type: ZodString;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/authorization.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/authorization.ts#L8)

---

### RealTimeAuthLastAttemptSchema

```ts
const RealTimeAuthLastAttemptSchema: ZodObject<
  {
    connectorId: ZodNumber;
    evseId: ZodOptional<ZodNullable<ZodNumber>>;
    result: ZodEnum<{
      Accepted: 'Accepted';
      Blocked: 'Blocked';
      ConcurrentTx: 'ConcurrentTx';
      Expired: 'Expired';
      Invalid: 'Invalid';
      NoCredit: 'NoCredit';
      NotAllowedTypeEVSE: 'NotAllowedTypeEVSE';
      NotAtThisLocation: 'NotAtThisLocation';
      NotAtThisTime: 'NotAtThisTime';
      Unknown: 'Unknown';
    }>;
    stationId: ZodString;
    timestamp: ZodISODateTime;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/authorization.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/authorization.ts#L16)
