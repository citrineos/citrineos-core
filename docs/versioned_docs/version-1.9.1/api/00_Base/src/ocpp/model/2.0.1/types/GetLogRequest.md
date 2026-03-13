[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetLogRequest

# 00_Base/src/ocpp/model/2.0.1/types/GetLogRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L38)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                  |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L39) |

---

### GetLogRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                    | Type                                          | Description                                                                                                                                                                                              | Defined in                                                                                                                                                                                                  |
| ------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L15) |
| <a id="log"></a> `log`                      | [`LogParametersType`](#logparameterstype)     | -                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L16) |
| <a id="logtype"></a> `logType`              | [`LogEnumType`](../enums.md#logenumtype)      | -                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L17) |
| <a id="requestid"></a> `requestId`          | `number`                                      | The Id of this request                                                                                                                                                                                   | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L22) |
| <a id="retries"></a> `retries?`             | `number` \| `null`                            | This specifies how many times the Charging Station must try to upload the log before giving up. If this field is not present, it is left to Charging Station to decide how many times it wants to retry. | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L27) |
| <a id="retryinterval"></a> `retryInterval?` | `number` \| `null`                            | The interval in seconds after which a retry may be attempted. If this field is not present, it is left to Charging Station to decide how long to wait between attempts.                                  | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L32) |

---

### LogParametersType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L48)

Log
urn:x-enexis:ecdm:uid:2:233373
Generic class for the configuration of logging entries.

#### Properties

| Property                                        | Type                                          | Description                                                                                                                                                        | Defined in                                                                                                                                                                                                  |
| ----------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-1"></a> `customData?`         | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L49) |
| <a id="latesttimestamp"></a> `latestTimestamp?` | `string` \| `null`                            | Log. Latest* Timestamp. Date* Time urn:x-enexis:ecdm:uid:1:569482 This contains the date and time of the latest logging information to include in the diagnostics. | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L70) |
| <a id="oldesttimestamp"></a> `oldestTimestamp?` | `string` \| `null`                            | Log. Oldest* Timestamp. Date* Time urn:x-enexis:ecdm:uid:1:569477 This contains the date and time of the oldest logging information to include in the diagnostics. | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L63) |
| <a id="remotelocation"></a> `remoteLocation`    | `string`                                      | Log. Remote\_ Location. URI urn:x-enexis:ecdm:uid:1:569484 The URL of the location at the remote system where the log should be stored.                            | [00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLogRequest.ts#L56) |
