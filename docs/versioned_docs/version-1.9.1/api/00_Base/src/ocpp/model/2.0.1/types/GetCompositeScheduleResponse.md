[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse

# 00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse

## Interfaces

### ChargingSchedulePeriodType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:84](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L84)

Charging* Schedule* Period
urn:x-oca:ocpp:uid:2:233257
Charging schedule period structure defines a time period in a charging schedule.

#### Properties

| Property                                  | Type                                          | Description                                                                                                                                                                                                                                                                                                                                     | Defined in                                                                                                                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`     | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                                                                                                                                                                                               | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:85](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L85)   |
| <a id="limit"></a> `limit`                | `number`                                      | Charging* Schedule* Period. Limit. Measure urn:x-oca:ocpp:uid:1:569241 Charging rate limit during the schedule period, in the applicable chargingRateUnit, for example in Amperes (A) or Watts (W). Accepts at most one digit fraction (e.g. 8.1).                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L99)   |
| <a id="numberphases"></a> `numberPhases?` | `number` \| `null`                            | Charging* Schedule* Period. Number\_ Phases. Counter urn:x-oca:ocpp:uid:1:569242 The number of phases that can be used for charging. If a number of phases is needed, numberPhases=3 will be assumed unless another number is given.                                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:106](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L106) |
| <a id="phasetouse"></a> `phaseToUse?`     | `number` \| `null`                            | Values: 1..3, Used if numberPhases=1 and if the EVSE is capable of switching the phase connected to the EV, i.e. ACPhaseSwitchingSupported is defined and true. It’s not allowed unless both conditions above are true. If both conditions are true, and phaseToUse is omitted, the Charging Station / EVSE will make the selection on its own. | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:112](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L112) |
| <a id="startperiod"></a> `startPeriod`    | `number`                                      | Charging* Schedule* Period. Start* Period. Elapsed* Time urn:x-oca:ocpp:uid:1:569240 Start of the period, in seconds from the start of schedule. The value of StartPeriod also defines the stop time of the previous period.                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:92](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L92)   |

---

### CompositeScheduleType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L50)

Composite\_ Schedule
urn:x-oca:ocpp:uid:2:233362

#### Properties

| Property                                                     | Type                                                                                               | Description                                                                                                                                                                                      | Defined in                                                                                                                                                                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingrateunit"></a> `chargingRateUnit`             | [`ChargingRateUnitEnumType`](../enums.md#chargingrateunitenumtype)                                 | -                                                                                                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L76) |
| <a id="chargingscheduleperiod"></a> `chargingSchedulePeriod` | \[[`ChargingSchedulePeriodType`](#chargingscheduleperiodtype), `...ChargingSchedulePeriodType[]`\] | **Min Items** 1                                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L55) |
| <a id="customdata-1"></a> `customData?`                      | [`CustomDataType`](#customdatatype) \| `null`                                                      | -                                                                                                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L51) |
| <a id="duration"></a> `duration`                             | `number`                                                                                           | Duration of the schedule in seconds.                                                                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L68) |
| <a id="evseid"></a> `evseId`                                 | `number`                                                                                           | The ID of the EVSE for which the schedule is requested. When evseid=0, the Charging Station calculated the expected consumption for the grid connection.                                         | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L63) |
| <a id="schedulestart"></a> `scheduleStart`                   | `string`                                                                                           | Composite* Schedule. Start. Date* Time urn:x-oca:ocpp:uid:1:569456 Date and time at which the schedule becomes active. All time measurements within the schedule are relative to this timestamp. | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L75) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L24)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L25) |

---

### GetCompositeScheduleResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                | Type                                                         | Defined in                                                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-2"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L15) |
| <a id="schedule"></a> `schedule?`       | [`CompositeScheduleType`](#compositescheduletype) \| `null`  | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L18) |
| <a id="status"></a> `status`            | [`GenericStatusEnumType`](../enums.md#genericstatusenumtype) | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L16) |
| <a id="statusinfo"></a> `statusInfo?`   | [`StatusInfoType`](#statusinfotype) \| `null`                | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L17) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L32)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L43) |
| <a id="customdata-3"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L33) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.ts#L38) |
