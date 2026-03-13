[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest

# 00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest

## Interfaces

### ComponentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:110](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L110)

A physical or logical component

#### Properties

| Property                              | Type                                          | Description                                                                                                                                                        | Defined in                                                                                                                                                                                                              |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L111) |
| <a id="evse"></a> `evse?`             | [`EVSEType`](#evsetype) \| `null`             | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:112](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L112) |
| <a id="instance"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                         | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:122](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L122) |
| <a id="name"></a> `name`              | `string`                                      | Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:117](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L117) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L40)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                            |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L41) |

---

### EventDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L48)

Class to report an event notification for a component-variable.

#### Properties

| Property                                                   | Type                                                                 | Description                                                                                                                                                                                                                                                                                                          | Defined in                                                                                                                                                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="actualvalue"></a> `actualValue`                     | `string`                                                             | Actual value (_attributeType_ Actual) of the variable. The Configuration Variable &lt;&lt;configkey-reporting-value-size,ReportingValueSize&gt;&gt; can be used to limit GetVariableResult.attributeValue, VariableAttribute.value and EventData.actualValue. The max size of these values will always remain equal. | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L75)   |
| <a id="cause"></a> `cause?`                                | `number` \| `null`                                                   | Refers to the Id of an event that is considered to be the cause for this event.                                                                                                                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L67)   |
| <a id="cleared"></a> `cleared?`                            | `boolean` \| `null`                                                  | _Cleared_ is set to true to report the clearing of a monitored situation, i.e. a 'return to normal'.                                                                                                                                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L91)   |
| <a id="component"></a> `component`                         | [`ComponentType`](#componenttype)                                    | -                                                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:97](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L97)   |
| <a id="customdata-1"></a> `customData?`                    | [`CustomDataType`](#customdatatype) \| `null`                        | -                                                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L49)   |
| <a id="eventid"></a> `eventId`                             | `number`                                                             | Identifies the event. This field can be referred to as a cause by other events.                                                                                                                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L55)   |
| <a id="eventnotificationtype"></a> `eventNotificationType` | [`EventNotificationEnumType`](../enums.md#eventnotificationenumtype) | -                                                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:103](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L103) |
| <a id="techcode"></a> `techCode?`                          | `string` \| `null`                                                   | Technical (error) code as reported by component.                                                                                                                                                                                                                                                                     | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:80](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L80)   |
| <a id="techinfo"></a> `techInfo?`                          | `string` \| `null`                                                   | Technical detail information as reported by component.                                                                                                                                                                                                                                                               | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:85](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L85)   |
| <a id="timestamp"></a> `timestamp`                         | `string`                                                             | Timestamp of the moment the report was generated.                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L60)   |
| <a id="transactionid"></a> `transactionId?`                | `string` \| `null`                                                   | If an event notification is linked to a specific transaction, this field can be used to specify its transactionId.                                                                                                                                                                                                   | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:96](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L96)   |
| <a id="trigger"></a> `trigger`                             | [`EventTriggerEnumType`](../enums.md#eventtriggerenumtype)           | -                                                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L61)   |
| <a id="variable"></a> `variable`                           | [`VariableType`](#variabletype)                                      | -                                                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:104](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L104) |
| <a id="variablemonitoringid"></a> `variableMonitoringId?`  | `number` \| `null`                                                   | Identifies the VariableMonitoring which triggered the event.                                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:102](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L102) |

---

### EVSEType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:130](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L130)

EVSE
urn:x-oca:ocpp:uid:2:233123
Electric Vehicle Supply Equipment

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                | Defined in                                                                                                                                                                                                              |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId?` | `number` \| `null`                            | An id to designate a specific connector (on an EVSE) by connector index number.                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:143](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L143) |
| <a id="customdata-2"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:131](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L131) |
| <a id="id"></a> `id`                    | `number`                                      | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:138](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L138) |

---

### NotifyEventRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                | Type                                                        | Description                                                                                                                                                       | Defined in                                                                                                                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-3"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`               | -                                                                                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L15) |
| <a id="eventdata"></a> `eventData`      | \[[`EventDataType`](#eventdatatype), `...EventDataType[]`\] | **Min Items** 1                                                                                                                                                   | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L34) |
| <a id="generatedat"></a> `generatedAt`  | `string`                                                    | Timestamp of the moment this message was generated at the Charging Station.                                                                                       | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L20) |
| <a id="seqno"></a> `seqNo`              | `number`                                                    | Sequence number of this message. First message starts at 0.                                                                                                       | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L30) |
| <a id="tbc"></a> `tbc?`                 | `boolean` \| `null`                                         | “to be continued” indicator. Indicates whether another part of the report follows in an upcoming notifyEventRequest message. Default value when omitted is false. | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L25) |

---

### VariableType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:149](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L149)

Reference key to a component-variable.

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                      | Defined in                                                                                                                                                                                                              |
| --------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-4"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:150](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L150) |
| <a id="instance-1"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the variable exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                        | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:160](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L160) |
| <a id="name-1"></a> `name`              | `string`                                      | Name of the variable. Name should be taken from the list of standardized variable names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts:155](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEventRequest.ts#L155) |
