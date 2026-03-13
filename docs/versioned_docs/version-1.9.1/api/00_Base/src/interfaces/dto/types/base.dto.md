[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/base.dto

# 00_Base/src/interfaces/dto/types/base.dto

## Type Aliases

### BaseDto

```ts
type BaseDto = z.infer<typeof BaseSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/base.dto.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/base.dto.ts#L17)

## Variables

### BaseProps

```ts
const BaseProps: object;
```

Defined in: [00_Base/src/interfaces/dto/types/base.dto.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/base.dto.ts#L15)

#### Type Declaration

| Name                                        | Type          | Defined in |
| ------------------------------------------- | ------------- | ---------- |
| <a id="property-createdat"></a> `createdAt` | `"createdAt"` |            |
| <a id="property-tenant"></a> `tenant`       | `"tenant"`    |            |
| <a id="property-tenantid"></a> `tenantId`   | `"tenantId"`  |            |
| <a id="property-updatedat"></a> `updatedAt` | `"updatedAt"` |            |

---

### BaseSchema

```ts
const BaseSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
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

Defined in: [00_Base/src/interfaces/dto/types/base.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/base.dto.ts#L8)
