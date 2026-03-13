[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper

# 01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper

## Classes

### ChargingProfileMapper

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L51)

#### Constructors

##### Constructor

```ts
new ChargingProfileMapper(): ChargingProfileMapper;
```

###### Returns

[`ChargingProfileMapper`](#chargingprofilemapper)

#### Methods

##### fromChargingProfileKind()

```ts
static fromChargingProfileKind(kind): "Absolute" | "Recurring" | "Relative";
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L63)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `kind`    | `string` |

###### Returns

`"Absolute"` \| `"Recurring"` \| `"Relative"`

##### fromChargingProfilePurpose()

```ts
static fromChargingProfilePurpose(purpose):
  | "ChargingStationExternalConstraints"
  | "ChargingStationMaxProfile"
  | "TxDefaultProfile"
  | "TxProfile";
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L56)

OCPP 1.6 'ChargePointMaxProfile' maps to native 'ChargingStationMaxProfile'.
All other enum values are identical and are type-safe casts.

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `purpose` | `string` |

###### Returns

\| `"ChargingStationExternalConstraints"`
\| `"ChargingStationMaxProfile"`
\| `"TxDefaultProfile"`
\| `"TxProfile"`

##### fromChargingRateUnit()

```ts
static fromChargingRateUnit(unit): "W" | "A";
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:72](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L72)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `unit`    | `string` |

###### Returns

`"W"` \| `"A"`

##### fromChargingSchedule()

```ts
static fromChargingSchedule(scheduleId, schedule): ChargingScheduleInput;
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:136](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L136)

Converts an OCPP 1.6 ChargingSchedule to a native ChargingScheduleInput.
Accepts a scheduleId since OCPP 1.6 schedules don't have their own id.

###### Parameters

| Parameter                         | Type                                                                                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scheduleId`                      | `number`                                                                                                                                                                                 |
| `schedule`                        | \{ `chargingRateUnit`: `string`; `chargingSchedulePeriod`: `object`[]; `duration?`: `number` \| `null`; `minChargingRate?`: `number` \| `null`; `startSchedule?`: `string` \| `null`; \} |
| `schedule.chargingRateUnit`       | `string`                                                                                                                                                                                 |
| `schedule.chargingSchedulePeriod` | `object`[]                                                                                                                                                                               |
| `schedule.duration?`              | `number` \| `null`                                                                                                                                                                       |
| `schedule.minChargingRate?`       | `number` \| `null`                                                                                                                                                                       |
| `schedule.startSchedule?`         | `string` \| `null`                                                                                                                                                                       |

###### Returns

[`ChargingScheduleInput`](#chargingscheduleinput)

##### fromRecurrencyKind()

```ts
static fromRecurrencyKind(kind?): "Daily" | "Weekly" | undefined;
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L67)

###### Parameters

| Parameter | Type               |
| --------- | ------------------ |
| `kind?`   | `string` \| `null` |

###### Returns

`"Daily"` \| `"Weekly"` \| `undefined`

##### fromRemoteStartChargingProfile()

```ts
static fromRemoteStartChargingProfile(profile): ChargingProfileInput;
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L107)

Converts an OCPP 1.6 RemoteStartTransaction chargingProfile to a native ChargingProfileInput.

###### Parameters

| Parameter                                         | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profile`                                         | \{ `chargingProfileId`: `number` \| `null`; `chargingProfileKind`: `RemoteStartTransactionRequestChargingProfileKind`; `chargingProfilePurpose`: `RemoteStartTransactionRequestChargingProfilePurpose`; `chargingSchedule`: \{ `chargingRateUnit`: `RemoteStartTransactionRequestChargingRateUnit`; `chargingSchedulePeriod`: `object`[]; `duration?`: `number` \| `null`; `minChargingRate?`: `number` \| `null`; `startSchedule?`: `string` \| `null`; \}; `recurrencyKind?`: `RemoteStartTransactionRequestRecurrencyKind` \| `null`; `stackLevel`: `number`; `transactionId?`: `number` \| `null`; `validFrom?`: `string` \| `null`; `validTo?`: `string` \| `null`; \} |
| `profile.chargingProfileId`                       | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `profile.chargingProfileKind`                     | `RemoteStartTransactionRequestChargingProfileKind`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `profile.chargingProfilePurpose`                  | `RemoteStartTransactionRequestChargingProfilePurpose`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `profile.chargingSchedule`                        | \{ `chargingRateUnit`: `RemoteStartTransactionRequestChargingRateUnit`; `chargingSchedulePeriod`: `object`[]; `duration?`: `number` \| `null`; `minChargingRate?`: `number` \| `null`; `startSchedule?`: `string` \| `null`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `profile.chargingSchedule.chargingRateUnit`       | `RemoteStartTransactionRequestChargingRateUnit`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `profile.chargingSchedule.chargingSchedulePeriod` | `object`[]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `profile.chargingSchedule.duration?`              | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `profile.chargingSchedule.minChargingRate?`       | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `profile.chargingSchedule.startSchedule?`         | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `profile.recurrencyKind?`                         | `RemoteStartTransactionRequestRecurrencyKind` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `profile.stackLevel`                              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `profile.transactionId?`                          | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `profile.validFrom?`                              | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `profile.validTo?`                                | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

###### Returns

[`ChargingProfileInput`](#chargingprofileinput)

##### fromSetChargingProfileRequest()

```ts
static fromSetChargingProfileRequest(profile): ChargingProfileInput;
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L79)

Converts an OCPP 1.6 SetChargingProfile csChargingProfiles to a native ChargingProfileInput.

###### Parameters

| Parameter                                         | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profile`                                         | \{ `chargingProfileId`: `number`; `chargingProfileKind`: `SetChargingProfileRequestChargingProfileKind`; `chargingProfilePurpose`: `SetChargingProfileRequestChargingProfilePurpose`; `chargingSchedule`: \{ `chargingRateUnit`: `SetChargingProfileRequestChargingRateUnit`; `chargingSchedulePeriod`: `object`[]; `duration?`: `number` \| `null`; `minChargingRate?`: `number` \| `null`; `startSchedule?`: `string` \| `null`; \}; `recurrencyKind?`: `SetChargingProfileRequestRecurrencyKind` \| `null`; `stackLevel`: `number`; `transactionId?`: `number` \| `null`; `validFrom?`: `string` \| `null`; `validTo?`: `string` \| `null`; \} |
| `profile.chargingProfileId`                       | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `profile.chargingProfileKind`                     | `SetChargingProfileRequestChargingProfileKind`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `profile.chargingProfilePurpose`                  | `SetChargingProfileRequestChargingProfilePurpose`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `profile.chargingSchedule`                        | \{ `chargingRateUnit`: `SetChargingProfileRequestChargingRateUnit`; `chargingSchedulePeriod`: `object`[]; `duration?`: `number` \| `null`; `minChargingRate?`: `number` \| `null`; `startSchedule?`: `string` \| `null`; \}                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `profile.chargingSchedule.chargingRateUnit`       | `SetChargingProfileRequestChargingRateUnit`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `profile.chargingSchedule.chargingSchedulePeriod` | `object`[]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `profile.chargingSchedule.duration?`              | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `profile.chargingSchedule.minChargingRate?`       | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `profile.chargingSchedule.startSchedule?`         | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `profile.recurrencyKind?`                         | `SetChargingProfileRequestRecurrencyKind` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `profile.stackLevel`                              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `profile.transactionId?`                          | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `profile.validFrom?`                              | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `profile.validTo?`                                | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

###### Returns

[`ChargingProfileInput`](#chargingprofileinput)

## Interfaces

### ChargingProfileInput

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L17)

Input type for creating/updating a ChargingProfile via the repository.
Uses native enum types.

#### Properties

| Property                                                     | Type                                                                                                                                                                                                                                                                                                                                | Defined in                                                                                                                                                                                                                            |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingprofilekind"></a> `chargingProfileKind`       | `"Absolute"` \| `"Recurring"` \| `"Relative"`                                                                                                                                                                                                                                                                                       | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L21) |
| <a id="chargingprofilepurpose"></a> `chargingProfilePurpose` | \| `"ChargingStationExternalConstraints"` \| `"ChargingStationMaxProfile"` \| `"TxDefaultProfile"` \| `"TxProfile"`                                                                                                                                                                                                                 | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L20) |
| <a id="chargingschedule"></a> `chargingSchedule`             | \| \[[`ChargingScheduleInput`](#chargingscheduleinput)\] \| \[[`ChargingScheduleInput`](#chargingscheduleinput), [`ChargingScheduleInput`](#chargingscheduleinput)\] \| \[[`ChargingScheduleInput`](#chargingscheduleinput), [`ChargingScheduleInput`](#chargingscheduleinput), [`ChargingScheduleInput`](#chargingscheduleinput)\] | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L25) |
| <a id="id"></a> `id`                                         | `number`                                                                                                                                                                                                                                                                                                                            | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L18) |
| <a id="recurrencykind"></a> `recurrencyKind?`                | `"Daily"` \| `"Weekly"` \| `null`                                                                                                                                                                                                                                                                                                   | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L22) |
| <a id="stacklevel"></a> `stackLevel`                         | `number`                                                                                                                                                                                                                                                                                                                            | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L19) |
| <a id="transactionid"></a> `transactionId?`                  | `string` \| `null`                                                                                                                                                                                                                                                                                                                  | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L29) |
| <a id="validfrom"></a> `validFrom?`                          | `string` \| `null`                                                                                                                                                                                                                                                                                                                  | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L23) |
| <a id="validto"></a> `validTo?`                              | `string` \| `null`                                                                                                                                                                                                                                                                                                                  | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L24) |

---

### ChargingScheduleInput

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L36)

Input type for creating a ChargingSchedule via the repository.
Uses native enum types.

#### Properties

| Property                                                     | Type                                                                                                  | Defined in                                                                                                                                                                                                                            |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingrateunit"></a> `chargingRateUnit`             | `"W"` \| `"A"`                                                                                        | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L40) |
| <a id="chargingscheduleperiod"></a> `chargingSchedulePeriod` | \[[`ChargingSchedulePeriodInput`](#chargingscheduleperiodinput), `...ChargingSchedulePeriodInput[]`\] | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L41) |
| <a id="duration"></a> `duration?`                            | `number` \| `null`                                                                                    | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L39) |
| <a id="id-1"></a> `id`                                       | `number`                                                                                              | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L37) |
| <a id="minchargingrate"></a> `minChargingRate?`              | `number` \| `null`                                                                                    | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L42) |
| <a id="startschedule"></a> `startSchedule?`                  | `string` \| `null`                                                                                    | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L38) |

---

### ChargingSchedulePeriodInput

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L45)

#### Properties

| Property                                  | Type               | Defined in                                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="limit"></a> `limit`                | `number`           | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L47) |
| <a id="numberphases"></a> `numberPhases?` | `number` \| `null` | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L48) |
| <a id="startperiod"></a> `startPeriod`    | `number`           | [01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/ChargingProfileMapper.ts#L46) |
