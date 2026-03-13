[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse

# 00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts#L23)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                      |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts#L24) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts#L31)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                      |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts#L42) |
| <a id="customdata"></a> `customData?`         | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts#L32) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts#L37) |

---

### UnlockConnectorResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                | Type                                                       | Defined in                                                                                                                                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-1"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`              | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts#L15) |
| <a id="status"></a> `status`            | [`UnlockStatusEnumType`](../enums.md#unlockstatusenumtype) | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts#L16) |
| <a id="statusinfo"></a> `statusInfo?`   | [`StatusInfoType`](#statusinfotype) \| `null`              | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorResponse.ts#L17) |
