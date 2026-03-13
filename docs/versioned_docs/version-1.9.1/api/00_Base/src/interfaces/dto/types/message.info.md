[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/message.info

# 00_Base/src/interfaces/dto/types/message.info

## Type Aliases

### MessageContent

```ts
type MessageContent = z.infer<typeof MessageContentSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/message.info.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/message.info.ts#L15)

## Variables

### MessageContentSchema

```ts
const MessageContentSchema: ZodObject<
  {
    content: ZodString;
    customData: ZodOptional<ZodNullable<ZodAny>>;
    format: ZodEnum<{
      ASCII: 'ASCII';
      HTML: 'HTML';
      URI: 'URI';
      UTF8: 'UTF8';
    }>;
    language: ZodOptional<ZodNullable<ZodString>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/message.info.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/message.info.ts#L8)
