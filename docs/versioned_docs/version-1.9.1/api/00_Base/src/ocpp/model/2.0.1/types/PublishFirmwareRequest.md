[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest

# 00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts#L53)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                    |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts#L54) |

---

### PublishFirmwareRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                    | Type                                          | Description                                                                                                                                                                                                 | Defined in                                                                                                                                                                                                                    |
| ------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="checksum"></a> `checksum`            | `string`                                      | The MD5 checksum over the entire firmware file as a hexadecimal string of length 32.                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts#L32) |
| <a id="customdata"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts#L14) |
| <a id="location"></a> `location`            | `string`                                      | This contains a string containing a URI pointing to a location from which to retrieve the firmware.                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts#L20) |
| <a id="requestid"></a> `requestId`          | `number`                                      | The Id of the request.                                                                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts#L37) |
| <a id="retries"></a> `retries?`             | `number` \| `null`                            | This specifies how many times Charging Station must try to download the firmware before giving up. If this field is not present, it is left to Charging Station to decide how many times it wants to retry. | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts#L27) |
| <a id="retryinterval"></a> `retryInterval?` | `number` \| `null`                            | The interval in seconds after which a retry may be attempted. If this field is not present, it is left to Charging Station to decide how long to wait between attempts.                                     | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareRequest.ts#L47) |
