[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest

# 00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts#L37)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                                        |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts#L38) |

---

### PublishFirmwareStatusNotificationRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                                                         | Description                                                                                                                         | Defined in                                                                                                                                                                                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                                | -                                                                                                                                   | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts#L15) |
| <a id="location"></a> `location?`     | \[`string`, `...string[]`\] \| `null`                                        | Required if status is Published. Can be multiple URI’s, if the Local Controller supports e.g. HTTP, HTTPS, and FTP. **Min Items** 1 | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts#L23) |
| <a id="requestid"></a> `requestId?`   | `number` \| `null`                                                           | The request id that was provided in the PublishFirmwareRequest which triggered this action.                                         | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts#L31) |
| <a id="status"></a> `status`          | [`PublishFirmwareStatusEnumType`](../enums.md#publishfirmwarestatusenumtype) | -                                                                                                                                   | [00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.ts#L16) |
