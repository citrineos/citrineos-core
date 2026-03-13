[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/tariff.dto

# 00_Base/src/interfaces/dto/tariff.dto

## Type Aliases

### TariffCreate

```ts
type TariffCreate = z.infer<typeof TariffCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/tariff.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tariff.dto.ts#L31)

---

### TariffDto

```ts
type TariffDto = z.infer<typeof TariffSchema>;
```

Defined in: [00_Base/src/interfaces/dto/tariff.dto.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tariff.dto.ts#L22)

## Variables

### TariffCreateSchema

```ts
const TariffCreateSchema: ZodObject<
  {
    authorizationAmount: ZodOptional<ZodNullable<ZodNumber>>;
    currency: ZodString;
    paymentFee: ZodOptional<ZodNullable<ZodNumber>>;
    pricePerKwh: ZodNumber;
    pricePerMin: ZodOptional<ZodNullable<ZodNumber>>;
    pricePerSession: ZodOptional<ZodNullable<ZodNumber>>;
    tariffAltText: ZodOptional<ZodNullable<ZodRecord<ZodString, ZodAny>>>;
    taxRate: ZodOptional<ZodNullable<ZodNumber>>;
    tenantId: ZodOptional<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/tariff.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tariff.dto.ts#L24)

---

### TariffProps

```ts
const TariffProps: object;
```

Defined in: [00_Base/src/interfaces/dto/tariff.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tariff.dto.ts#L20)

#### Type Declaration

| Name                                                            | Type                    | Defined in |
| --------------------------------------------------------------- | ----------------------- | ---------- |
| <a id="property-authorizationamount"></a> `authorizationAmount` | `"authorizationAmount"` |            |
| <a id="property-createdat"></a> `createdAt`                     | `"createdAt"`           |            |
| <a id="property-currency"></a> `currency`                       | `"currency"`            |            |
| <a id="property-id"></a> `id`                                   | `"id"`                  |            |
| <a id="property-paymentfee"></a> `paymentFee`                   | `"paymentFee"`          |            |
| <a id="property-priceperkwh"></a> `pricePerKwh`                 | `"pricePerKwh"`         |            |
| <a id="property-pricepermin"></a> `pricePerMin`                 | `"pricePerMin"`         |            |
| <a id="property-pricepersession"></a> `pricePerSession`         | `"pricePerSession"`     |            |
| <a id="property-tariffalttext"></a> `tariffAltText`             | `"tariffAltText"`       |            |
| <a id="property-taxrate"></a> `taxRate`                         | `"taxRate"`             |            |
| <a id="property-tenant"></a> `tenant`                           | `"tenant"`              |            |
| <a id="property-tenantid"></a> `tenantId`                       | `"tenantId"`            |            |
| <a id="property-updatedat"></a> `updatedAt`                     | `"updatedAt"`           |            |

---

### TariffSchema

```ts
const TariffSchema: ZodObject<{
  authorizationAmount: ZodOptional<ZodNullable<ZodNumber>>;
  createdAt: ZodOptional<ZodDate>;
  currency: ZodString;
  id: ZodOptional<ZodNumber>;
  paymentFee: ZodOptional<ZodNullable<ZodNumber>>;
  pricePerKwh: ZodNumber;
  pricePerMin: ZodOptional<ZodNullable<ZodNumber>>;
  pricePerSession: ZodOptional<ZodNullable<ZodNumber>>;
  tariffAltText: ZodOptional<ZodNullable<ZodRecord<ZodString, ZodAny>>>;
  taxRate: ZodOptional<ZodNullable<ZodNumber>>;
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

Defined in: [00_Base/src/interfaces/dto/tariff.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tariff.dto.ts#L8)

---

### tariffSchemas

```ts
const tariffSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/tariff.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tariff.dto.ts#L33)

#### Type Declaration

| Name                                              | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Default value        | Defined in                                                                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-tariff"></a> `Tariff`             | `ZodObject`\<\{ `authorizationAmount`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `currency`: `ZodString`; `id`: `ZodOptional`\<`ZodNumber`\>; `paymentFee`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `pricePerKwh`: `ZodNumber`; `pricePerMin`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `pricePerSession`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tariffAltText`: `ZodOptional`\<`ZodNullable`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>; `taxRate`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `TariffSchema`       | [00_Base/src/interfaces/dto/tariff.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tariff.dto.ts#L34) |
| <a id="property-tariffcreate"></a> `TariffCreate` | `ZodObject`\<\{ `authorizationAmount`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `currency`: `ZodString`; `paymentFee`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `pricePerKwh`: `ZodNumber`; `pricePerMin`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `pricePerSession`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tariffAltText`: `ZodOptional`\<`ZodNullable`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>; `taxRate`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `TariffCreateSchema` | [00_Base/src/interfaces/dto/tariff.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/tariff.dto.ts#L35) |
