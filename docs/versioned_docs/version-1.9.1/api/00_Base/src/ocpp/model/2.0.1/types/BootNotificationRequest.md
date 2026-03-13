[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest

# 00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest

## Interfaces

### BootNotificationRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                       | Type                                                   | Defined in                                                                                                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingstation"></a> `chargingStation` | [`ChargingStationType`](#chargingstationtype)          | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L16) |
| <a id="customdata"></a> `customData?`          | [`CustomDataType`](#customdatatype) \| `null`          | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L15) |
| <a id="reason"></a> `reason`                   | [`BootReasonEnumType`](../enums.md#bootreasonenumtype) | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L17) |

---

### ChargingStationType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L33)

Charge\_ Point
urn:x-oca:ocpp:uid:2:233122
The physical system where an Electrical Vehicle (EV) can be charged.

#### Properties

| Property                                        | Type                                          | Description                                                                                           | Defined in                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-1"></a> `customData?`         | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                     | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L34) |
| <a id="firmwareversion"></a> `firmwareVersion?` | `string` \| `null`                            | This contains the firmware version of the Charging Station.                                           | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L60) |
| <a id="model"></a> `model`                      | `string`                                      | Device. Model. CI20\_ Text urn:x-oca:ocpp:uid:1:569325 Defines the model of the device.               | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L48) |
| <a id="modem"></a> `modem?`                     | [`ModemType`](#modemtype) \| `null`           | -                                                                                                     | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L49) |
| <a id="serialnumber"></a> `serialNumber?`       | `string` \| `null`                            | Device. Serial* Number. Serial* Number urn:x-oca:ocpp:uid:1:569324 Vendor-specific device identifier. | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L41) |
| <a id="vendorname"></a> `vendorName`            | `string`                                      | Identifies the vendor (not necessarily in a unique manner).                                           | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L54) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L23)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                      |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L24) |

---

### ModemType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L68)

Wireless* Communication* Module
urn:x-oca:ocpp:uid:2:233306
Defines parameters required for initiating and maintaining wireless communication with other devices.

#### Properties

| Property                                | Type                                          | Description                                                                                                                      | Defined in                                                                                                                                                                                                                      |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-2"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L69) |
| <a id="iccid"></a> `iccid?`             | `string` \| `null`                            | Wireless* Communication* Module. ICCID. CI20\_ Text urn:x-oca:ocpp:uid:1:569327 This contains the ICCID of the modem's SIM card. | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L76) |
| <a id="imsi"></a> `imsi?`               | `string` \| `null`                            | Wireless* Communication* Module. IMSI. CI20\_ Text urn:x-oca:ocpp:uid:1:569328 This contains the IMSI of the modem’s SIM card.   | [00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/BootNotificationRequest.ts#L83) |
