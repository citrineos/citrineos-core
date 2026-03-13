[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest

# 00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.ts#L25)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                              |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.ts#L26) |

---

### GetTransactionStatusRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                    | Type                                          | Description                                                  | Defined in                                                                                                                                                                                                                              |
| ------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                            | [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.ts#L14) |
| <a id="transactionid"></a> `transactionId?` | `string` \| `null`                            | The Id of the transaction for which the status is requested. | [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.ts#L19) |
