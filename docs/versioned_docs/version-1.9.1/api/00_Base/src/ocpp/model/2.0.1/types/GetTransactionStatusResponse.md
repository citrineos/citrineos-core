[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse

# 00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts#L30)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts#L31) |

---

### GetTransactionStatusResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts#L13)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                          | Type                                          | Description                                      | Defined in                                                                                                                                                                                                                                |
| ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`             | [`CustomDataType`](#customdatatype) \| `null` | -                                                | [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts#L14) |
| <a id="messagesinqueue"></a> `messagesInQueue`    | `boolean`                                     | Whether there are still message to be delivered. | [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts#L24) |
| <a id="ongoingindicator"></a> `ongoingIndicator?` | `boolean` \| `null`                           | Whether the transaction is still ongoing.        | [00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.ts#L19) |
