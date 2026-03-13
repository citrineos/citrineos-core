[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 01_Data/src/interfaces/dtos/GenerateCertificateChainRequest

# 01_Data/src/interfaces/dtos/GenerateCertificateChainRequest

## Classes

### GenerateCertificateChainRequest

Defined in: [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L7)

#### Constructors

##### Constructor

```ts
new GenerateCertificateChainRequest(
   selfSigned,
   organizationName,
   commonName,
   keyLength?,
   validBefore?,
   countryName?,
   signatureAlgorithm?,
   pathLen?,
   filePath?): GenerateCertificateChainRequest;
```

Defined in: [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L21)

###### Parameters

| Parameter             | Type                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `selfSigned`          | `boolean`                                                                                              |
| `organizationName`    | `string`                                                                                               |
| `commonName`          | `string`                                                                                               |
| `keyLength?`          | `number`                                                                                               |
| `validBefore?`        | `string`                                                                                               |
| `countryName?`        | [`US`](../../layers/sequelize/model/Certificate.md#us)                                                 |
| `signatureAlgorithm?` | [`SignatureAlgorithmEnumType`](../../layers/sequelize/model/Certificate.md#signaturealgorithmenumtype) |
| `pathLen?`            | `number`                                                                                               |
| `filePath?`           | `string`                                                                                               |

###### Returns

[`GenerateCertificateChainRequest`](#generatecertificatechainrequest)

#### Properties

| Property                                              | Type                                                                                                   | Defined in                                                                                                                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="commonname"></a> `commonName`                  | `string`                                                                                               | [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L12) |
| <a id="countryname"></a> `countryName?`               | [`US`](../../layers/sequelize/model/Certificate.md#us)                                                 | [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L15) |
| <a id="filepath"></a> `filePath?`                     | `string`                                                                                               | [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L19) |
| <a id="keylength"></a> `keyLength?`                   | `number`                                                                                               | [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L13) |
| <a id="organizationname"></a> `organizationName`      | `string`                                                                                               | [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L11) |
| <a id="pathlen"></a> `pathLen?`                       | `number`                                                                                               | [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L17) |
| <a id="selfsigned"></a> `selfSigned`                  | `boolean`                                                                                              | [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L10) |
| <a id="signaturealgorithm"></a> `signatureAlgorithm?` | [`SignatureAlgorithmEnumType`](../../layers/sequelize/model/Certificate.md#signaturealgorithmenumtype) | [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L16) |
| <a id="validbefore"></a> `validBefore?`               | `string`                                                                                               | [01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/GenerateCertificateChainRequest.ts#L14) |
