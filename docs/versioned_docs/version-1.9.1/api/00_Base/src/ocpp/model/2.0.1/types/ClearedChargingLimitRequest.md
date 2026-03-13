[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest

# 00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest

## Interfaces

### ClearedChargingLimitRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                               | Type                                                                     | Description      | Defined in                                                                                                                                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="charginglimitsource"></a> `chargingLimitSource` | [`ChargingLimitSourceEnumType`](../enums.md#charginglimitsourceenumtype) | -                | [00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts#L16) |
| <a id="customdata"></a> `customData?`                  | [`CustomDataType`](#customdatatype) \| `null`                            | -                | [00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts#L15) |
| <a id="evseid"></a> `evseId?`                          | `number` \| `null`                                                       | EVSE Identifier. | [00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts#L21) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts#L27)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                              |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.ts#L28) |
