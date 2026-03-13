[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/tenant.dto

# 00_Base/src/interfaces/dto/tenant.dto

## Type Aliases

### TenantCreate

```ts
type TenantCreate = z.infer<typeof TenantCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/tenant.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L30)

---

### TenantDto

```ts
type TenantDto = z.infer<typeof TenantSchema>;
```

Defined in: [00_Base/src/interfaces/dto/tenant.dto.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L22)

---

### TenantUpdate

```ts
type TenantUpdate = z.infer<typeof TenantUpdateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/tenant.dto.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L37)

## Variables

### TenantCreateSchema

```ts
const TenantCreateSchema: ZodObject<{
  countryCode: ZodOptional<ZodNullable<ZodString>>;
  isUserTenant: ZodDefault<ZodBoolean>;
  name: ZodString;
  partyId: ZodOptional<ZodNullable<ZodString>>;
  serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<{
     credentialsRole: ZodObject<{
        businessDetails: ZodObject<{
           logo: ZodOptional<...>;
           name: ZodString;
           website: ZodOptional<...>;
        }, $strip>;
        role: ZodEnum<{
           CPO: "CPO";
           EMSP: "EMSP";
           HUB: "HUB";
           NAP: "NAP";
           NSP: "NSP";
           SCSP: "SCSP";
        }>;
     }, $strip>;
     versionDetails: ZodArray<ZodObject<{
        version: ZodEnum<{
           2.2.1: ...;
        }>;
        versionDetailsUrl: ZodOptional<ZodString>;
     }, $strip>>;
     versionEndpoints: ZodRecord<ZodString, ZodArray<ZodObject<{
        identifier: ZodString;
        url: ZodString;
     }, $strip>>>;
  }, $strip>>>;
  url: ZodOptional<ZodNullable<ZodString>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/tenant.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L24)

---

### TenantProps

```ts
const TenantProps: object;
```

Defined in: [00_Base/src/interfaces/dto/tenant.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L20)

#### Type Declaration

| Name                                                        | Type                  | Defined in |
| ----------------------------------------------------------- | --------------------- | ---------- |
| <a id="property-countrycode"></a> `countryCode`             | `"countryCode"`       |            |
| <a id="property-createdat"></a> `createdAt`                 | `"createdAt"`         |            |
| <a id="property-id"></a> `id`                               | `"id"`                |            |
| <a id="property-isusertenant"></a> `isUserTenant`           | `"isUserTenant"`      |            |
| <a id="property-name"></a> `name`                           | `"name"`              |            |
| <a id="property-partyid"></a> `partyId`                     | `"partyId"`           |            |
| <a id="property-serverprofileocpi"></a> `serverProfileOCPI` | `"serverProfileOCPI"` |            |
| <a id="property-updatedat"></a> `updatedAt`                 | `"updatedAt"`         |            |
| <a id="property-url"></a> `url`                             | `"url"`               |            |

---

### TenantSchema

```ts
const TenantSchema: ZodObject<{
  countryCode: ZodOptional<ZodNullable<ZodString>>;
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  isUserTenant: ZodDefault<ZodBoolean>;
  name: ZodString;
  partyId: ZodOptional<ZodNullable<ZodString>>;
  serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<{
     credentialsRole: ZodObject<{
        businessDetails: ZodObject<{
           logo: ZodOptional<...>;
           name: ZodString;
           website: ZodOptional<...>;
        }, $strip>;
        role: ZodEnum<{
           CPO: "CPO";
           EMSP: "EMSP";
           HUB: "HUB";
           NAP: "NAP";
           NSP: "NSP";
           SCSP: "SCSP";
        }>;
     }, $strip>;
     versionDetails: ZodArray<ZodObject<{
        version: ZodEnum<{
           2.2.1: ...;
        }>;
        versionDetailsUrl: ZodOptional<ZodString>;
     }, $strip>>;
     versionEndpoints: ZodRecord<ZodString, ZodArray<ZodObject<{
        identifier: ZodString;
        url: ZodString;
     }, $strip>>>;
  }, $strip>>>;
  updatedAt: ZodOptional<ZodDate>;
  url: ZodOptional<ZodNullable<ZodString>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/tenant.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L8)

---

### tenantSchemas

```ts
const tenantSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/tenant.dto.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L39)

#### Type Declaration

| Name                                              | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Default value        | Defined in                                                                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-tenant"></a> `Tenant`             | `ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<\{ `businessDetails`: `ZodObject`\<\{ `logo`: ...; `name`: ...; `website`: ...; \}, `$strip`\>; `role`: `ZodEnum`\<\{ `CPO`: ...; `EMSP`: ...; `HUB`: ...; `NAP`: ...; `NSP`: ...; `SCSP`: ...; \}\>; \}, `$strip`\>; `versionDetails`: `ZodArray`\<`ZodObject`\<\{ `version`: `ZodEnum`\<...\>; `versionDetailsUrl`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `versionEndpoints`: `ZodRecord`\<`ZodString`, `ZodArray`\<`ZodObject`\<\{ `identifier`: ...; `url`: ...; \}, `$strip`\>\>\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\> | `TenantSchema`       | [00_Base/src/interfaces/dto/tenant.dto.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L40) |
| <a id="property-tenantcreate"></a> `TenantCreate` | `ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<\{ `businessDetails`: `ZodObject`\<\{ `logo`: ...; `name`: ...; `website`: ...; \}, `$strip`\>; `role`: `ZodEnum`\<\{ `CPO`: ...; `EMSP`: ...; `HUB`: ...; `NAP`: ...; `NSP`: ...; `SCSP`: ...; \}\>; \}, `$strip`\>; `versionDetails`: `ZodArray`\<`ZodObject`\<\{ `version`: `ZodEnum`\<...\>; `versionDetailsUrl`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `versionEndpoints`: `ZodRecord`\<`ZodString`, `ZodArray`\<`ZodObject`\<\{ `identifier`: ...; `url`: ...; \}, `$strip`\>\>\>; \}, `$strip`\>\>\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>                                                                                                                       | `TenantCreateSchema` | [00_Base/src/interfaces/dto/tenant.dto.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L41) |
| <a id="property-tenantupdate"></a> `TenantUpdate` | `ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; `id`: `ZodOptional`\<`ZodOptional`\<`ZodNumber`\>\>; `isUserTenant`: `ZodOptional`\<`ZodDefault`\<`ZodBoolean`\>\>; `name`: `ZodOptional`\<`ZodString`\>; `partyId`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<\{ `businessDetails`: `ZodObject`\<..., ...\>; `role`: `ZodEnum`\<...\>; \}, `$strip`\>; `versionDetails`: `ZodArray`\<`ZodObject`\<\{ `version`: ...; `versionDetailsUrl`: ...; \}, `$strip`\>\>; `versionEndpoints`: `ZodRecord`\<`ZodString`, `ZodArray`\<`ZodObject`\<..., ...\>\>\>; \}, `$strip`\>\>\>\>; `url`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; \}, `$strip`\>                                                                                                                                                             | `TenantUpdateSchema` | [00_Base/src/interfaces/dto/tenant.dto.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L42) |

---

### TenantUpdateSchema

```ts
const TenantUpdateSchema: ZodObject<{
  countryCode: ZodOptional<ZodOptional<ZodNullable<ZodString>>>;
  id: ZodOptional<ZodOptional<ZodNumber>>;
  isUserTenant: ZodOptional<ZodDefault<ZodBoolean>>;
  name: ZodOptional<ZodString>;
  partyId: ZodOptional<ZodOptional<ZodNullable<ZodString>>>;
  serverProfileOCPI: ZodOptional<ZodOptional<ZodNullable<ZodObject<{
     credentialsRole: ZodObject<{
        businessDetails: ZodObject<{
           logo: ...;
           name: ...;
           website: ...;
        }, $strip>;
        role: ZodEnum<{
           CPO: ...;
           EMSP: ...;
           HUB: ...;
           NAP: ...;
           NSP: ...;
           SCSP: ...;
        }>;
     }, $strip>;
     versionDetails: ZodArray<ZodObject<{
        version: ZodEnum<...>;
        versionDetailsUrl: ZodOptional<...>;
     }, $strip>>;
     versionEndpoints: ZodRecord<ZodString, ZodArray<ZodObject<{
        identifier: ...;
        url: ...;
     }, $strip>>>;
  }, $strip>>>>;
  url: ZodOptional<ZodOptional<ZodNullable<ZodString>>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/tenant.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.dto.ts#L32)
