[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest

# 00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest

## Interfaces

### ComponentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L43)

A physical or logical component

#### Properties

| Property                              | Type                                          | Description                                                                                                                                                        | Defined in                                                                                                                                                                                                              |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L44) |
| <a id="evse"></a> `evse?`             | [`EVSEType`](#evsetype) \| `null`             | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L45) |
| <a id="instance"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                         | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L55) |
| <a id="name"></a> `name`              | `string`                                      | Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L50) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L25)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                              |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L26) |

---

### EVSEType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L63)

EVSE
urn:x-oca:ocpp:uid:2:233123
Electric Vehicle Supply Equipment

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                | Defined in                                                                                                                                                                                                              |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId?` | `number` \| `null`                            | An id to designate a specific connector (on an EVSE) by connector index number.                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L76) |
| <a id="customdata-1"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L64) |
| <a id="id"></a> `id`                    | `number`                                      | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L71) |

---

### GetVariableDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L33)

Class to hold parameters for GetVariables request.

#### Properties

| Property                                    | Type                                                           | Defined in                                                                                                                                                                                                              |
| ------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="attributetype"></a> `attributeType?` | [`AttributeEnumType`](../enums.md#attributeenumtype) \| `null` | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L35) |
| <a id="component"></a> `component`          | [`ComponentType`](#componenttype)                              | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L36) |
| <a id="customdata-2"></a> `customData?`     | [`CustomDataType`](#customdatatype) \| `null`                  | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L34) |
| <a id="variable"></a> `variable`            | [`VariableType`](#variabletype)                                | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L37) |

---

### GetVariablesRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                       | Type                                                                          | Description     | Defined in                                                                                                                                                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-3"></a> `customData?`        | [`CustomDataType`](#customdatatype) \| `null`                                 | -               | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L15) |
| <a id="getvariabledata"></a> `getVariableData` | \[[`GetVariableDataType`](#getvariabledatatype), `...GetVariableDataType[]`\] | **Min Items** 1 | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L19) |

---

### VariableType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:82](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L82)

Reference key to a component-variable.

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                      | Defined in                                                                                                                                                                                                              |
| --------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-4"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L83) |
| <a id="instance-1"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                        | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:93](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L93) |
| <a id="name-1"></a> `name`              | `string`                                      | Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts:88](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetVariablesRequest.ts#L88) |
