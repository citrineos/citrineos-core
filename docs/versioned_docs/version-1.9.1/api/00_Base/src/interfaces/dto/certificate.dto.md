[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/certificate.dto

# 00_Base/src/interfaces/dto/certificate.dto

## Type Aliases

### CertificateCreate

```ts
type CertificateCreate = z.infer<typeof CertificateCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/certificate.dto.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L42)

---

### CertificateDto

```ts
type CertificateDto = z.infer<typeof CertificateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/certificate.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L33)

---

### CountryName

```ts
type CountryName = z.infer<typeof CountryNameSchema>;
```

Defined in: [00_Base/src/interfaces/dto/certificate.dto.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L12)

---

### SignatureAlgorithm

```ts
type SignatureAlgorithm = z.infer<typeof SignatureAlgorithmSchema>;
```

Defined in: [00_Base/src/interfaces/dto/certificate.dto.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L11)

## Variables

### CertificateCreateSchema

```ts
const CertificateCreateSchema: ZodObject<
  {
    certificateFileId: ZodOptional<ZodNullable<ZodString>>;
    commonName: ZodString;
    countryName: ZodOptional<
      ZodNullable<
        ZodEnum<{
          US: 'US';
        }>
      >
    >;
    isCA: ZodOptional<ZodBoolean>;
    issuerName: ZodString;
    keyLength: ZodOptional<ZodNullable<ZodNumber>>;
    organizationName: ZodString;
    pathLen: ZodOptional<ZodNullable<ZodNumber>>;
    privateKeyFileId: ZodOptional<ZodNullable<ZodString>>;
    serialNumber: ZodNumber;
    signatureAlgorithm: ZodOptional<
      ZodNullable<
        ZodEnum<{
          SHA256withECDSA: 'SHA256withECDSA';
          SHA256withRSA: 'SHA256withRSA';
        }>
      >
    >;
    signedBy: ZodOptional<ZodNullable<ZodString>>;
    tenantId: ZodOptional<ZodNumber>;
    validBefore: ZodOptional<ZodNullable<ZodISODateTime>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/certificate.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L35)

---

### CertificateProps

```ts
const CertificateProps: object;
```

Defined in: [00_Base/src/interfaces/dto/certificate.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L31)

#### Type Declaration

| Name                                                          | Type                   | Defined in |
| ------------------------------------------------------------- | ---------------------- | ---------- |
| <a id="property-certificatefileid"></a> `certificateFileId`   | `"certificateFileId"`  |            |
| <a id="property-commonname"></a> `commonName`                 | `"commonName"`         |            |
| <a id="property-countryname"></a> `countryName`               | `"countryName"`        |            |
| <a id="property-createdat"></a> `createdAt`                   | `"createdAt"`          |            |
| <a id="property-id"></a> `id`                                 | `"id"`                 |            |
| <a id="property-isca"></a> `isCA`                             | `"isCA"`               |            |
| <a id="property-issuername"></a> `issuerName`                 | `"issuerName"`         |            |
| <a id="property-keylength"></a> `keyLength`                   | `"keyLength"`          |            |
| <a id="property-organizationname"></a> `organizationName`     | `"organizationName"`   |            |
| <a id="property-pathlen"></a> `pathLen`                       | `"pathLen"`            |            |
| <a id="property-privatekeyfileid"></a> `privateKeyFileId`     | `"privateKeyFileId"`   |            |
| <a id="property-serialnumber"></a> `serialNumber`             | `"serialNumber"`       |            |
| <a id="property-signaturealgorithm"></a> `signatureAlgorithm` | `"signatureAlgorithm"` |            |
| <a id="property-signedby"></a> `signedBy`                     | `"signedBy"`           |            |
| <a id="property-tenant"></a> `tenant`                         | `"tenant"`             |            |
| <a id="property-tenantid"></a> `tenantId`                     | `"tenantId"`           |            |
| <a id="property-updatedat"></a> `updatedAt`                   | `"updatedAt"`          |            |
| <a id="property-validbefore"></a> `validBefore`               | `"validBefore"`        |            |

---

### CertificateSchema

```ts
const CertificateSchema: ZodObject<{
  certificateFileId: ZodOptional<ZodNullable<ZodString>>;
  commonName: ZodString;
  countryName: ZodOptional<ZodNullable<ZodEnum<{
     US: "US";
  }>>>;
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  isCA: ZodOptional<ZodBoolean>;
  issuerName: ZodString;
  keyLength: ZodOptional<ZodNullable<ZodNumber>>;
  organizationName: ZodString;
  pathLen: ZodOptional<ZodNullable<ZodNumber>>;
  privateKeyFileId: ZodOptional<ZodNullable<ZodString>>;
  serialNumber: ZodNumber;
  signatureAlgorithm: ZodOptional<ZodNullable<ZodEnum<{
     SHA256withECDSA: "SHA256withECDSA";
     SHA256withRSA: "SHA256withRSA";
  }>>>;
  signedBy: ZodOptional<ZodNullable<ZodString>>;
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
  validBefore: ZodOptional<ZodNullable<ZodISODateTime>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/certificate.dto.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L14)

---

### certificateSchemas

```ts
const certificateSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/certificate.dto.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L44)

#### Type Declaration

| Name                                                        | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Default value             | Defined in                                                                                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-certificate"></a> `Certificate`             | `ZodObject`\<\{ `certificateFileId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `commonName`: `ZodString`; `countryName`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `US`: `"US"`; \}\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isCA`: `ZodOptional`\<`ZodBoolean`\>; `issuerName`: `ZodString`; `keyLength`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `organizationName`: `ZodString`; `pathLen`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `privateKeyFileId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serialNumber`: `ZodNumber`; `signatureAlgorithm`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `SHA256withECDSA`: `"SHA256withECDSA"`; `SHA256withRSA`: `"SHA256withRSA"`; \}\>\>\>; `signedBy`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `validBefore`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; \}, `$strip`\> | `CertificateSchema`       | [00_Base/src/interfaces/dto/certificate.dto.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L45) |
| <a id="property-certificatecreate"></a> `CertificateCreate` | `ZodObject`\<\{ `certificateFileId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `commonName`: `ZodString`; `countryName`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `US`: `"US"`; \}\>\>\>; `isCA`: `ZodOptional`\<`ZodBoolean`\>; `issuerName`: `ZodString`; `keyLength`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `organizationName`: `ZodString`; `pathLen`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `privateKeyFileId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serialNumber`: `ZodNumber`; `signatureAlgorithm`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `SHA256withECDSA`: `"SHA256withECDSA"`; `SHA256withRSA`: `"SHA256withRSA"`; \}\>\>\>; `signedBy`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `validBefore`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `CertificateCreateSchema` | [00_Base/src/interfaces/dto/certificate.dto.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L46) |

---

### CountryNameSchema

```ts
const CountryNameSchema: ZodEnum<{
  US: 'US';
}>;
```

Defined in: [00_Base/src/interfaces/dto/certificate.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L9)

---

### SignatureAlgorithmSchema

```ts
const SignatureAlgorithmSchema: ZodEnum<{
  SHA256withECDSA: 'SHA256withECDSA';
  SHA256withRSA: 'SHA256withRSA';
}>;
```

Defined in: [00_Base/src/interfaces/dto/certificate.dto.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/certificate.dto.ts#L8)
