[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 00_Base/src/util/MeterValueUtils

# 00_Base/src/util/MeterValueUtils

## Classes

### MeterValueUtils

Defined in: [00_Base/src/util/MeterValueUtils.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L14)

#### Constructors

##### Constructor

```ts
new MeterValueUtils(): MeterValueUtils;
```

###### Returns

[`MeterValueUtils`](#metervalueutils)

#### Properties

| Property                                   | Modifier  | Type                                                                                                                                                                               | Defined in                                                                                                                                                                  |
| ------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="validcontexts"></a> `validContexts` | `private` | `Set`\< \| `"Other"` \| `"Sample.Periodic"` \| `"Interruption.Begin"` \| `"Interruption.End"` \| `"Sample.Clock"` \| `"Transaction.Begin"` \| `"Transaction.End"` \| `"Trigger"`\> | [00_Base/src/util/MeterValueUtils.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L15) |

#### Methods

##### filterValidMeterValues()

```ts
private static filterValidMeterValues(meterValues): object[];
```

Defined in: [00_Base/src/util/MeterValueUtils.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L83)

Filter out meter values whose context is not one of the valid reading contexts.

###### Parameters

| Parameter     | Type       | Description                        |
| ------------- | ---------- | ---------------------------------- |
| `meterValues` | `object`[] | Array of MeterValueType to filter. |

###### Returns

`object`[]

Filtered array containing only meter values in Transaction_Begin, Sample_Periodic or Transaction_End contexts.

##### findMeasurandValue()

```ts
private static findMeasurandValue(
   sampledValues,
   measurand,
   phased): number | null;
```

Defined in: [00_Base/src/util/MeterValueUtils.ts:167](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L167)

Find a specific measurand value from sampledValues

###### Parameters

| Parameter       | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Description                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `sampledValues` | `object`[]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Array of sampled values                                               |
| `measurand`     | \| `"Energy.Active.Import.Register"` \| `"Current.Export"` \| `"Current.Import"` \| `"Current.Offered"` \| `"Energy.Active.Export.Register"` \| `"Energy.Reactive.Export.Register"` \| `"Energy.Reactive.Import.Register"` \| `"Energy.Active.Export.Interval"` \| `"Energy.Active.Import.Interval"` \| `"Energy.Active.Net"` \| `"Energy.Reactive.Export.Interval"` \| `"Energy.Reactive.Import.Interval"` \| `"Energy.Reactive.Net"` \| `"Energy.Apparent.Net"` \| `"Energy.Apparent.Import"` \| `"Energy.Apparent.Export"` \| `"Frequency"` \| `"Power.Active.Export"` \| `"Power.Active.Import"` \| `"Power.Factor"` \| `"Power.Offered"` \| `"Power.Reactive.Export"` \| `"Power.Reactive.Import"` \| `"SoC"` \| `"Voltage"` \| `"Temperature"` \| `"RPM"` | The measurand type to look for                                        |
| `phased`        | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Whether to look for phased values (true) or non-phased values (false) |

###### Returns

`number` \| `null`

The normalized value in kWh, or null if not found

##### getIntervalValuesMap()

```ts
private static getIntervalValuesMap(meterValues): Map<number, number>;
```

Defined in: [00_Base/src/util/MeterValueUtils.ts:120](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L120)

Extracts Energy.Active.Import.Interval measurand values into a timestamp-to-kWh map.

###### Parameters

| Parameter     | Type       | Description                                              |
| ------------- | ---------- | -------------------------------------------------------- |
| `meterValues` | `object`[] | Array of MeterValueType to search for interval readings. |

###### Returns

`Map`\<`number`, `number`\>

Map where each key is the reading timestamp (ms since epoch) and each value is the normalized kWh.

##### getMeterStart()

```ts
static getMeterStart(meterValues): number | null;
```

Defined in: [00_Base/src/util/MeterValueUtils.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L63)

###### Parameters

| Parameter     | Type       |
| ------------- | ---------- |
| `meterValues` | `object`[] |

###### Returns

`number` \| `null`

##### getNetValuesMap()

```ts
private static getNetValuesMap(meterValues): Map<number, number>;
```

Defined in: [00_Base/src/util/MeterValueUtils.ts:144](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L144)

Extracts Energy.Active.Net measurand values into a timestamp-to-kWh map.

###### Parameters

| Parameter     | Type       | Description                                         |
| ------------- | ---------- | --------------------------------------------------- |
| `meterValues` | `object`[] | Array of MeterValueType to search for net readings. |

###### Returns

`Map`\<`number`, `number`\>

Map where each key is the reading timestamp (ms since epoch) and each value is the normalized kWh.

##### getRegisterValuesMap()

```ts
private static getRegisterValuesMap(meterValues): Map<number, number>;
```

Defined in: [00_Base/src/util/MeterValueUtils.ts:96](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L96)

Extracts Energy.Active.Import.Register measurand values into a timestamp-to-kWh map.

###### Parameters

| Parameter     | Type       | Description                                              |
| ------------- | ---------- | -------------------------------------------------------- |
| `meterValues` | `object`[] | Array of MeterValueType to search for register readings. |

###### Returns

`Map`\<`number`, `number`\>

Map where each key is the reading timestamp (ms since epoch) and each value is the normalized kWh.

##### getSortedKwhByTimestampAscending()

```ts
private static getSortedKwhByTimestampAscending(valuesMap): number[];
```

Defined in: [00_Base/src/util/MeterValueUtils.ts:270](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L270)

Sort the entries of a timestamp-to-kWh map ascending by timestamp and return the kWh values.

###### Parameters

| Parameter   | Type                        | Description                               |
| ----------- | --------------------------- | ----------------------------------------- |
| `valuesMap` | `Map`\<`number`, `number`\> | Map of timestamp (ms since epoch) to kWh. |

###### Returns

`number`[]

Array of kWh values sorted by timestamp.

##### getTotalKwh()

```ts
static getTotalKwh(
   meterValues,
   currentTotal,
   meterStart?): number;
```

Defined in: [00_Base/src/util/MeterValueUtils.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L29)

Calculate the total Kwh

###### Parameters

| Parameter      | Type       | Description                                                               |
| -------------- | ---------- | ------------------------------------------------------------------------- |
| `meterValues`  | `object`[] | meterValues of a transaction.                                             |
| `currentTotal` | `number`   | the current total Kwh to add to interval values, if needed.               |
| `meterStart?`  | `number`   | the starting Kwh value at the beginning of the transaction, if available. |

###### Returns

`number`

total Kwh based on the best available energy measurement.

##### normalizeToKwh()

```ts
private static normalizeToKwh(value): number | null;
```

Defined in: [00_Base/src/util/MeterValueUtils.ts:243](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L243)

Convert a sampled value to kWh, applying unit multipliers.

###### Parameters

| Parameter                 | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Description               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `value`                   | \{ `context?`: \| `"Other"` \| `"Sample.Periodic"` \| `"Interruption.Begin"` \| `"Interruption.End"` \| `"Sample.Clock"` \| `"Transaction.Begin"` \| `"Transaction.End"` \| `"Trigger"` \| `null`; `location?`: `"Outlet"` \| `"Body"` \| `"Cable"` \| `"EV"` \| `"Inlet"` \| `null`; `measurand?`: \| `"Energy.Active.Import.Register"` \| `"Current.Export"` \| `"Current.Import"` \| `"Current.Offered"` \| `"Energy.Active.Export.Register"` \| `"Energy.Reactive.Export.Register"` \| `"Energy.Reactive.Import.Register"` \| `"Energy.Active.Export.Interval"` \| `"Energy.Active.Import.Interval"` \| `"Energy.Active.Net"` \| `"Energy.Reactive.Export.Interval"` \| `"Energy.Reactive.Import.Interval"` \| `"Energy.Reactive.Net"` \| `"Energy.Apparent.Net"` \| `"Energy.Apparent.Import"` \| `"Energy.Apparent.Export"` \| `"Frequency"` \| `"Power.Active.Export"` \| `"Power.Active.Import"` \| `"Power.Factor"` \| `"Power.Offered"` \| `"Power.Reactive.Export"` \| `"Power.Reactive.Import"` \| `"SoC"` \| `"Voltage"` \| `"Temperature"` \| `"RPM"` \| `null`; `phase?`: \| `"L1"` \| `"L2"` \| `"L3"` \| `"N"` \| `"L1-N"` \| `"L2-N"` \| `"L3-N"` \| `"L1-L2"` \| `"L2-L3"` \| `"L3-L1"` \| `null`; `signedMeterValue?`: \| \{ `encodingMethod`: `string`; `publicKey`: `string`; `signedMeterData`: `string`; `signingMethod`: `string`; \} \| `null`; `unitOfMeasure?`: \| \{ `multiplier?`: `number` \| `null`; `unit?`: `string` \| `null`; \} \| `null`; `value`: `number`; \} | A SampledValueType entry. |
| `value.context?`          | \| `"Other"` \| `"Sample.Periodic"` \| `"Interruption.Begin"` \| `"Interruption.End"` \| `"Sample.Clock"` \| `"Transaction.Begin"` \| `"Transaction.End"` \| `"Trigger"` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | -                         |
| `value.location?`         | `"Outlet"` \| `"Body"` \| `"Cable"` \| `"EV"` \| `"Inlet"` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | -                         |
| `value.measurand?`        | \| `"Energy.Active.Import.Register"` \| `"Current.Export"` \| `"Current.Import"` \| `"Current.Offered"` \| `"Energy.Active.Export.Register"` \| `"Energy.Reactive.Export.Register"` \| `"Energy.Reactive.Import.Register"` \| `"Energy.Active.Export.Interval"` \| `"Energy.Active.Import.Interval"` \| `"Energy.Active.Net"` \| `"Energy.Reactive.Export.Interval"` \| `"Energy.Reactive.Import.Interval"` \| `"Energy.Reactive.Net"` \| `"Energy.Apparent.Net"` \| `"Energy.Apparent.Import"` \| `"Energy.Apparent.Export"` \| `"Frequency"` \| `"Power.Active.Export"` \| `"Power.Active.Import"` \| `"Power.Factor"` \| `"Power.Offered"` \| `"Power.Reactive.Export"` \| `"Power.Reactive.Import"` \| `"SoC"` \| `"Voltage"` \| `"Temperature"` \| `"RPM"` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | -                         |
| `value.phase?`            | \| `"L1"` \| `"L2"` \| `"L3"` \| `"N"` \| `"L1-N"` \| `"L2-N"` \| `"L3-N"` \| `"L1-L2"` \| `"L2-L3"` \| `"L3-L1"` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | -                         |
| `value.signedMeterValue?` | \| \{ `encodingMethod`: `string`; `publicKey`: `string`; `signedMeterData`: `string`; `signingMethod`: `string`; \} \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | -                         |
| `value.unitOfMeasure?`    | \| \{ `multiplier?`: `number` \| `null`; `unit?`: `string` \| `null`; \} \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | -                         |
| `value.value`             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | -                         |

###### Returns

`number` \| `null`

The converted value in kWh, or null if unit is missing.

##### sumPhasedValues()

```ts
private static sumPhasedValues(sampledValues, measurand): number | null;
```

Defined in: [00_Base/src/util/MeterValueUtils.ts:188](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/util/MeterValueUtils.ts#L188)

Sum phased values for a specific measurand

###### Parameters

| Parameter       | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Description               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `sampledValues` | `object`[]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Array of sampled values   |
| `measurand`     | \| `"Energy.Active.Import.Register"` \| `"Current.Export"` \| `"Current.Import"` \| `"Current.Offered"` \| `"Energy.Active.Export.Register"` \| `"Energy.Reactive.Export.Register"` \| `"Energy.Reactive.Import.Register"` \| `"Energy.Active.Export.Interval"` \| `"Energy.Active.Import.Interval"` \| `"Energy.Active.Net"` \| `"Energy.Reactive.Export.Interval"` \| `"Energy.Reactive.Import.Interval"` \| `"Energy.Reactive.Net"` \| `"Energy.Apparent.Net"` \| `"Energy.Apparent.Import"` \| `"Energy.Apparent.Export"` \| `"Frequency"` \| `"Power.Active.Export"` \| `"Power.Active.Import"` \| `"Power.Factor"` \| `"Power.Offered"` \| `"Power.Reactive.Export"` \| `"Power.Reactive.Import"` \| `"SoC"` \| `"Voltage"` \| `"Temperature"` \| `"RPM"` | The measurand type to sum |

###### Returns

`number` \| `null`

The sum of phase values in kWh, or null if no valid phase values found
