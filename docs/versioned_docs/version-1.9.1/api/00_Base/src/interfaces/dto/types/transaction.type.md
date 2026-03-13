[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/transaction.type

# 00_Base/src/interfaces/dto/types/transaction.type

## Type Aliases

### TransactionType

```ts
type TransactionType = z.infer<typeof TransactionTypeSchema>;
```

Defined in: [00_Base/src/interfaces/dto/types/transaction.type.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/transaction.type.ts#L16)

## Variables

### TransactionTypeSchema

```ts
const TransactionTypeSchema: ZodObject<
  {
    chargingState: ZodOptional<
      ZodNullable<
        ZodEnum<{
          Charging: 'Charging';
          EVConnected: 'EVConnected';
          Idle: 'Idle';
          SuspendedEV: 'SuspendedEV';
          SuspendedEVSE: 'SuspendedEVSE';
        }>
      >
    >;
    remoteStartId: ZodOptional<ZodNullable<ZodNumber>>;
    stoppedReason: ZodOptional<
      ZodNullable<
        ZodEnum<{
          DeAuthorized: 'DeAuthorized';
          EmergencyStop: 'EmergencyStop';
          EnergyLimitReached: 'EnergyLimitReached';
          EVDisconnected: 'EVDisconnected';
          GroundFault: 'GroundFault';
          ImmediateReset: 'ImmediateReset';
          Local: 'Local';
          LocalOutOfCredit: 'LocalOutOfCredit';
          MasterPass: 'MasterPass';
          Other: 'Other';
          OvercurrentFault: 'OvercurrentFault';
          PowerLoss: 'PowerLoss';
          PowerQuality: 'PowerQuality';
          Reboot: 'Reboot';
          Remote: 'Remote';
          SOCLimitReached: 'SOCLimitReached';
          StoppedByEV: 'StoppedByEV';
          TimeLimitReached: 'TimeLimitReached';
          Timeout: 'Timeout';
        }>
      >
    >;
    timeSpentCharging: ZodOptional<ZodNullable<ZodNumber>>;
    transactionId: ZodString;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/types/transaction.type.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/transaction.type.ts#L8)
