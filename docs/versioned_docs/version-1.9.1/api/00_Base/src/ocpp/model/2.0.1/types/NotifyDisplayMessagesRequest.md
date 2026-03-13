[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest

# 00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest

## Interfaces

### ComponentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:88](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L88)

A physical or logical component

#### Properties

| Property                              | Type                                          | Description                                                                                                                                                        | Defined in                                                                                                                                                                                                                                  |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:89](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L89)   |
| <a id="evse"></a> `evse?`             | [`EVSEType`](#evsetype) \| `null`             | -                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:90](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L90)   |
| <a id="instance"></a> `instance?`     | `string` \| `null`                            | Name of instance in case the component exists as multiple instances. Case Insensitive. strongly advised to use Camel Case.                                         | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L100) |
| <a id="name"></a> `name`              | `string`                                      | Name of the component. Name should be taken from the list of standardized component names whenever possible. Case Insensitive. strongly advised to use Camel Case. | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:95](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L95)   |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L39)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L40) |

---

### EVSEType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L108)

EVSE
urn:x-oca:ocpp:uid:2:233123
Electric Vehicle Supply Equipment

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                | Defined in                                                                                                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId?` | `number` \| `null`                            | An id to designate a specific connector (on an EVSE) by connector index number.                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:121](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L121) |
| <a id="customdata-1"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:109](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L109) |
| <a id="id"></a> `id`                    | `number`                                      | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:116](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L116) |

---

### MessageContentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:130](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L130)

Message\_ Content
urn:x-enexis:ecdm:uid:2:234490
Contains message details, for a message to be displayed on a Charging Station.

#### Properties

| Property                                | Type                                                         | Description                                                                                                                                                                          | Defined in                                                                                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="content"></a> `content`          | `string`                                                     | Message\_ Content. Content. Message urn:x-enexis:ecdm:uid:1:570852 Message contents.                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:147](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L147) |
| <a id="customdata-2"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                | -                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:131](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L131) |
| <a id="format"></a> `format`            | [`MessageFormatEnumType`](../enums.md#messageformatenumtype) | -                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:132](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L132) |
| <a id="language"></a> `language?`       | `string` \| `null`                                           | Message* Content. Language. Language* Code urn:x-enexis:ecdm:uid:1:570849 Message language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;. | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:139](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L139) |

---

### MessageInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L49)

Message\_ Info
urn:x-enexis:ecdm:uid:2:233264
Contains message details, for a message to be displayed on a Charging Station.

#### Properties

| Property                                    | Type                                                                 | Description                                                                                                                                                                                                                               | Defined in                                                                                                                                                                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-3"></a> `customData?`     | [`CustomDataType`](#customdatatype) \| `null`                        | -                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L50) |
| <a id="display"></a> `display?`             | [`ComponentType`](#componenttype) \| `null`                          | -                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L51) |
| <a id="enddatetime"></a> `endDateTime?`     | `string` \| `null`                                                   | Message* Info. End. Date* Time urn:x-enexis:ecdm:uid:1:569257 Until what date-time should this message be shown, after this date/time this message SHALL be removed.                                                                      | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:74](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L74) |
| <a id="id-1"></a> `id`                      | `number`                                                             | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 Master resource identifier, unique within an exchange context. It is defined within the OCPP context as a positive Integer value (greater or equal to zero). | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L58) |
| <a id="message"></a> `message`              | [`MessageContentType`](#messagecontenttype)                          | -                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:82](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L82) |
| <a id="priority"></a> `priority`            | [`MessagePriorityEnumType`](../enums.md#messagepriorityenumtype)     | -                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L59) |
| <a id="startdatetime"></a> `startDateTime?` | `string` \| `null`                                                   | Message* Info. Start. Date* Time urn:x-enexis:ecdm:uid:1:569256 From what date-time should this message be shown. If omitted: directly.                                                                                                   | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L67) |
| <a id="state"></a> `state?`                 | [`MessageStateEnumType`](../enums.md#messagestateenumtype) \| `null` | -                                                                                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L60) |
| <a id="transactionid"></a> `transactionId?` | `string` \| `null`                                                   | During which transaction shall this message be shown. Message SHALL be removed by the Charging Station after transaction has ended.                                                                                                       | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:81](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L81) |

---

### NotifyDisplayMessagesRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L18)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                | Type                                                                           | Description                                                                                                                                                                 | Defined in                                                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-4"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                                  | -                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L19) |
| <a id="messageinfo"></a> `messageInfo?` | \| \[[`MessageInfoType`](#messageinfotype), `...MessageInfoType[]`\] \| `null` | **Min Items** 1                                                                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L23) |
| <a id="requestid"></a> `requestId`      | `number`                                                                       | The id of the &lt;&lt;getdisplaymessagesrequest,GetDisplayMessagesRequest&gt;&gt; that requested this message.                                                              | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L28) |
| <a id="tbc"></a> `tbc?`                 | `boolean` \| `null`                                                            | "to be continued" indicator. Indicates whether another part of the report follows in an upcoming NotifyDisplayMessagesRequest message. Default value when omitted is false. | [00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.ts#L33) |
