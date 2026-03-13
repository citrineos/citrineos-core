[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse

# 00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts#L23)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                              |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts#L24) |

---

### CustomerInformationResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                              | Type                                                                                 | Defined in                                                                                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                                        | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts#L15) |
| <a id="status"></a> `status`          | [`CustomerInformationStatusEnumType`](../enums.md#customerinformationstatusenumtype) | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts#L16) |
| <a id="statusinfo"></a> `statusInfo?` | [`StatusInfoType`](#statusinfotype) \| `null`                                        | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts#L17) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts#L31)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts#L42) |
| <a id="customdata-1"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts#L32) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationResponse.ts#L37) |
