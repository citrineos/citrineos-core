[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse

# 00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.ts#L22)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                          |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.ts#L23) |

---

### UnpublishFirmwareResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                              | Type                                                                             | Defined in                                                                                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                                    | [00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.ts#L15) |
| <a id="status"></a> `status`          | [`UnpublishFirmwareStatusEnumType`](../enums.md#unpublishfirmwarestatusenumtype) | [00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.ts#L16) |
