[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest

# 00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L22)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                              |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L23) |

---

### GetCertificateStatusRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                       | Type                                          | Defined in                                                                                                                                                                                                                              |
| ---------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`          | [`CustomDataType`](#customdatatype) \| `null` | [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L15) |
| <a id="ocsprequestdata"></a> `ocspRequestData` | [`OCSPRequestDataType`](#ocsprequestdatatype) | [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L16) |

---

### OCSPRequestDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L26)

#### Properties

| Property                                     | Type                                                         | Description                                         | Defined in                                                                                                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-1"></a> `customData?`      | [`CustomDataType`](#customdatatype) \| `null`                | -                                                   | [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L27) |
| <a id="hashalgorithm"></a> `hashAlgorithm`   | [`HashAlgorithmEnumType`](../enums.md#hashalgorithmenumtype) | -                                                   | [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L28) |
| <a id="issuerkeyhash"></a> `issuerKeyHash`   | `string`                                                     | Hashed value of the issuers public key              | [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L39) |
| <a id="issuernamehash"></a> `issuerNameHash` | `string`                                                     | Hashed value of the Issuer DN (Distinguished Name). | [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L34) |
| <a id="responderurl"></a> `responderURL`     | `string`                                                     | This contains the responder URL (Case insensitive). | [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L50) |
| <a id="serialnumber"></a> `serialNumber`     | `string`                                                     | The serial number of the certificate.               | [00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.ts#L44) |
