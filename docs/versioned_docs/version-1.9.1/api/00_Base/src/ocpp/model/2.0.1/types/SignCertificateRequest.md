[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest

# 00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts#L27)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                    |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts#L28) |

---

### SignCertificateRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                        | Type                                                                                      | Description                                                                                                                                                                                                                        | Defined in                                                                                                                                                                                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="certificatetype"></a> `certificateType?` | \| [`CertificateSigningUseEnumType`](../enums.md#certificatesigninguseenumtype) \| `null` | -                                                                                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts#L21) |
| <a id="csr"></a> `csr`                          | `string`                                                                                  | The Charging Station SHALL send the public key in form of a Certificate Signing Request (CSR) as described in RFC 2986 [22] and then PEM encoded, using the &lt;&lt;signcertificaterequest,SignCertificateRequest&gt;&gt; message. | [00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts#L20) |
| <a id="customdata"></a> `customData?`           | [`CustomDataType`](#customdatatype) \| `null`                                             | -                                                                                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SignCertificateRequest.ts#L15) |
