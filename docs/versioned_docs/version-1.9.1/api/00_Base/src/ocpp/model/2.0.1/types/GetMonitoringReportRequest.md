[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest

# 00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest

## Interfaces

### ComponentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L59)

A physical or logical component

#### Properties

| Property                              | Type                                          | Description                                                                                                                                                        | Defined in                                                                                                                                                                                                                            |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L60) |
| <a id="evse"></a> `evse?`             | [`EVSEType`](#evsetype) \| `null`             | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L61) |
| <a id="instance"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                         | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L71) |
| <a id="name"></a> `name`              | `string`                                      | Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:66](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L66) |

---

### ComponentVariableType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L50)

Class to report components, variables and variable attributes and characteristics.

#### Properties

| Property                                | Type                                          | Defined in                                                                                                                                                                                                                            |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="component"></a> `component`      | [`ComponentType`](#componenttype)             | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L52) |
| <a id="customdata-1"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L51) |
| <a id="variable"></a> `variable?`       | [`VariableType`](#variabletype) \| `null`     | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L53) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L42)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                            |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L43) |

---

### EVSEType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L79)

EVSE
urn:x-oca:ocpp:uid:2:233123
Electric Vehicle Supply Equipment

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                | Defined in                                                                                                                                                                                                                            |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId?` | `number` \| `null`                            | An id to designate a specific connector (on an EVSE) by connector index number.                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:92](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L92) |
| <a id="customdata-2"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:80](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L80) |
| <a id="id"></a> `id`                    | `number`                                      | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:87](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L87) |

---

### GetMonitoringReportRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                              | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Description                                                                                                            | Defined in                                                                                                                                                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="componentvariable"></a> `componentVariable?`   | \| \[[`ComponentVariableType`](#componentvariabletype), `...ComponentVariableType[]`\] \| `null`                                                                                                                                                                                                                                                                                                                                                                                        | **Min Items** 1                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L19) |
| <a id="customdata-3"></a> `customData?`               | [`CustomDataType`](#customdatatype) \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                           | -                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L15) |
| <a id="monitoringcriteria"></a> `monitoringCriteria?` | \| \[[`MonitoringCriterionEnumType`](../enums.md#monitoringcriterionenumtype)\] \| \[[`MonitoringCriterionEnumType`](../enums.md#monitoringcriterionenumtype), [`MonitoringCriterionEnumType`](../enums.md#monitoringcriterionenumtype)\] \| \[[`MonitoringCriterionEnumType`](../enums.md#monitoringcriterionenumtype), [`MonitoringCriterionEnumType`](../enums.md#monitoringcriterionenumtype), [`MonitoringCriterionEnumType`](../enums.md#monitoringcriterionenumtype)\] \| `null` | This field contains criteria for components for which a monitoring report is requested **Min Items** 1 **Max Items** 3 | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L32) |
| <a id="requestid"></a> `requestId`                    | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | The Id of the request.                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L24) |

---

### VariableType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:98](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L98)

Reference key to a component-variable.

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                      | Defined in                                                                                                                                                                                                                              |
| --------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-4"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L99)   |
| <a id="instance-1"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                        | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:109](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L109) |
| <a id="name-1"></a> `name`              | `string`                                      | Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts:104](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.ts#L104) |
