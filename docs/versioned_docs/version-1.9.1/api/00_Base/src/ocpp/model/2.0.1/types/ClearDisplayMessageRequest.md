[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest

# 00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest

## Interfaces

### ClearDisplayMessageRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                          | Description                                                        | Defined in                                                                                                                                                                                                                            |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                  | [00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.ts#L14) |
| <a id="id"></a> `id`                  | `number`                                      | Id of the message that SHALL be removed from the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.ts#L19) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.ts#L25)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                            |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.ts#L26) |
