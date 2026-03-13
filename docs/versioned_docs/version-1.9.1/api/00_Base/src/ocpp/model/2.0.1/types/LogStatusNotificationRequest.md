[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest

# 00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts#L28)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts#L29) |

---

### LogStatusNotificationRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                                             | Description                                                                                                                                                                                              | Defined in                                                                                                                                                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                    | -                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts#L15) |
| <a id="requestid"></a> `requestId?`   | `number` \| `null`                                               | The request id that was provided in GetLogRequest that started this log upload. This field is mandatory, unless the message was triggered by a TriggerMessageRequest AND there is no log upload ongoing. | [00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts#L22) |
| <a id="status"></a> `status`          | [`UploadLogStatusEnumType`](../enums.md#uploadlogstatusenumtype) | -                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.ts#L16) |
