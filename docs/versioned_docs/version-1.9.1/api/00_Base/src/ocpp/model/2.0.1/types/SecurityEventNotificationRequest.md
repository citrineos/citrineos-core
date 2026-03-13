[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest

# 00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts#L35)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                        |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts#L36) |

---

### SecurityEventNotificationRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                          | Description                                                                           | Defined in                                                                                                                                                                                                                                        |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                     | [00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts#L14) |
| <a id="techinfo"></a> `techInfo?`     | `string` \| `null`                            | Additional information about the occurred security event.                             | [00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts#L29) |
| <a id="timestamp"></a> `timestamp`    | `string`                                      | Date and time at which the event occurred.                                            | [00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts#L24) |
| <a id="type"></a> `type`              | `string`                                      | Type of the security event. This value should be taken from the Security events list. | [00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.ts#L19) |
