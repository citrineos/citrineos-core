[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest

# 00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts#L33)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts#L34) |

---

### Get15118EVCertificateRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                                   | Type                                                                 | Description                                                                                                                            | Defined in                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="action"></a> `action`                               | [`CertificateActionEnumType`](../enums.md#certificateactionenumtype) | -                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts#L22) |
| <a id="customdata"></a> `customData?`                      | [`CustomDataType`](#customdatatype) \| `null`                        | -                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts#L15) |
| <a id="exirequest"></a> `exiRequest`                       | `string`                                                             | Raw CertificateInstallationReq request from EV, Base64 encoded.                                                                        | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts#L27) |
| <a id="iso15118schemaversion"></a> `iso15118SchemaVersion` | `string`                                                             | Schema version currently used for the 15118 session between EV and Charging Station. Needed for parsing of the EXI stream by the CSMS. | [00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.ts#L21) |
