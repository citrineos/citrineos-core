[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse

# 00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts#L23)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                          |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts#L24) |

---

### SetNetworkProfileResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                              | Type                                                                             | Defined in                                                                                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                                    | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts#L15) |
| <a id="status"></a> `status`          | [`SetNetworkProfileStatusEnumType`](../enums.md#setnetworkprofilestatusenumtype) | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts#L16) |
| <a id="statusinfo"></a> `statusInfo?` | [`StatusInfoType`](#statusinfotype) \| `null`                                    | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts#L17) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts#L31)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts#L42) |
| <a id="customdata-1"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts#L32) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.ts#L37) |
