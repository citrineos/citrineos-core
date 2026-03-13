[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/ocpi.registration

# 00_Base/src/interfaces/dto/types/ocpi.registration

## Type Aliases

### BusinessDetails

```ts
type BusinessDetails = z.infer<typeof BusinessDetailsSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L58)

---

### CredentialRole

```ts
type CredentialRole = z.infer<typeof CredentialRoleSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L59)

---

### Credentials

```ts
type Credentials = z.infer<typeof CredentialsSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L62)

---

### Endpoint

```ts
type Endpoint = z.infer<typeof EndpointSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L61)

---

### Image

```ts
type Image = z.infer<typeof ImageSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L57)

---

### PartnerProfile

```ts
type PartnerProfile = z.infer<typeof PartnerProfileSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L64)

---

### ServerProfile

```ts
type ServerProfile = z.infer<typeof ServerProfileSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L63)

---

### Version

```ts
type Version = z.infer<typeof VersionSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L60)

## Variables

### BusinessDetailsSchema

```ts
const BusinessDetailsSchema: ZodObject<
  {
    logo: ZodOptional<
      ZodObject<
        {
          category: ZodString;
          height: ZodOptional<ZodNumber>;
          type: ZodString;
          url: ZodString;
          width: ZodOptional<ZodNumber>;
        },
        $strip
      >
    >;
    name: ZodString;
    website: ZodOptional<ZodString>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L16)

---

### CredentialRoleSchema

```ts
const CredentialRoleSchema: ZodObject<
  {
    businessDetails: ZodObject<
      {
        logo: ZodOptional<
          ZodObject<
            {
              category: ZodString;
              height: ZodOptional<ZodNumber>;
              type: ZodString;
              url: ZodString;
              width: ZodOptional<ZodNumber>;
            },
            $strip
          >
        >;
        name: ZodString;
        website: ZodOptional<ZodString>;
      },
      $strip
    >;
    role: ZodEnum<{
      CPO: 'CPO';
      EMSP: 'EMSP';
      HUB: 'HUB';
      NAP: 'NAP';
      NSP: 'NSP';
      SCSP: 'SCSP';
    }>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L22)

---

### CredentialsSchema

```ts
const CredentialsSchema: ZodObject<
  {
    certificateRef: ZodOptional<ZodString>;
    token: ZodOptional<ZodString>;
    versionsUrl: ZodString;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L37)

---

### EndpointSchema

```ts
const EndpointSchema: ZodObject<
  {
    identifier: ZodString;
    url: ZodString;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L32)

---

### ImageSchema

```ts
const ImageSchema: ZodObject<
  {
    category: ZodString;
    height: ZodOptional<ZodNumber>;
    type: ZodString;
    url: ZodString;
    width: ZodOptional<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L8)

---

### PartnerProfileSchema

```ts
const PartnerProfileSchema: ZodObject<{
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
        logo: ZodOptional<ZodObject<{
           category: ...;
           height: ...;
           type: ...;
           url: ...;
           width: ...;
        }, $strip>>;
        name: ZodString;
        website: ZodOptional<ZodString>;
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
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L49)

---

### ServerProfileSchema

```ts
const ServerProfileSchema: ZodObject<{
  credentialsRole: ZodObject<{
     businessDetails: ZodObject<{
        logo: ZodOptional<ZodObject<{
           category: ZodString;
           height: ZodOptional<ZodNumber>;
           type: ZodString;
           url: ZodString;
           width: ZodOptional<ZodNumber>;
        }, $strip>>;
        name: ZodString;
        website: ZodOptional<ZodString>;
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
        2.2.1: "2.2.1";
     }>;
     versionDetailsUrl: ZodOptional<ZodString>;
  }, $strip>>;
  versionEndpoints: ZodRecord<ZodString, ZodArray<ZodObject<{
     identifier: ZodString;
     url: ZodString;
  }, $strip>>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L43)

---

### VersionSchema

```ts
const VersionSchema: ZodObject<{
  version: ZodEnum<{
     2.2.1: "2.2.1";
  }>;
  versionDetailsUrl: ZodOptional<ZodString>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/types/ocpi.registration.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/ocpi.registration.ts#L27)
