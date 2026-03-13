[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest

# 00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts#L29)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                          |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts#L30) |

---

### FirmwareStatusNotificationRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                                           | Description                                                                                                                                                                                                                    | Defined in                                                                                                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                  | -                                                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts#L15) |
| <a id="requestid"></a> `requestId?`   | `number` \| `null`                                             | The request id that was provided in the UpdateFirmwareRequest that started this firmware update. This field is mandatory, unless the message was triggered by a TriggerMessageRequest AND there is no firmware update ongoing. | [00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts#L23) |
| <a id="status"></a> `status`          | [`FirmwareStatusEnumType`](../enums.md#firmwarestatusenumtype) | -                                                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.ts#L16) |
