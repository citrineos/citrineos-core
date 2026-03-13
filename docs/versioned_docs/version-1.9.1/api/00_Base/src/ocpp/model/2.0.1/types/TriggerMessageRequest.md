[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest

# 00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts#L23)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                  |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts#L24) |

---

### EVSEType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts#L33)

EVSE
urn:x-oca:ocpp:uid:2:233123
Electric Vehicle Supply Equipment

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                | Defined in                                                                                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId?` | `number` \| `null`                            | An id to designate a specific connector (on an EVSE) by connector index number.                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts#L46) |
| <a id="customdata"></a> `customData?`   | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts#L34) |
| <a id="id"></a> `id`                    | `number`                                      | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts#L41) |

---

### TriggerMessageRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                         | Type                                                           | Defined in                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-1"></a> `customData?`          | [`CustomDataType`](#customdatatype) \| `null`                  | [00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts#L15) |
| <a id="evse"></a> `evse?`                        | [`EVSEType`](#evsetype) \| `null`                              | [00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts#L16) |
| <a id="requestedmessage"></a> `requestedMessage` | [`MessageTriggerEnumType`](../enums.md#messagetriggerenumtype) | [00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TriggerMessageRequest.ts#L17) |
