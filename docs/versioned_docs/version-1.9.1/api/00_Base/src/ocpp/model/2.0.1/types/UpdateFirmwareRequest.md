[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest

# 00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L36)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                  |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L37) |

---

### FirmwareType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L46)

Firmware
urn:x-enexis:ecdm:uid:2:233291
Represents a copy of the firmware that can be loaded/updated on the Charging Station.

#### Properties

| Property                                              | Type                                          | Description                                                                                                            | Defined in                                                                                                                                                                                                                  |
| ----------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`                 | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L47) |
| <a id="installdatetime"></a> `installDateTime?`       | `string` \| `null`                            | Firmware. Install. Date\_ Time urn:x-enexis:ecdm:uid:1:569462 Date and time at which the firmware shall be installed.  | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L68) |
| <a id="location"></a> `location`                      | `string`                                      | Firmware. Location. URI urn:x-enexis:ecdm:uid:1:569460 URI defining the origin of the firmware.                        | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L54) |
| <a id="retrievedatetime"></a> `retrieveDateTime`      | `string`                                      | Firmware. Retrieve. Date\_ Time urn:x-enexis:ecdm:uid:1:569461 Date and time at which the firmware shall be retrieved. | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L61) |
| <a id="signature"></a> `signature?`                   | `string` \| `null`                            | Firmware. Signature. Signature urn:x-enexis:ecdm:uid:1:569464 Base64 encoded firmware signature.                       | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:81](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L81) |
| <a id="signingcertificate"></a> `signingCertificate?` | `string` \| `null`                            | Certificate with which the firmware was signed. PEM encoded X.509 certificate.                                         | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:74](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L74) |

---

### UpdateFirmwareRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                    | Type                                          | Description                                                                                                                                                                                                 | Defined in                                                                                                                                                                                                                  |
| ------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-1"></a> `customData?`     | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L14) |
| <a id="firmware"></a> `firmware`            | [`FirmwareType`](#firmwaretype)               | -                                                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L30) |
| <a id="requestid"></a> `requestId`          | `number`                                      | The Id of this request                                                                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L29) |
| <a id="retries"></a> `retries?`             | `number` \| `null`                            | This specifies how many times Charging Station must try to download the firmware before giving up. If this field is not present, it is left to Charging Station to decide how many times it wants to retry. | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L19) |
| <a id="retryinterval"></a> `retryInterval?` | `number` \| `null`                            | The interval in seconds after which a retry may be attempted. If this field is not present, it is left to Charging Station to decide how long to wait between attempts.                                     | [00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.ts#L24) |
