[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest

# 00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest

## Interfaces

### CostUpdatedRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                   | Type                                          | Description                                                                                                                                                                                                    | Defined in                                                                                                                                                                                                            |
| ------------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`      | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts#L14) |
| <a id="totalcost"></a> `totalCost`         | `number`                                      | Current total cost, based on the information known by the CSMS, of the transaction including taxes. In the currency configured with the configuration Variable: [&lt;&lt;configkey-currency, Currency&gt;&gt;] | [00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts#L20) |
| <a id="transactionid"></a> `transactionId` | `string`                                      | Transaction Id of the transaction the current cost are asked for.                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts#L26) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts#L32)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                            |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CostUpdatedRequest.ts#L33) |
