[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest

# 00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest

## Interfaces

### ClearVariableMonitoringRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                          | Description                                                                 | Defined in                                                                                                                                                                                                                                    |
| ------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                           | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.ts#L14) |
| <a id="id"></a> `id`                  | \[`number`, `...number[]`\]                   | List of the monitors to be cleared, identified by there Id. **Min Items** 1 | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.ts#L21) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.ts#L27)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                    |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.ts#L28) |
