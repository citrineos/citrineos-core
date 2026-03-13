[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest

# 00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.ts#L50)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                          |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.ts#L51) |

---

### SetMonitoringLevelRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Defined in                                                                                                                                                                                                                          |
| ------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.ts#L14) |
| <a id="severity"></a> `severity`      | `number`                                      | The Charging Station SHALL only report events with a severity number lower than or equal to this severity. The severity range is 0-9, with 0 as the highest and 9 as the lowest severity level. The severity levels have the following meaning: + _0-Danger_ + Indicates lives are potentially in danger. Urgent attention is needed and action should be taken immediately. + _1-Hardware Failure_ + Indicates that the Charging Station is unable to continue regular operations due to Hardware issues. Action is required. + _2-System Failure_ + Indicates that the Charging Station is unable to continue regular operations due to software or minor hardware issues. Action is required. + _3-Critical_ + Indicates a critical error. Action is required. + _4-Error_ + Indicates a non-urgent error. Action is required. + _5-Alert_ + Indicates an alert event. Default severity for any type of monitoring event. + _6-Warning_ + Indicates a warning event. Action may be required. + _7-Notice_ + Indicates an unusual event. No immediate action is required. + _8-Informational_ + Indicates a regular operational event. May be used for reporting, measuring throughput, etc. No action is required. + _9-Debug_ + Indicates information useful to developers for debugging, not useful during operations. | [00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.ts#L44) |
