[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest

# 00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest

## Interfaces

### CertificateSignedRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                         | Type                                                                                      | Description                                                                                                                                                                                                                                                                                                                                                                    | Defined in                                                                                                                                                                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="certificatechain"></a> `certificateChain` | `string`                                                                                  | The signed PEM encoded X.509 certificate. This can also contain the necessary sub CA certificates. In that case, the order of the bundle should follow the certificate chain, starting from the leaf certificate. The Configuration Variable &lt;&lt;configkey-max-certificate-chain-size,MaxCertificateChainSize&gt;&gt; can be used to limit the maximum size of this field. | [00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts#L22) |
| <a id="certificatetype"></a> `certificateType?`  | \| [`CertificateSigningUseEnumType`](../enums.md#certificatesigninguseenumtype) \| `null` | -                                                                                                                                                                                                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts#L23) |
| <a id="customdata"></a> `customData?`            | [`CustomDataType`](#customdatatype) \| `null`                                             | -                                                                                                                                                                                                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts#L15) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts#L29)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                        |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CertificateSignedRequest.ts#L30) |
