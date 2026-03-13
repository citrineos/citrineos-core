[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse

# 00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse

## Interfaces

### BootNotificationResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                               | Type                                                                   | Description                                                                                                                                                                                                                                                                                 | Defined in                                                                                                                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="currenttime"></a> `currentTime` | `string`                                                               | This contains the CSMS’s current time.                                                                                                                                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L20) |
| <a id="customdata"></a> `customData?`  | [`CustomDataType`](#customdatatype) \| `null`                          | -                                                                                                                                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L15) |
| <a id="interval"></a> `interval`       | `number`                                                               | When &lt;&lt;cmn_registrationstatusenumtype,Status&gt;&gt; is Accepted, this contains the heartbeat interval in seconds. If the CSMS returns something other than Accepted, the value of the interval field indicates the minimum wait time before sending a next BootNotification request. | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L25) |
| <a id="status"></a> `status`           | [`RegistrationStatusEnumType`](../enums.md#registrationstatusenumtype) | -                                                                                                                                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L26) |
| <a id="statusinfo"></a> `statusInfo?`  | [`StatusInfoType`](#statusinfotype) \| `null`                          | -                                                                                                                                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L27) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L33)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                        |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L34) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L41)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                        |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L52) |
| <a id="customdata-1"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L42) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationResponse.ts#L47) |
