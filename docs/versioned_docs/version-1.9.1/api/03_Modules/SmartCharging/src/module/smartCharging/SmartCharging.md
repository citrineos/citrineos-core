[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 03_Modules/SmartCharging/src/module/smartCharging/SmartCharging

# 03_Modules/SmartCharging/src/module/smartCharging/SmartCharging

## Interfaces

### ISmartCharging

Defined in: [03_Modules/SmartCharging/src/module/smartCharging/SmartCharging.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/SmartCharging.ts#L8)

#### Methods

##### calculateChargingProfile()

```ts
calculateChargingProfile(
   request,
   transaction,
   tenantId,
stationId): Promise<ChargingProfileType>;
```

Defined in: [03_Modules/SmartCharging/src/module/smartCharging/SmartCharging.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/SmartCharging.ts#L18)

Interface for calculating charging profile based on the charging needs

###### Parameters

| Parameter     | Type                           | Description           |
| ------------- | ------------------------------ | --------------------- |
| `request`     | `NotifyEVChargingNeedsRequest` | charging need request |
| `transaction` | `Transaction`                  | -                     |
| `tenantId`    | `number`                       | -                     |
| `stationId`   | `string`                       | -                     |

###### Returns

`Promise`\<`ChargingProfileType`\>

charging profile

##### checkLimitsOfChargingSchedule()

```ts
checkLimitsOfChargingSchedule(
   request,
   tenantId,
   stationId,
transaction): Promise<void>;
```

Defined in: [03_Modules/SmartCharging/src/module/smartCharging/SmartCharging.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/smartCharging/SmartCharging.ts#L32)

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
