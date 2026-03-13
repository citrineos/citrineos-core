[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest

# 00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L42)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                            |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L43) |

---

### MeterValuesRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L24)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                                           | Description                                                                                                                                                                                                 | Defined in                                                                                                                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                  | -                                                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L25) |
| <a id="evseid"></a> `evseId`          | `number`                                                       | Request* Body. EVSEID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:571101 This contains a number (&gt;0) designating an EVSE of the Charging Station. ‘0’ (zero) is used to designate the main power meter. | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L32) |
| <a id="metervalue"></a> `meterValue`  | \[[`MeterValueType`](#metervaluetype), `...MeterValueType[]`\] | **Min Items** 1                                                                                                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L36) |

---

### MeterValueType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L52)

Meter\_ Value
urn:x-oca:ocpp:uid:2:233265
Collection of one or more sampled values in MeterValuesRequest and TransactionEvent. All sampled values in a MeterValue are sampled at the same point in time.

#### Properties

| Property                                 | Type                                                                 | Description                                                                                      | Defined in                                                                                                                                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-1"></a> `customData?`  | [`CustomDataType`](#customdatatype) \| `null`                        | -                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L53) |
| <a id="sampledvalue"></a> `sampledValue` | \[[`SampledValueType`](#sampledvaluetype), `...SampledValueType[]`\] | **Min Items** 1                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L57) |
| <a id="timestamp"></a> `timestamp`       | `string`                                                             | Meter* Value. Timestamp. Date* Time urn:x-oca:ocpp:uid:1:569259 Timestamp for measured value(s). | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L64) |

---

### SampledValueType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:74](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L74)

Sampled\_ Value
urn:x-oca:ocpp:uid:2:233266
Single sampled value in MeterValues. Each value can be accompanied by optional fields.

To save on mobile data usage, default values of all of the optional fields are such that. The value without any additional fields will be interpreted, as a register reading of active import energy in Wh (Watt-hour) units.

#### Properties

| Property                                          | Type                                                                     | Description                                                                               | Defined in                                                                                                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="context"></a> `context?`                   | [`ReadingContextEnumType`](../enums.md#readingcontextenumtype) \| `null` | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:84](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L84) |
| <a id="customdata-2"></a> `customData?`           | [`CustomDataType`](#customdatatype) \| `null`                            | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L75) |
| <a id="location"></a> `location?`                 | [`LocationEnumType`](../enums.md#locationenumtype) \| `null`             | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:87](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L87) |
| <a id="measurand"></a> `measurand?`               | [`MeasurandEnumType`](../enums.md#measurandenumtype) \| `null`           | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:85](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L85) |
| <a id="phase"></a> `phase?`                       | [`PhaseEnumType`](../enums.md#phaseenumtype) \| `null`                   | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:86](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L86) |
| <a id="signedmetervalue"></a> `signedMeterValue?` | [`SignedMeterValueType`](#signedmetervaluetype) \| `null`                | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:88](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L88) |
| <a id="unitofmeasure"></a> `unitOfMeasure?`       | [`UnitOfMeasureType`](#unitofmeasuretype) \| `null`                      | -                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:89](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L89) |
| <a id="value"></a> `value`                        | `number`                                                                 | Sampled\_ Value. Value. Measure urn:x-oca:ocpp:uid:1:569260 Indicates the measured value. | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L83) |

---

### SignedMeterValueType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:95](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L95)

Represent a signed version of the meter value.

#### Properties

| Property                                       | Type                                          | Description                                                                                                                                                           | Defined in                                                                                                                                                                                                              |
| ---------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-3"></a> `customData?`        | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                     | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:96](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L96)   |
| <a id="encodingmethod"></a> `encodingMethod`   | `string`                                      | Method used to encode the meter values before applying the digital signature algorithm.                                                                               | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L111) |
| <a id="publickey"></a> `publicKey`             | `string`                                      | Base64 encoded, sending depends on configuration variable _PublicKeyWithSignedMeterValue_.                                                                            | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:116](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L116) |
| <a id="signedmeterdata"></a> `signedMeterData` | `string`                                      | Base64 encoded, contains the signed data which might contain more then just the meter value. It can contain information like timestamps, reference to a customer etc. | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:101](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L101) |
| <a id="signingmethod"></a> `signingMethod`     | `string`                                      | Method used to create the digital signature.                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:106](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L106) |

---

### UnitOfMeasureType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:122](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L122)

Represents a UnitOfMeasure with a multiplier

#### Properties

| Property                                | Type                                          | Description                                                                                                                                                                                                                                                                     | Defined in                                                                                                                                                                                                              |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-4"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                                                                                                                               | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L123) |
| <a id="multiplier"></a> `multiplier?`   | `number` \| `null`                            | Multiplier, this value represents the exponent to base 10. I.e. multiplier 3 means 10 raised to the 3rd power. Default is 0.                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:135](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L135) |
| <a id="unit"></a> `unit?`               | `string` \| `null`                            | Unit of the value. Default = "Wh" if the (default) measurand is an "Energy" type. This field SHALL use a value from the list Standardized Units of Measurements in Part 2 Appendices. If an applicable unit is available in that list, otherwise a "custom" unit might be used. | [00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts:130](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/MeterValuesRequest.ts#L130) |
