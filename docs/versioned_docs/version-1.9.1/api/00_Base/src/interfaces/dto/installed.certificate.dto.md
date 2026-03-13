[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/installed.certificate.dto

# 00_Base/src/interfaces/dto/installed.certificate.dto

## Type Aliases

### InstalledCertificateCreate

```ts
type InstalledCertificateCreate = z.infer<typeof InstalledCertificateCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/installed.certificate.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/installed.certificate.dto.ts#L30)

---

### InstalledCertificateDto

```ts
type InstalledCertificateDto = z.infer<typeof InstalledCertificateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/installed.certificate.dto.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/installed.certificate.dto.ts#L21)

## Variables

### InstalledCertificateCreateSchema

```ts
const InstalledCertificateCreateSchema: ZodObject<
  {
    certificateType: ZodEnum<{
      CSMSRootCertificate: 'CSMSRootCertificate';
      ManufacturerRootCertificate: 'ManufacturerRootCertificate';
      MORootCertificate: 'MORootCertificate';
      V2GCertificateChain: 'V2GCertificateChain';
      V2GRootCertificate: 'V2GRootCertificate';
    }>;
    hashAlgorithm: ZodEnum<{
      SHA256: 'SHA256';
      SHA384: 'SHA384';
      SHA512: 'SHA512';
    }>;
    issuerKeyHash: ZodOptional<ZodNullable<ZodString>>;
    issuerNameHash: ZodOptional<ZodNullable<ZodString>>;
    serialNumber: ZodOptional<ZodNullable<ZodString>>;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/installed.certificate.dto.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/installed.certificate.dto.ts#L23)

---

### InstalledCertificateProps

```ts
const InstalledCertificateProps: object;
```

Defined in: [00_Base/src/interfaces/dto/installed.certificate.dto.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/installed.certificate.dto.ts#L19)

#### Type Declaration

| Name                                                    | Type                | Defined in |
| ------------------------------------------------------- | ------------------- | ---------- |
| <a id="property-certificatetype"></a> `certificateType` | `"certificateType"` |            |
| <a id="property-createdat"></a> `createdAt`             | `"createdAt"`       |            |
| <a id="property-hashalgorithm"></a> `hashAlgorithm`     | `"hashAlgorithm"`   |            |
| <a id="property-id"></a> `id`                           | `"id"`              |            |
| <a id="property-issuerkeyhash"></a> `issuerKeyHash`     | `"issuerKeyHash"`   |            |
| <a id="property-issuernamehash"></a> `issuerNameHash`   | `"issuerNameHash"`  |            |
| <a id="property-serialnumber"></a> `serialNumber`       | `"serialNumber"`    |            |
| <a id="property-stationid"></a> `stationId`             | `"stationId"`       |            |
| <a id="property-tenant"></a> `tenant`                   | `"tenant"`          |            |
| <a id="property-tenantid"></a> `tenantId`               | `"tenantId"`        |            |
| <a id="property-updatedat"></a> `updatedAt`             | `"updatedAt"`       |            |

---

### InstalledCertificateSchema

```ts
const InstalledCertificateSchema: ZodObject<{
  certificateType: ZodEnum<{
     CSMSRootCertificate: "CSMSRootCertificate";
     ManufacturerRootCertificate: "ManufacturerRootCertificate";
     MORootCertificate: "MORootCertificate";
     V2GCertificateChain: "V2GCertificateChain";
     V2GRootCertificate: "V2GRootCertificate";
  }>;
  createdAt: ZodOptional<ZodDate>;
  hashAlgorithm: ZodEnum<{
     SHA256: "SHA256";
     SHA384: "SHA384";
     SHA512: "SHA512";
  }>;
  id: ZodOptional<ZodNumber>;
  issuerKeyHash: ZodOptional<ZodNullable<ZodString>>;
  issuerNameHash: ZodOptional<ZodNullable<ZodString>>;
  serialNumber: ZodOptional<ZodNullable<ZodString>>;
  stationId: ZodString;
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

Defined in: [00_Base/src/interfaces/dto/installed.certificate.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/installed.certificate.dto.ts#L9)

---

### installedCertificateSchemas

```ts
const installedCertificateSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/installed.certificate.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/installed.certificate.dto.ts#L32)

#### Type Declaration

| Name                                                                          | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Default value                      | Defined in                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-installedcertificate"></a> `InstalledCertificate`             | `ZodObject`\<\{ `certificateType`: `ZodEnum`\<\{ `CSMSRootCertificate`: `"CSMSRootCertificate"`; `ManufacturerRootCertificate`: `"ManufacturerRootCertificate"`; `MORootCertificate`: `"MORootCertificate"`; `V2GCertificateChain`: `"V2GCertificateChain"`; `V2GRootCertificate`: `"V2GRootCertificate"`; \}\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `hashAlgorithm`: `ZodEnum`\<\{ `SHA256`: `"SHA256"`; `SHA384`: `"SHA384"`; `SHA512`: `"SHA512"`; \}\>; `id`: `ZodOptional`\<`ZodNumber`\>; `issuerKeyHash`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `issuerNameHash`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `InstalledCertificateSchema`       | [00_Base/src/interfaces/dto/installed.certificate.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/installed.certificate.dto.ts#L33) |
| <a id="property-installedcertificatecreate"></a> `InstalledCertificateCreate` | `ZodObject`\<\{ `certificateType`: `ZodEnum`\<\{ `CSMSRootCertificate`: `"CSMSRootCertificate"`; `ManufacturerRootCertificate`: `"ManufacturerRootCertificate"`; `MORootCertificate`: `"MORootCertificate"`; `V2GCertificateChain`: `"V2GCertificateChain"`; `V2GRootCertificate`: `"V2GRootCertificate"`; \}\>; `hashAlgorithm`: `ZodEnum`\<\{ `SHA256`: `"SHA256"`; `SHA384`: `"SHA384"`; `SHA512`: `"SHA512"`; \}\>; `issuerKeyHash`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `issuerNameHash`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `InstalledCertificateCreateSchema` | [00_Base/src/interfaces/dto/installed.certificate.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/installed.certificate.dto.ts#L34) |
