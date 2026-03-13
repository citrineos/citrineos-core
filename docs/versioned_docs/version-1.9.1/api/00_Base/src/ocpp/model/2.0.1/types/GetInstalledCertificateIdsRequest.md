[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest

# 00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.ts#L28)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                          |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.ts#L29) |

---

### GetInstalledCertificateIdsRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                        | Type                                                                                                                          | Description                                                                                                      | Defined in                                                                                                                                                                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="certificatetype"></a> `certificateType?` | \| \[[`GetCertificateIdUseEnumType`](../enums.md#getcertificateiduseenumtype), `...GetCertificateIdUseEnumType[]`\] \| `null` | Indicates the type of certificates requested. When omitted, all certificate types are requested. **Min Items** 1 | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.ts#L22) |
| <a id="customdata"></a> `customData?`           | [`CustomDataType`](#customdatatype) \| `null`                                                                                 | -                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.ts#L15) |
