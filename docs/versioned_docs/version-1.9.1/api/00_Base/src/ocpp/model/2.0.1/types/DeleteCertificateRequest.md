[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest

# 00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest

## Interfaces

### CertificateHashDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L26)

#### Properties

| Property                                     | Type                                                         | Description                                         | Defined in                                                                                                                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`        | [`CustomDataType`](#customdatatype) \| `null`                | -                                                   | [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L27) |
| <a id="hashalgorithm"></a> `hashAlgorithm`   | [`HashAlgorithmEnumType`](../enums.md#hashalgorithmenumtype) | -                                                   | [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L28) |
| <a id="issuerkeyhash"></a> `issuerKeyHash`   | `string`                                                     | Hashed value of the issuers public key              | [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L39) |
| <a id="issuernamehash"></a> `issuerNameHash` | `string`                                                     | Hashed value of the Issuer DN (Distinguished Name). | [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L34) |
| <a id="serialnumber"></a> `serialNumber`     | `string`                                                     | The serial number of the certificate.               | [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L44) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L22)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                        |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L23) |

---

### DeleteCertificateRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                               | Type                                                  | Defined in                                                                                                                                                                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="certificatehashdata"></a> `certificateHashData` | [`CertificateHashDataType`](#certificatehashdatatype) | [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L16) |
| <a id="customdata-1"></a> `customData?`                | [`CustomDataType`](#customdatatype) \| `null`         | [00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DeleteCertificateRequest.ts#L15) |
