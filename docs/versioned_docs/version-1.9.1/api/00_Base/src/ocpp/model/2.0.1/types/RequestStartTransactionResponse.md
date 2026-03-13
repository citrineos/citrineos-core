[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse

# 00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L28)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                      |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L29) |

---

### RequestStartTransactionResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                    | Type                                                                           | Description                                                                                                                                                                                                                       | Defined in                                                                                                                                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null`                                  | -                                                                                                                                                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L15) |
| <a id="status"></a> `status`                | [`RequestStartStopStatusEnumType`](../enums.md#requeststartstopstatusenumtype) | -                                                                                                                                                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L16) |
| <a id="statusinfo"></a> `statusInfo?`       | [`StatusInfoType`](#statusinfotype) \| `null`                                  | -                                                                                                                                                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L17) |
| <a id="transactionid"></a> `transactionId?` | `string` \| `null`                                                             | When the transaction was already started by the Charging Station before the RequestStartTransactionRequest was received, for example: cable plugged in first. This contains the transactionId of the already started transaction. | [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L22) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L36)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                                      |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L47) |
| <a id="customdata-1"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L37) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.ts#L42) |
