[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/certificate/CertificateUtil

# 02_Util/src/certificate/CertificateUtil

## Variables

### dateTimeFormat

```ts
const dateTimeFormat: 'YYMMDDHHmmssZ' = 'YYMMDDHHmmssZ';
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L21)

## Functions

### createPemBlock()

```ts
function createPemBlock(content): string;
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L27)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `content` | `string` |

#### Returns

`string`

---

### createSignedCertificateFromCSR()

```ts
function createSignedCertificateFromCSR(csrPem, issuerCertPem, issuerPrivateKeyPem): Certificate;
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:192](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L192)

Create a signed certificate for the provided CSR using the issuer certificate, and its private key.

#### Parameters

| Parameter             | Type     | Description                     |
| --------------------- | -------- | ------------------------------- |
| `csrPem`              | `string` | The CSR that need to be signed. |
| `issuerCertPem`       | `string` | The issuer certificate.         |
| `issuerPrivateKeyPem` | `string` | The issuer private key.         |

#### Returns

`Certificate`

The signed certificate.

---

### extractCertificateArrayFromEncodedString()

```ts
function extractCertificateArrayFromEncodedString(pem): CertificateSetItem[];
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L49)

Decode the pem and extract certificates

#### Parameters

| Parameter | Type     | Description                                                       |
| --------- | -------- | ----------------------------------------------------------------- |
| `pem`     | `string` | base64 encoded certificate chain string without header and footer |

#### Returns

`CertificateSetItem`[]

array of pkijs.CertificateSetItem

---

### extractCertificateDetails()

```ts
function extractCertificateDetails(pemString): object;
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:326](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L326)

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `pemString` | `string` |

#### Returns

`object`

| Name                 | Type                                   | Defined in                                                                                                                                                                                  |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commonName`         | `string` \| `null`                     | [02_Util/src/certificate/CertificateUtil.ts:332](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L332) |
| `countryName`        | `CountryNameEnumType` \| `null`        | [02_Util/src/certificate/CertificateUtil.ts:333](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L333) |
| `issuerName`         | `string` \| `null`                     | [02_Util/src/certificate/CertificateUtil.ts:330](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L330) |
| `organizationName`   | `string` \| `null`                     | [02_Util/src/certificate/CertificateUtil.ts:331](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L331) |
| `serialNumber`       | `number` \| `null`                     | [02_Util/src/certificate/CertificateUtil.ts:329](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L329) |
| `signatureAlgorithm` | `SignatureAlgorithmEnumType` \| `null` | [02_Util/src/certificate/CertificateUtil.ts:335](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L335) |
| `validBefore`        | `Date` \| `null`                       | [02_Util/src/certificate/CertificateUtil.ts:334](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L334) |

---

### extractEncodedContentFromCSR()

```ts
function private extractEncodedContentFromCSR(csrPem): string;
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L71)

extracts the base64-encoded content from a pem encoded csr

#### Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `csrPem`  | `string` | -           |

#### Returns

`string`

The parsed CSR or the original CSR if it cannot be parsed

---

### generateCertificate()

```ts
function generateCertificate(
  certificateEntity,
  logger,
  issuerKeyPem?,
  issuerCertPem?,
): [string, string];
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:88](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L88)

Generate certificate and its private key

#### Parameters

| Parameter           | Type                  | Description            |
| ------------------- | --------------------- | ---------------------- |
| `certificateEntity` | `Certificate`         | the certificate        |
| `logger`            | `Logger`\<`ILogObj`\> | the logger             |
| `issuerKeyPem?`     | `string`              | the issuer private key |
| `issuerCertPem?`    | `string`              | the issuer certificate |

#### Returns

\[`string`, `string`\]

generated certificate pem and its private key pem

---

### generateCSR()

```ts
function generateCSR(certificate): [string, string];
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:269](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L269)

#### Parameters

| Parameter     | Type          |
| ------------- | ------------- |
| `certificate` | `Certificate` |

#### Returns

\[`string`, `string`\]

---

### getValidityTimeString()

```ts
function getValidityTimeString(time): string;
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L23)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `time`    | `Moment` |

#### Returns

`string`

---

### parseCertificateChainPem()

```ts
function parseCertificateChainPem(pem): string[];
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L36)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `pem`     | `string` |

#### Returns

`string`[]

---

### parseCSRForVerification()

```ts
function parseCSRForVerification(csrPem): CertificationRequest;
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:263](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L263)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `csrPem`  | `string` |

#### Returns

`CertificationRequest`

---

### parseX509Date()

```ts
function parseX509Date(date): Date | null;
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:313](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L313)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `date`    | `string` |

#### Returns

`Date` \| `null`

---

### sendOCSPRequest()

```ts
function sendOCSPRequest(ocspRequest, responderURL): Promise<string>;
```

Defined in: [02_Util/src/certificate/CertificateUtil.ts:241](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/CertificateUtil.ts#L241)

#### Parameters

| Parameter      | Type                       |
| -------------- | -------------------------- |
| `ocspRequest`  | `OCSPRequest` \| `Request` |
| `responderURL` | `string`                   |

#### Returns

`Promise`\<`string`\>
