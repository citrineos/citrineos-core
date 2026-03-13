[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest

# 00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts#L37)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                          |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts#L38) |

---

### StatusNotificationRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                       | Type                                                             | Description                                                                                          | Defined in                                                                                                                                                                                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId`         | `number`                                                         | The id of the connector within the EVSE for which the status is reported.                            | [00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts#L31) |
| <a id="connectorstatus"></a> `connectorStatus` | [`ConnectorStatusEnumType`](../enums.md#connectorstatusenumtype) | -                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts#L21) |
| <a id="customdata"></a> `customData?`          | [`CustomDataType`](#customdatatype) \| `null`                    | -                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts#L15) |
| <a id="evseid"></a> `evseId`                   | `number`                                                         | The id of the EVSE to which the connector belongs for which the the status is reported.              | [00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts#L26) |
| <a id="timestamp"></a> `timestamp`             | `string`                                                         | The time for which the status is reported. If absent time of receipt of the message will be assumed. | [00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/StatusNotificationRequest.ts#L20) |
