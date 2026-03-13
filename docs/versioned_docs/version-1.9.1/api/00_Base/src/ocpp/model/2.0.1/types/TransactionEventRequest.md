[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest

# 00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest

## Interfaces

### AdditionalInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:234](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L234)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                           | Type                                          | Description                                                                                                                                   | Defined in                                                                                                                                                                                                                        |
| -------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalidtoken"></a> `additionalIdToken` | `string`                                      | This field specifies the additional IdToken.                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:240](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L240) |
| <a id="customdata"></a> `customData?`              | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:235](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L235) |
| <a id="type"></a> `type`                           | `string`                                      | This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties. | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:245](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L245) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L70)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                      |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L71) |

---

### EVSEType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:198](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L198)

EVSE
urn:x-oca:ocpp:uid:2:233123
Electric Vehicle Supply Equipment

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                | Defined in                                                                                                                                                                                                                        |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId?` | `number` \| `null`                            | An id to designate a specific connector (on an EVSE) by connector index number.                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:211](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L211) |
| <a id="customdata-1"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:199](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L199) |
| <a id="id"></a> `id`                    | `number`                                      | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 EVSE Identifier. This contains a number (&gt; 0) designating an EVSE of the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:206](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L206) |

---

### IdTokenType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:217](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L217)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                      | Type                                                                                    | Description                                                                                                    | Defined in                                                                                                                                                                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | \| \[[`AdditionalInfoType`](#additionalinfotype), `...AdditionalInfoType[]`\] \| `null` | **Min Items** 1                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:222](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L222) |
| <a id="customdata-2"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null`                                           | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:218](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L218) |
| <a id="idtoken"></a> `idToken`                | `string`                                                                                | IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID. | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:227](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L227) |
| <a id="type-1"></a> `type`                    | [`IdTokenEnumType`](../enums.md#idtokenenumtype)                                        | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:228](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L228) |

---

### MeterValueType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:80](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L80)

Meter\_ Value
urn:x-oca:ocpp:uid:2:233265
Collection of one or more sampled values in MeterValuesRequest and TransactionEvent. All sampled values in a MeterValue are sampled at the same point in time.

#### Properties

| Property                                 | Type                                                                 | Description                                                                                      | Defined in                                                                                                                                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-3"></a> `customData?`  | [`CustomDataType`](#customdatatype) \| `null`                        | -                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:81](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L81) |
| <a id="sampledvalue"></a> `sampledValue` | \[[`SampledValueType`](#sampledvaluetype), `...SampledValueType[]`\] | **Min Items** 1                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:85](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L85) |
| <a id="timestamp"></a> `timestamp`       | `string`                                                             | Meter* Value. Timestamp. Date* Time urn:x-oca:ocpp:uid:1:569259 Timestamp for measured value(s). | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:92](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L92) |

---

### SampledValueType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:102](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L102)

Sampled\_ Value
urn:x-oca:ocpp:uid:2:233266
Single sampled value in MeterValues. Each value can be accompanied by optional fields.

To save on mobile data usage, default values of all of the optional fields are such that. The value without any additional fields will be interpreted, as a register reading of active import energy in Wh (Watt-hour) units.

#### Properties

| Property                                          | Type                                                                     | Description                                                                               | Defined in                                                                                                                                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="context"></a> `context?`                   | [`ReadingContextEnumType`](../enums.md#readingcontextenumtype) \| `null` | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:112](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L112) |
| <a id="customdata-4"></a> `customData?`           | [`CustomDataType`](#customdatatype) \| `null`                            | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:103](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L103) |
| <a id="location"></a> `location?`                 | [`LocationEnumType`](../enums.md#locationenumtype) \| `null`             | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L115) |
| <a id="measurand"></a> `measurand?`               | [`MeasurandEnumType`](../enums.md#measurandenumtype) \| `null`           | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:113](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L113) |
| <a id="phase"></a> `phase?`                       | [`PhaseEnumType`](../enums.md#phaseenumtype) \| `null`                   | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:114](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L114) |
| <a id="signedmetervalue"></a> `signedMeterValue?` | [`SignedMeterValueType`](#signedmetervaluetype) \| `null`                | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:116](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L116) |
| <a id="unitofmeasure"></a> `unitOfMeasure?`       | [`UnitOfMeasureType`](#unitofmeasuretype) \| `null`                      | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:117](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L117) |
| <a id="value"></a> `value`                        | `number`                                                                 | Sampled\_ Value. Value. Measure urn:x-oca:ocpp:uid:1:569260 Indicates the measured value. | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L111) |

---

### SignedMeterValueType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L123)

Represent a signed version of the meter value.

#### Properties

| Property                                       | Type                                          | Description                                                                                                                                                           | Defined in                                                                                                                                                                                                                        |
| ---------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-5"></a> `customData?`        | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                     | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:124](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L124) |
| <a id="encodingmethod"></a> `encodingMethod`   | `string`                                      | Method used to encode the meter values before applying the digital signature algorithm.                                                                               | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:139](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L139) |
| <a id="publickey"></a> `publicKey`             | `string`                                      | Base64 encoded, sending depends on configuration variable _PublicKeyWithSignedMeterValue_.                                                                            | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:144](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L144) |
| <a id="signedmeterdata"></a> `signedMeterData` | `string`                                      | Base64 encoded, contains the signed data which might contain more then just the meter value. It can contain information like timestamps, reference to a customer etc. | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:129](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L129) |
| <a id="signingmethod"></a> `signingMethod`     | `string`                                      | Method used to create the digital signature.                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L134) |

---

### TransactionEventRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L24)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                              | Type                                                                     | Description                                                                                                                                                                                    | Defined in                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="cablemaxcurrent"></a> `cableMaxCurrent?`       | `number` \| `null`                                                       | The maximum current of the connected cable in Ampere (A).                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L56) |
| <a id="customdata-6"></a> `customData?`               | [`CustomDataType`](#customdatatype) \| `null`                            | -                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L25) |
| <a id="eventtype"></a> `eventType`                    | [`TransactionEventEnumType`](../enums.md#transactioneventenumtype)       | -                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L26) |
| <a id="evse"></a> `evse?`                             | [`EVSEType`](#evsetype) \| `null`                                        | -                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L63) |
| <a id="idtoken-1"></a> `idToken?`                     | [`IdTokenType`](#idtokentype) \| `null`                                  | -                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L64) |
| <a id="metervalue"></a> `meterValue?`                 | \[[`MeterValueType`](#metervaluetype), `...MeterValueType[]`\] \| `null` | **Min Items** 1                                                                                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L30) |
| <a id="numberofphasesused"></a> `numberOfPhasesUsed?` | `number` \| `null`                                                       | If the Charging Station is able to report the number of phases used, then it SHALL provide it. When omitted the CSMS may be able to determine the number of phases used via device management. | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L51) |
| <a id="offline"></a> `offline?`                       | `boolean` \| `null`                                                      | Indication that this transaction event happened when the Charging Station was offline. Default = false, meaning: the event occurred when the Charging Station was online.                      | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L46) |
| <a id="reservationid"></a> `reservationId?`           | `number` \| `null`                                                       | This contains the Id of the reservation that terminates as a result of this transaction.                                                                                                       | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L61) |
| <a id="seqno"></a> `seqNo`                            | `number`                                                                 | Incremental sequence number, helps with determining if all messages of a transaction have been received.                                                                                       | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L41) |
| <a id="timestamp-1"></a> `timestamp`                  | `string`                                                                 | The date and time at which this transaction event occurred.                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L35) |
| <a id="transactioninfo"></a> `transactionInfo`        | [`TransactionType`](#transactiontype)                                    | -                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L62) |
| <a id="triggerreason"></a> `triggerReason`            | [`TriggerReasonEnumType`](../enums.md#triggerreasonenumtype)             | -                                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L36) |

---

### TransactionType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:170](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L170)

Transaction
urn:x-oca:ocpp:uid:2:233318

#### Properties

| Property                                            | Type                                                                   | Description                                                                                                                                                                                                                                                        | Defined in                                                                                                                                                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingstate"></a> `chargingState?`         | [`ChargingStateEnumType`](../enums.md#chargingstateenumtype) \| `null` | -                                                                                                                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:177](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L177) |
| <a id="customdata-7"></a> `customData?`             | [`CustomDataType`](#customdatatype) \| `null`                          | -                                                                                                                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:171](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L171) |
| <a id="remotestartid"></a> `remoteStartId?`         | `number` \| `null`                                                     | The ID given to remote start request (&lt;&lt;requeststarttransactionrequest, RequestStartTransactionRequest&gt;&gt;. This enables to CSMS to match the started transaction to the given start request.                                                            | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:190](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L190) |
| <a id="stoppedreason"></a> `stoppedReason?`         | [`ReasonEnumType`](../enums.md#reasonenumtype) \| `null`               | -                                                                                                                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:185](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L185) |
| <a id="timespentcharging"></a> `timeSpentCharging?` | `number` \| `null`                                                     | Transaction. Time* Spent* Charging. Elapsed\_ Time urn:x-oca:ocpp:uid:1:569415 Contains the total time that energy flowed from EVSE to EV during the transaction (in seconds). Note that timeSpentCharging is smaller or equal to the duration of the transaction. | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:184](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L184) |
| <a id="transactionid"></a> `transactionId`          | `string`                                                               | This contains the Id of the transaction.                                                                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:176](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L176) |

---

### UnitOfMeasureType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:150](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L150)

Represents a UnitOfMeasure with a multiplier

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                                                                                                                     | Defined in                                                                                                                                                                                                                        |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-8"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                                                                                                                               | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:151](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L151) |
| <a id="multiplier"></a> `multiplier?`   | `number` \| `null`                            | Multiplier, this value represents the exponent to base 10. I.e. multiplier 3 means 10 raised to the 3rd power. Default is 0.                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:163](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L163) |
| <a id="unit"></a> `unit?`               | `string` \| `null`                            | Unit of the value. Default = "Wh" if the (default) measurand is an "Energy" type. This field SHALL use a value from the list Standardized Units of Measurements in Part 2 Appendices. If an applicable unit is available in that list, otherwise a "custom" unit might be used. | [00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts:158](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/TransactionEventRequest.ts#L158) |
