[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse

# 00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse

## Interfaces

### CertificateHashDataChainType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L54)

#### Properties

| Property                                                          | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Description                     | Defined in                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="certificatehashdata"></a> `certificateHashData`            | [`CertificateHashDataType`](#certificatehashdatatype)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | -                               | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L56) |
| <a id="certificatetype"></a> `certificateType`                    | [`GetCertificateIdUseEnumType`](../enums.md#getcertificateiduseenumtype)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | -                               | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L57) |
| <a id="childcertificatehashdata"></a> `childCertificateHashData?` | \| \[[`CertificateHashDataType`](#certificatehashdatatype)\] \| \[[`CertificateHashDataType`](#certificatehashdatatype), [`CertificateHashDataType`](#certificatehashdatatype)\] \| \[[`CertificateHashDataType`](#certificatehashdatatype), [`CertificateHashDataType`](#certificatehashdatatype), [`CertificateHashDataType`](#certificatehashdatatype)\] \| \[[`CertificateHashDataType`](#certificatehashdatatype), [`CertificateHashDataType`](#certificatehashdatatype), [`CertificateHashDataType`](#certificatehashdatatype), [`CertificateHashDataType`](#certificatehashdatatype)\] \| `null` | **Min Items** 1 **Max Items** 4 | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L62) |
| <a id="customdata"></a> `customData?`                             | [`CustomDataType`](#customdatatype) \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | -                               | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L55) |

---

### CertificateHashDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:74](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L74)

#### Properties

| Property                                     | Type                                                         | Description                                         | Defined in                                                                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-1"></a> `customData?`      | [`CustomDataType`](#customdatatype) \| `null`                | -                                                   | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L75) |
| <a id="hashalgorithm"></a> `hashAlgorithm`   | [`HashAlgorithmEnumType`](../enums.md#hashalgorithmenumtype) | -                                                   | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L76) |
| <a id="issuerkeyhash"></a> `issuerKeyHash`   | `string`                                                     | Hashed value of the issuers public key              | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:87](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L87) |
| <a id="issuernamehash"></a> `issuerNameHash` | `string`                                                     | Hashed value of the Issuer DN (Distinguished Name). | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:82](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L82) |
| <a id="serialnumber"></a> `serialNumber`     | `string`                                                     | The serial number of the certificate.               | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:92](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L92) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L33)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                            |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L34) |

---

### GetInstalledCertificateIdsResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L18)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                                          | Type                                                                                                                  | Description     | Defined in                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="certificatehashdatachain"></a> `certificateHashDataChain?` | \| \[[`CertificateHashDataChainType`](#certificatehashdatachaintype), `...CertificateHashDataChainType[]`\] \| `null` | **Min Items** 1 | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L25) |
| <a id="customdata-2"></a> `customData?`                           | [`CustomDataType`](#customdatatype) \| `null`                                                                         | -               | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L19) |
| <a id="status"></a> `status`                                      | [`GetInstalledCertificateStatusEnumType`](../enums.md#getinstalledcertificatestatusenumtype)                          | -               | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L20) |
| <a id="statusinfo"></a> `statusInfo?`                             | [`StatusInfoType`](#statusinfotype) \| `null`                                                                         | -               | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L21) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L41)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                                            |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L52) |
| <a id="customdata-3"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L42) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.ts#L47) |
