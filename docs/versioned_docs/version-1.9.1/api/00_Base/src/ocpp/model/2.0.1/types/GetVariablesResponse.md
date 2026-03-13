[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse

# 00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse

## Interfaces

### ComponentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L70)

A physical or logical component

#### Properties

| Property                              | Type                                          | Description                                                                                                                                                        | Defined in                                                                                                                                                                                                                |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L71) |
| <a id="evse"></a> `evse?`             | [`EVSEType`](#evsetype) \| `null`             | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:72](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L72) |
| <a id="instance"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                         | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:82](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L82) |
| <a id="name"></a> `name`              | `string`                                      | Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:77](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L77) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L25)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L26) |

---

### EVSEType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:90](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L90)

EVSE
urn:x-oca:ocpp:uid:2:233123
Electric Vehicle Supply Equipment

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                | Defined in                                                                                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId?` | `number` \| `null`                            | An id to designate a specific connector (on an EVSE) by connector index number.                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:103](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L103) |
| <a id="customdata-1"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L91)   |
| <a id="id"></a> `id`                    | `number`                                      | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:98](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L98)   |

---

### GetVariableResultType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L33)

Class to hold results of GetVariables request.

#### Properties

| Property                                                | Type                                                                 | Description                                                                                                                                                                                                                                                                                                                                                                                | Defined in                                                                                                                                                                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="attributestatus"></a> `attributeStatus`          | [`GetVariableStatusEnumType`](../enums.md#getvariablestatusenumtype) | -                                                                                                                                                                                                                                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L36) |
| <a id="attributestatusinfo"></a> `attributeStatusInfo?` | [`StatusInfoType`](#statusinfotype) \| `null`                        | -                                                                                                                                                                                                                                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L35) |
| <a id="attributetype"></a> `attributeType?`             | [`AttributeEnumType`](../enums.md#attributeenumtype) \| `null`       | -                                                                                                                                                                                                                                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L37) |
| <a id="attributevalue"></a> `attributeValue?`           | `string` \| `null`                                                   | Value of requested attribute type of component-variable. This field can only be empty when the given status is NOT accepted. The Configuration Variable &lt;&lt;configkey-reporting-value-size,ReportingValueSize&gt;&gt; can be used to limit GetVariableResult.attributeValue, VariableAttribute.value and EventData.actualValue. The max size of these values will always remain equal. | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L45) |
| <a id="component"></a> `component`                      | [`ComponentType`](#componenttype)                                    | -                                                                                                                                                                                                                                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L46) |
| <a id="customdata-2"></a> `customData?`                 | [`CustomDataType`](#customdatatype) \| `null`                        | -                                                                                                                                                                                                                                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L34) |
| <a id="variable"></a> `variable`                        | [`VariableType`](#variabletype)                                      | -                                                                                                                                                                                                                                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L47) |

---

### GetVariablesResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                           | Type                                                                                | Description     | Defined in                                                                                                                                                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-3"></a> `customData?`            | [`CustomDataType`](#customdatatype) \| `null`                                       | -               | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L15) |
| <a id="getvariableresult"></a> `getVariableResult` | \[[`GetVariableResultType`](#getvariableresulttype), `...GetVariableResultType[]`\] | **Min Items** 1 | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L19) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L53)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L64) |
| <a id="customdata-4"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L54) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L59) |

---

### VariableType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:109](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L109)

Reference key to a component-variable.

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                      | Defined in                                                                                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-5"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:110](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L110) |
| <a id="instance-1"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                        | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:120](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L120) |
| <a id="name-1"></a> `name`              | `string`                                      | Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesResponse.ts#L115) |
