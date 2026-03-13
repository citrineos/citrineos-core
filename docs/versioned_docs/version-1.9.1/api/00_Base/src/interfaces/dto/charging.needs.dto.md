[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/charging.needs.dto

# 00_Base/src/interfaces/dto/charging.needs.dto

## Type Aliases

### ChargingNeedsCreate

```ts
type ChargingNeedsCreate = z.infer<typeof ChargingNeedsCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.needs.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.needs.dto.ts#L35)

---

### ChargingNeedsDto

```ts
type ChargingNeedsDto = z.infer<typeof ChargingNeedsSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.needs.dto.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.needs.dto.ts#L26)

## Variables

### ChargingNeedsCreateSchema

```ts
const ChargingNeedsCreateSchema: ZodObject<
  {
    acChargingParameters: ZodOptional<
      ZodNullable<
        ZodObject<
          {
            energyAmount: ZodNumber;
            evMaxCurrent: ZodNumber;
            evMaxVoltage: ZodNumber;
            evMinCurrent: ZodNumber;
          },
          $strip
        >
      >
    >;
    dcChargingParameters: ZodOptional<
      ZodNullable<
        ZodObject<
          {
            bulkSoC: ZodOptional<ZodNullable<ZodNumber>>;
            energyAmount: ZodOptional<ZodNullable<ZodNumber>>;
            evEnergyCapacity: ZodOptional<ZodNullable<ZodNumber>>;
            evMaxCurrent: ZodNumber;
            evMaxPower: ZodOptional<ZodNullable<ZodNumber>>;
            evMaxVoltage: ZodNumber;
            fullSoC: ZodOptional<ZodNullable<ZodNumber>>;
            stateOfCharge: ZodOptional<ZodNullable<ZodNumber>>;
          },
          $strip
        >
      >
    >;
    departureTime: ZodOptional<ZodNullable<ZodISODateTime>>;
    evseId: ZodNumber;
    maxScheduleTuples: ZodOptional<ZodNullable<ZodNumber>>;
    requestedEnergyTransfer: ZodEnum<{
      AC_single_phase: 'AC_single_phase';
      AC_three_phase: 'AC_three_phase';
      AC_two_phase: 'AC_two_phase';
      DC: 'DC';
    }>;
    tenantId: ZodOptional<ZodNumber>;
    transactionDatabaseId: ZodNumber;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/charging.needs.dto.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.needs.dto.ts#L28)

---

### ChargingNeedsProps

```ts
const ChargingNeedsProps: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.needs.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.needs.dto.ts#L24)

#### Type Declaration

| Name                                                                    | Type                        | Defined in |
| ----------------------------------------------------------------------- | --------------------------- | ---------- |
| <a id="property-acchargingparameters"></a> `acChargingParameters`       | `"acChargingParameters"`    |            |
| <a id="property-createdat"></a> `createdAt`                             | `"createdAt"`               |            |
| <a id="property-dcchargingparameters"></a> `dcChargingParameters`       | `"dcChargingParameters"`    |            |
| <a id="property-departuretime"></a> `departureTime`                     | `"departureTime"`           |            |
| <a id="property-evseid"></a> `evseId`                                   | `"evseId"`                  |            |
| <a id="property-id"></a> `id`                                           | `"id"`                      |            |
| <a id="property-maxscheduletuples"></a> `maxScheduleTuples`             | `"maxScheduleTuples"`       |            |
| <a id="property-requestedenergytransfer"></a> `requestedEnergyTransfer` | `"requestedEnergyTransfer"` |            |
| <a id="property-tenant"></a> `tenant`                                   | `"tenant"`                  |            |
| <a id="property-tenantid"></a> `tenantId`                               | `"tenantId"`                |            |
| <a id="property-transactiondatabaseid"></a> `transactionDatabaseId`     | `"transactionDatabaseId"`   |            |
| <a id="property-updatedat"></a> `updatedAt`                             | `"updatedAt"`               |            |

---

### ChargingNeedsSchema

```ts
const ChargingNeedsSchema: ZodObject<{
  acChargingParameters: ZodOptional<ZodNullable<ZodObject<{
     energyAmount: ZodNumber;
     evMaxCurrent: ZodNumber;
     evMaxVoltage: ZodNumber;
     evMinCurrent: ZodNumber;
  }, $strip>>>;
  createdAt: ZodOptional<ZodDate>;
  dcChargingParameters: ZodOptional<ZodNullable<ZodObject<{
     bulkSoC: ZodOptional<ZodNullable<ZodNumber>>;
     energyAmount: ZodOptional<ZodNullable<ZodNumber>>;
     evEnergyCapacity: ZodOptional<ZodNullable<ZodNumber>>;
     evMaxCurrent: ZodNumber;
     evMaxPower: ZodOptional<ZodNullable<ZodNumber>>;
     evMaxVoltage: ZodNumber;
     fullSoC: ZodOptional<ZodNullable<ZodNumber>>;
     stateOfCharge: ZodOptional<ZodNullable<ZodNumber>>;
  }, $strip>>>;
  departureTime: ZodOptional<ZodNullable<ZodISODateTime>>;
  evseId: ZodNumber;
  id: ZodOptional<ZodNumber>;
  maxScheduleTuples: ZodOptional<ZodNullable<ZodNumber>>;
  requestedEnergyTransfer: ZodEnum<{
     AC_single_phase: "AC_single_phase";
     AC_three_phase: "AC_three_phase";
     AC_two_phase: "AC_two_phase";
     DC: "DC";
  }>;
  tenant: ZodOptional<ZodObject<{
     countryCode: ZodOptional<ZodNullable<ZodString>>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     isUserTenant: ZodDefault<ZodBoolean>;
     name: ZodString;
     partyId: ZodOptional<ZodNullable<ZodString>>;
     serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<{
        credentialsRole: ZodObject<{
           businessDetails: ...;
           role: ...;
        }, $strip>;
        versionDetails: ZodArray<ZodObject<..., ...>>;
        versionEndpoints: ZodRecord<ZodString, ZodArray<...>>;
     }, $strip>>>;
     updatedAt: ZodOptional<ZodDate>;
     url: ZodOptional<ZodNullable<ZodString>>;
  }, $strip>>;
  tenantId: ZodOptional<ZodNumber>;
  transactionDatabaseId: ZodNumber;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/charging.needs.dto.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.needs.dto.ts#L13)

---

### chargingNeedsSchemas

```ts
const chargingNeedsSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.needs.dto.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.needs.dto.ts#L37)

#### Type Declaration

| Name                                                            | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Default value               | Defined in                                                                                                                                                                                            |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-chargingneeds"></a> `ChargingNeeds`             | `ZodObject`\<\{ `acChargingParameters`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `energyAmount`: `ZodNumber`; `evMaxCurrent`: `ZodNumber`; `evMaxVoltage`: `ZodNumber`; `evMinCurrent`: `ZodNumber`; \}, `$strip`\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `dcChargingParameters`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `bulkSoC`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `energyAmount`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `evEnergyCapacity`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `evMaxCurrent`: `ZodNumber`; `evMaxPower`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `evMaxVoltage`: `ZodNumber`; `fullSoC`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `stateOfCharge`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>\>\>; `departureTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `evseId`: `ZodNumber`; `id`: `ZodOptional`\<`ZodNumber`\>; `maxScheduleTuples`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `requestedEnergyTransfer`: `ZodEnum`\<\{ `AC_single_phase`: `"AC_single_phase"`; `AC_three_phase`: `"AC_three_phase"`; `AC_two_phase`: `"AC_two_phase"`; `DC`: `"DC"`; \}\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `transactionDatabaseId`: `ZodNumber`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `ChargingNeedsSchema`       | [00_Base/src/interfaces/dto/charging.needs.dto.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.needs.dto.ts#L38) |
| <a id="property-chargingneedscreate"></a> `ChargingNeedsCreate` | `ZodObject`\<\{ `acChargingParameters`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `energyAmount`: `ZodNumber`; `evMaxCurrent`: `ZodNumber`; `evMaxVoltage`: `ZodNumber`; `evMinCurrent`: `ZodNumber`; \}, `$strip`\>\>\>; `dcChargingParameters`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `bulkSoC`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `energyAmount`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `evEnergyCapacity`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `evMaxCurrent`: `ZodNumber`; `evMaxPower`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `evMaxVoltage`: `ZodNumber`; `fullSoC`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `stateOfCharge`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>\>\>; `departureTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `evseId`: `ZodNumber`; `maxScheduleTuples`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `requestedEnergyTransfer`: `ZodEnum`\<\{ `AC_single_phase`: `"AC_single_phase"`; `AC_three_phase`: `"AC_three_phase"`; `AC_two_phase`: `"AC_two_phase"`; `DC`: `"DC"`; \}\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `transactionDatabaseId`: `ZodNumber`; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `ChargingNeedsCreateSchema` | [00_Base/src/interfaces/dto/charging.needs.dto.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.needs.dto.ts#L39) |
