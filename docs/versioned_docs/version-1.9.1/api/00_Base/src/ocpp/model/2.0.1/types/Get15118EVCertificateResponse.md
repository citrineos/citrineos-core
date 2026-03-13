[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse

# 00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L28)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                  |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L29) |

---

### Get15118EVCertificateResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                               | Type                                                                                     | Description                                                         | Defined in                                                                                                                                                                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`  | [`CustomDataType`](#customdatatype) \| `null`                                            | -                                                                   | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L15) |
| <a id="exiresponse"></a> `exiResponse` | `string`                                                                                 | Raw CertificateInstallationRes response for the EV, Base64 encoded. | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L22) |
| <a id="status"></a> `status`           | [`Iso15118EVCertificateStatusEnumType`](../enums.md#iso15118evcertificatestatusenumtype) | -                                                                   | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L16) |
| <a id="statusinfo"></a> `statusInfo?`  | [`StatusInfoType`](#statusinfotype) \| `null`                                            | -                                                                   | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L17) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L36)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L47) |
| <a id="customdata-1"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L37) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.ts#L42) |
