[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging

# 03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging

## Classes

### InternalSmartCharging

Defined in: [03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts#L11)

#### Implements

- [`ISmartCharging`](SmartCharging.md#ismartcharging)

#### Constructors

##### Constructor

```ts
new InternalSmartCharging(chargingProfileRepository, logger?): InternalSmartCharging;
```

Defined in: [03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts#L15)

###### Parameters

| Parameter                   | Type                         |
| --------------------------- | ---------------------------- |
| `chargingProfileRepository` | `IChargingProfileRepository` |
| `logger?`                   | `Logger`\<`ILogObj`\>        |

###### Returns

[`InternalSmartCharging`](#internalsmartcharging)

#### Properties

| Property                                                             | Modifier    | Type                         | Defined in                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------- | ----------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_chargingprofilerepository"></a> `_chargingProfileRepository` | `protected` | `IChargingProfileRepository` | [03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts#L12) |
| <a id="_logger"></a> `_logger`                                       | `readonly`  | `Logger`\<`ILogObj`\>        | [03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts#L13) |

#### Methods

##### \_findExistingChargingProfileWithHighestStackLevel()

```ts
private _findExistingChargingProfileWithHighestStackLevel(
   tenantId,
   stationId,
transactionDatabaseId): Promise<ChargingProfile | undefined>;
```

Defined in: [03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts:195](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts#L195)

###### Parameters

| Parameter               | Type     |
| ----------------------- | -------- |
| `tenantId`              | `number` |
| `stationId`             | `string` |
| `transactionDatabaseId` | `string` |

###### Returns

`Promise`\<`ChargingProfile` \| `undefined`\>

##### \_getChargingRateUnitAndLimit()

```ts
private _getChargingRateUnitAndLimit(
   evMaxCurrent,
   evMaxVoltage,
   evMaxPower?): [ChargingRateUnitEnumType, number];
```

Defined in: [03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts:182](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts#L182)

###### Parameters

| Parameter      | Type               |
| -------------- | ------------------ |
| `evMaxCurrent` | `number`           |
| `evMaxVoltage` | `number`           |
| `evMaxPower?`  | `number` \| `null` |

###### Returns

\[`ChargingRateUnitEnumType`, `number`\]

##### \_validateLimitAgainstExistingProfile()

```ts
private _validateLimitAgainstExistingProfile(
   limit,
   tenantId,
   stationId,
transactionDataBaseId): Promise<void>;
```

Defined in: [03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts:221](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts#L221)

###### Parameters

| Parameter               | Type     |
| ----------------------- | -------- |
| `limit`                 | `number` |
| `tenantId`              | `number` |
| `stationId`             | `string` |
| `transactionDataBaseId` | `string` |

###### Returns

`Promise`\<`void`\>

##### calculateChargingProfile()

```ts
calculateChargingProfile(
   request,
   transaction,
   tenantId,
stationId): Promise<ChargingProfileType>;
```

Defined in: [03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts#L35)

Generates a `ChargingProfileType` from the given `NotifyEVChargingNeedsRequest`.

This method creates a charging profile based on the EV's charging needs and the specified energy transfer mode.
The profile includes the necessary parameters to set up a charging schedule for the EV.

###### Parameters

| Parameter     | Type                           | Description                                                                                 |
| ------------- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| `request`     | `NotifyEVChargingNeedsRequest` | The `NotifyEVChargingNeedsRequest` containing details about the EV's charging requirements. |
| `transaction` | `Transaction`                  | The ID of the transaction associated with the charging profile.                             |
| `tenantId`    | `number`                       | -                                                                                           |
| `stationId`   | `string`                       | The ID of the station                                                                       |

###### Returns

`Promise`\<`ChargingProfileType`\>

A `ChargingProfileType`.

###### Throws

Error if the energy transfer mode is unsupported.

###### Implementation of

[`ISmartCharging`](SmartCharging.md#ismartcharging).[`calculateChargingProfile`](SmartCharging.md#calculatechargingprofile)

##### checkLimitsOfChargingSchedule()

```ts
checkLimitsOfChargingSchedule(
   request,
   tenantId,
   stationId,
transaction): Promise<void>;
```

Defined in: [03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts:143](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/InternalSmartCharging.ts#L143)

Inteface for checking EV charging schedule is within limits of CSMS ChargingSchedule

###### Parameters

| Parameter     | Type                              | Description                  |
| ------------- | --------------------------------- | ---------------------------- |
| `request`     | `NotifyEVChargingScheduleRequest` | EV charging schedule request |
| `tenantId`    | `number`                          | -                            |
| `stationId`   | `string`                          | -                            |
| `transaction` | `Transaction`                     | -                            |

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`ISmartCharging`](SmartCharging.md#ismartcharging).[`checkLimitsOfChargingSchedule`](SmartCharging.md#checklimitsofchargingschedule)
