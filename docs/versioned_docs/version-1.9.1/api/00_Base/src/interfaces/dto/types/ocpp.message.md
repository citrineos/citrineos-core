[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/ocpp.message

# 00_Base/src/interfaces/dto/types/ocpp.message

## Type Aliases

### CallActionEnumType

```ts
type CallActionEnumType = z.infer<typeof CallActionSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpp.message.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpp.message.ts#L18)

---

### MessageOriginEnumType

```ts
type MessageOriginEnumType = z.infer<typeof MessageOriginSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpp.message.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpp.message.ts#L19)

---

### MessageStateEnumType

```ts
type MessageStateEnumType = z.infer<typeof MessageStateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpp.message.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpp.message.ts#L20)

---

### OCPPVersionEnumType

```ts
type OCPPVersionEnumType = z.infer<typeof OCPPVersionSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpp.message.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpp.message.ts#L21)

## Variables

### CallActionSchema

```ts
const CallActionSchema: ZodUnion<
  readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]
>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpp.message.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpp.message.ts#L13)

---

### MessageOriginSchema

```ts
const MessageOriginSchema: ZodEnum<typeof MessageOrigin>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpp.message.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpp.message.ts#L14)

---

### MessageStateSchema

```ts
const MessageStateSchema: ZodEnum<typeof MessageState>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpp.message.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpp.message.ts#L15)

---

### OCPPVersionSchema

```ts
const OCPPVersionSchema: ZodEnum<typeof OCPPVersion>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpp.message.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpp.message.ts#L16)
