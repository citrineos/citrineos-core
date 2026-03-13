[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse

# 00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse

## Interfaces

### ComponentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L58)

A physical or logical component

#### Properties

| Property                              | Type                                          | Description                                                                                                                                                        | Defined in                                                                                                                                                                                                                |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L59) |
| <a id="evse"></a> `evse?`             | [`EVSEType`](#evsetype) \| `null`             | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L60) |
| <a id="instance"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                         | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L70) |
| <a id="name"></a> `name`              | `string`                                      | Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:65](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L65) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L25)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L26) |

---

### EVSEType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L78)

EVSE
urn:x-oca:ocpp:uid:2:233123
Electric Vehicle Supply Equipment

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                | Defined in                                                                                                                                                                                                                |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId?` | `number` \| `null`                            | An id to designate a specific connector (on an EVSE) by connector index number.                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L91) |
| <a id="customdata-1"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L79) |
| <a id="id"></a> `id`                    | `number`                                      | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:86](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L86) |

---

### SetVariableResultType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L29)

#### Properties

| Property                                                | Type                                                                 | Defined in                                                                                                                                                                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="attributestatus"></a> `attributeStatus`          | [`SetVariableStatusEnumType`](../enums.md#setvariablestatusenumtype) | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L32) |
| <a id="attributestatusinfo"></a> `attributeStatusInfo?` | [`StatusInfoType`](#statusinfotype) \| `null`                        | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L33) |
| <a id="attributetype"></a> `attributeType?`             | [`AttributeEnumType`](../enums.md#attributeenumtype) \| `null`       | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L31) |
| <a id="component"></a> `component`                      | [`ComponentType`](#componenttype)                                    | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L34) |
| <a id="customdata-2"></a> `customData?`                 | [`CustomDataType`](#customdatatype) \| `null`                        | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L30) |
| <a id="variable"></a> `variable`                        | [`VariableType`](#variabletype)                                      | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L35) |

---

### SetVariablesResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                           | Type                                                                                | Description     | Defined in                                                                                                                                                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-3"></a> `customData?`            | [`CustomDataType`](#customdatatype) \| `null`                                       | -               | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L15) |
| <a id="setvariableresult"></a> `setVariableResult` | \[[`SetVariableResultType`](#setvariableresulttype), `...SetVariableResultType[]`\] | **Min Items** 1 | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L19) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L41)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L52) |
| <a id="customdata-4"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L42) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L47) |

---

### VariableType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:97](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L97)

Reference key to a component-variable.

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                      | Defined in                                                                                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-5"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:98](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L98)   |
| <a id="instance-1"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                        | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L108) |
| <a id="name-1"></a> `name`              | `string`                                      | Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts:103](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetVariablesResponse.ts#L103) |
