[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/tenant.partner.dto

# 00_Base/src/interfaces/dto/tenant.partner.dto

## Type Aliases

### TenantPartnerCreate

```ts
type TenantPartnerCreate = z.infer<typeof TenantPartnerCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/tenant.partner.dto.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.partner.dto.ts#L27)

---

### TenantPartnerDto

```ts
type TenantPartnerDto = z.infer<typeof TenantPartnerSchema>;
```

Defined in: [00_Base/src/interfaces/dto/tenant.partner.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.partner.dto.ts#L18)

## Variables

### TenantPartnerCreateSchema

```ts
const TenantPartnerCreateSchema: ZodObject<{
  countryCode: ZodOptional<ZodNullable<ZodString>>;
  partnerProfileOCPI: ZodObject<{
     credentials: ZodOptional<ZodObject<{
        certificateRef: ZodOptional<ZodString>;
        token: ZodOptional<ZodString>;
        versionsUrl: ZodString;
     }, $strip>>;
     endpoints: ZodOptional<ZodArray<ZodObject<{
        identifier: ZodString;
        url: ZodString;
     }, $strip>>>;
     roles: ZodOptional<ZodArray<ZodObject<{
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
     }, $strip>>>;
     serverCredentials: ZodObject<{
        certificateRef: ZodOptional<ZodString>;
        token: ZodOptional<ZodString>;
        versionsUrl: ZodString;
     }, $strip>;
     version: ZodObject<{
        version: ZodEnum<{
           2.2.1: "2.2.1";
        }>;
        versionDetailsUrl: ZodOptional<ZodString>;
     }, $strip>;
  }, $strip>;
  partyId: ZodOptional<ZodNullable<ZodString>>;
  tenantId: ZodOptional<ZodNumber>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/tenant.partner.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.partner.dto.ts#L20)

---

### TenantPartnerProps

```ts
const TenantPartnerProps: object;
```

Defined in: [00_Base/src/interfaces/dto/tenant.partner.dto.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.partner.dto.ts#L16)

#### Type Declaration

| Name                                                          | Type                   | Defined in |
| ------------------------------------------------------------- | ---------------------- | ---------- |
| <a id="property-countrycode"></a> `countryCode`               | `"countryCode"`        |            |
| <a id="property-createdat"></a> `createdAt`                   | `"createdAt"`          |            |
| <a id="property-id"></a> `id`                                 | `"id"`                 |            |
| <a id="property-partnerprofileocpi"></a> `partnerProfileOCPI` | `"partnerProfileOCPI"` |            |
| <a id="property-partyid"></a> `partyId`                       | `"partyId"`            |            |
| <a id="property-tenant"></a> `tenant`                         | `"tenant"`             |            |
| <a id="property-tenantid"></a> `tenantId`                     | `"tenantId"`           |            |
| <a id="property-updatedat"></a> `updatedAt`                   | `"updatedAt"`          |            |

---

### TenantPartnerSchema

```ts
const TenantPartnerSchema: ZodObject<{
  countryCode: ZodOptional<ZodNullable<ZodString>>;
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  partnerProfileOCPI: ZodObject<{
     credentials: ZodOptional<ZodObject<{
        certificateRef: ZodOptional<ZodString>;
        token: ZodOptional<ZodString>;
        versionsUrl: ZodString;
     }, $strip>>;
     endpoints: ZodOptional<ZodArray<ZodObject<{
        identifier: ZodString;
        url: ZodString;
     }, $strip>>>;
     roles: ZodOptional<ZodArray<ZodObject<{
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
     }, $strip>>>;
     serverCredentials: ZodObject<{
        certificateRef: ZodOptional<ZodString>;
        token: ZodOptional<ZodString>;
        versionsUrl: ZodString;
     }, $strip>;
     version: ZodObject<{
        version: ZodEnum<{
           2.2.1: "2.2.1";
        }>;
        versionDetailsUrl: ZodOptional<ZodString>;
     }, $strip>;
  }, $strip>;
  partyId: ZodOptional<ZodNullable<ZodString>>;
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

Defined in: [00_Base/src/interfaces/dto/tenant.partner.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.partner.dto.ts#L9)

---

### tenantPartnerSchemas

```ts
const tenantPartnerSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/tenant.partner.dto.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.partner.dto.ts#L29)

#### Type Declaration

| Name                                                            | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Default value               | Defined in                                                                                                                                                                                            |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-tenantpartner"></a> `TenantPartner`             | `ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `partnerProfileOCPI`: `ZodObject`\<\{ `credentials`: `ZodOptional`\<`ZodObject`\<\{ `certificateRef`: `ZodOptional`\<`ZodString`\>; `token`: `ZodOptional`\<`ZodString`\>; `versionsUrl`: `ZodString`; \}, `$strip`\>\>; `endpoints`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `identifier`: `ZodString`; `url`: `ZodString`; \}, `$strip`\>\>\>; `roles`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `businessDetails`: `ZodObject`\<\{ `logo`: ...; `name`: ...; `website`: ...; \}, `$strip`\>; `role`: `ZodEnum`\<\{ `CPO`: ...; `EMSP`: ...; `HUB`: ...; `NAP`: ...; `NSP`: ...; `SCSP`: ...; \}\>; \}, `$strip`\>\>\>; `serverCredentials`: `ZodObject`\<\{ `certificateRef`: `ZodOptional`\<`ZodString`\>; `token`: `ZodOptional`\<`ZodString`\>; `versionsUrl`: `ZodString`; \}, `$strip`\>; `version`: `ZodObject`\<\{ `version`: `ZodEnum`\<\{ `2.2.1`: `"2.2.1"`; \}\>; `versionDetailsUrl`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>; \}, `$strip`\>; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `TenantPartnerSchema`       | [00_Base/src/interfaces/dto/tenant.partner.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.partner.dto.ts#L30) |
| <a id="property-tenantpartnercreate"></a> `TenantPartnerCreate` | `ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `partnerProfileOCPI`: `ZodObject`\<\{ `credentials`: `ZodOptional`\<`ZodObject`\<\{ `certificateRef`: `ZodOptional`\<`ZodString`\>; `token`: `ZodOptional`\<`ZodString`\>; `versionsUrl`: `ZodString`; \}, `$strip`\>\>; `endpoints`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `identifier`: `ZodString`; `url`: `ZodString`; \}, `$strip`\>\>\>; `roles`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `businessDetails`: `ZodObject`\<\{ `logo`: ...; `name`: ...; `website`: ...; \}, `$strip`\>; `role`: `ZodEnum`\<\{ `CPO`: ...; `EMSP`: ...; `HUB`: ...; `NAP`: ...; `NSP`: ...; `SCSP`: ...; \}\>; \}, `$strip`\>\>\>; `serverCredentials`: `ZodObject`\<\{ `certificateRef`: `ZodOptional`\<`ZodString`\>; `token`: `ZodOptional`\<`ZodString`\>; `versionsUrl`: `ZodString`; \}, `$strip`\>; `version`: `ZodObject`\<\{ `version`: `ZodEnum`\<\{ `2.2.1`: `"2.2.1"`; \}\>; `versionDetailsUrl`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>; \}, `$strip`\>; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `TenantPartnerCreateSchema` | [00_Base/src/interfaces/dto/tenant.partner.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tenant.partner.dto.ts#L31) |
