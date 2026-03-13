[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/1.6/types/StartTransactionResponse

# 00_Base/src/ocpp/model/1.6/types/StartTransactionResponse

## Interfaces

### StartTransactionResponse

Defined in: [00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                   | Type                                                                           | Defined in                                                                                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="idtaginfo"></a> `idTagInfo`         | `object`                                                                       | [00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts#L15) |
| `idTagInfo.expiryDate?`                    | `string` \| `null`                                                             | [00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts#L16) |
| `idTagInfo.parentIdTag?`                   | `string` \| `null`                                                             | [00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts#L17) |
| `idTagInfo.status`                         | [`StartTransactionResponseStatus`](../enums.md#starttransactionresponsestatus) | [00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts#L18) |
| <a id="transactionid"></a> `transactionId` | `number`                                                                       | [00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/StartTransactionResponse.ts#L20) |
