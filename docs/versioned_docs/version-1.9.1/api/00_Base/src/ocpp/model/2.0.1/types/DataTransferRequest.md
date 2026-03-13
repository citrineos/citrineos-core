[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest

# 00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts#L38)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                              |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts#L39) |

---

### DataTransferRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                          | Description                                                                                                 | Defined in                                                                                                                                                                                                              |
| ------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts#L14) |
| <a id="data"></a> `data?`             | `object`                                      | Data without specified length or format. This needs to be decided by both parties (Open to implementation). | [00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts#L24) |
| <a id="messageid"></a> `messageId?`   | `string` \| `null`                            | May be used to indicate a specific message or implementation.                                               | [00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts#L19) |
| <a id="vendorid-1"></a> `vendorId`    | `string`                                      | This identifies the Vendor specific implementation                                                          | [00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/DataTransferRequest.ts#L32) |
