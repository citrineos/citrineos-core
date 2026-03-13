[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest

# 00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest

## Interfaces

### ComponentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L75)

A physical or logical component

#### Properties

| Property                              | Type                                          | Description                                                                                                                                                        | Defined in                                                                                                                                                                                                                        |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L76) |
| <a id="evse"></a> `evse?`             | [`EVSEType`](#evsetype) \| `null`             | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:77](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L77) |
| <a id="instance"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                         | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:87](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L87) |
| <a id="name"></a> `name`              | `string`                                      | Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:82](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L82) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L26)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                        |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L27) |

---

### EVSEType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:95](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L95)

EVSE
urn:x-oca:ocpp:uid:2:233123
Electric Vehicle Supply Equipment

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                | Defined in                                                                                                                                                                                                                          |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId?` | `number` \| `null`                            | An id to designate a specific connector (on an EVSE) by connector index number.                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L108) |
| <a id="customdata-1"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:96](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L96)   |
| <a id="id"></a> `id`                    | `number`                                      | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:103](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L103) |

---

### MessageContentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:117](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L117)

Message\_ Content
urn:x-enexis:ecdm:uid:2:234490
Contains message details, for a message to be displayed on a Charging Station.

#### Properties

| Property                                | Type                                                         | Description                                                                                                                                                                          | Defined in                                                                                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="content"></a> `content`          | `string`                                                     | Message\_ Content. Content. Message urn:x-enexis:ecdm:uid:1:570852 Message contents.                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L134) |
| <a id="customdata-2"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                | -                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:118](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L118) |
| <a id="format"></a> `format`            | [`MessageFormatEnumType`](../enums.md#messageformatenumtype) | -                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:119](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L119) |
| <a id="language"></a> `language?`       | `string` \| `null`                                           | Message* Content. Language. Language* Code urn:x-enexis:ecdm:uid:1:570849 Message language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;. | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:126](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L126) |

---

### MessageInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L36)

Message\_ Info
urn:x-enexis:ecdm:uid:2:233264
Contains message details, for a message to be displayed on a Charging Station.

#### Properties

| Property                                    | Type                                                                 | Description                                                                                                                                                                                                                               | Defined in                                                                                                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-3"></a> `customData?`     | [`CustomDataType`](#customdatatype) \| `null`                        | -                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L37) |
| <a id="display"></a> `display?`             | [`ComponentType`](#componenttype) \| `null`                          | -                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L38) |
| <a id="enddatetime"></a> `endDateTime?`     | `string` \| `null`                                                   | Message* Info. End. Date* Time urn:x-enexis:ecdm:uid:1:569257 Until what date-time should this message be shown, after this date/time this message SHALL be removed.                                                                      | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L61) |
| <a id="id-1"></a> `id`                      | `number`                                                             | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 Master resource identifier, unique within an exchange context. It is defined within the OCPP context as a positive Integer value (greater or equal to zero). | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L45) |
| <a id="message"></a> `message`              | [`MessageContentType`](#messagecontenttype)                          | -                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L69) |
| <a id="priority"></a> `priority`            | [`MessagePriorityEnumType`](../enums.md#messagepriorityenumtype)     | -                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L46) |
| <a id="startdatetime"></a> `startDateTime?` | `string` \| `null`                                                   | Message* Info. Start. Date* Time urn:x-enexis:ecdm:uid:1:569256 From what date-time should this message be shown. If omitted: directly.                                                                                                   | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L54) |
| <a id="state"></a> `state?`                 | [`MessageStateEnumType`](../enums.md#messagestateenumtype) \| `null` | -                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L47) |
| <a id="transactionid"></a> `transactionId?` | `string` \| `null`                                                   | During which transaction shall this message be shown. Message SHALL be removed by the Charging Station after transaction has ended.                                                                                                       | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L68) |

---

### SetDisplayMessageRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L18)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                | Type                                          | Defined in                                                                                                                                                                                                                        |
| --------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-4"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L19) |
| <a id="message-1"></a> `message`        | [`MessageInfoType`](#messageinfotype)         | [00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.ts#L20) |
