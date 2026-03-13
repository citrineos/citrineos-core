[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/meter.value.dto

# 00_Base/src/interfaces/dto/meter.value.dto

## Type Aliases

### MeterValueCreate

```ts
type MeterValueCreate = z.infer<typeof MeterValueCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/meter.value.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/meter.value.dto.ts#L31)

---

### MeterValueDto

```ts
type MeterValueDto = z.infer<typeof MeterValueSchema>;
```

Defined in: [00_Base/src/interfaces/dto/meter.value.dto.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/meter.value.dto.ts#L22)

## Variables

### MeterValueCreateSchema

```ts
const MeterValueCreateSchema: ZodObject<{
  connectorId: ZodOptional<ZodNumber>;
  sampledValue: ZodTuple<[ZodObject<{
     context: ZodOptional<ZodNullable<ZodEnum<{
        Interruption.Begin: "Interruption.Begin";
        Interruption.End: "Interruption.End";
        Other: "Other";
        Sample.Clock: "Sample.Clock";
        Sample.Periodic: "Sample.Periodic";
        Transaction.Begin: "Transaction.Begin";
        Transaction.End: "Transaction.End";
        Trigger: "Trigger";
     }>>>;
     location: ZodOptional<ZodNullable<ZodEnum<{
        Body: "Body";
        Cable: "Cable";
        EV: "EV";
        Inlet: "Inlet";
        Outlet: "Outlet";
     }>>>;
     measurand: ZodOptional<ZodNullable<ZodEnum<{
        Current.Export: "Current.Export";
        Current.Import: "Current.Import";
        Current.Offered: "Current.Offered";
        Energy.Active.Export.Interval: "Energy.Active.Export.Interval";
        Energy.Active.Export.Register: "Energy.Active.Export.Register";
        Energy.Active.Import.Interval: "Energy.Active.Import.Interval";
        Energy.Active.Import.Register: "Energy.Active.Import.Register";
        Energy.Active.Net: "Energy.Active.Net";
        Energy.Apparent.Export: "Energy.Apparent.Export";
        Energy.Apparent.Import: "Energy.Apparent.Import";
        Energy.Apparent.Net: "Energy.Apparent.Net";
        Energy.Reactive.Export.Interval: "Energy.Reactive.Export.Interval";
        Energy.Reactive.Export.Register: "Energy.Reactive.Export.Register";
        Energy.Reactive.Import.Interval: "Energy.Reactive.Import.Interval";
        Energy.Reactive.Import.Register: "Energy.Reactive.Import.Register";
        Energy.Reactive.Net: "Energy.Reactive.Net";
        Frequency: "Frequency";
        Power.Active.Export: "Power.Active.Export";
        Power.Active.Import: "Power.Active.Import";
        Power.Factor: "Power.Factor";
        Power.Offered: "Power.Offered";
        Power.Reactive.Export: "Power.Reactive.Export";
        Power.Reactive.Import: "Power.Reactive.Import";
        RPM: "RPM";
        SoC: "SoC";
        Temperature: "Temperature";
        Voltage: "Voltage";
     }>>>;
     phase: ZodOptional<ZodNullable<ZodEnum<{
        L1: "L1";
        L1-L2: "L1-L2";
        L1-N: "L1-N";
        L2: "L2";
        L2-L3: "L2-L3";
        L2-N: "L2-N";
        L3: "L3";
        L3-L1: "L3-L1";
        L3-N: "L3-N";
        N: "N";
     }>>>;
     signedMeterValue: ZodOptional<ZodNullable<ZodObject<{
        encodingMethod: ZodString;
        publicKey: ZodString;
        signedMeterData: ZodString;
        signingMethod: ZodString;
     }, $strip>>>;
     unitOfMeasure: ZodOptional<ZodNullable<ZodObject<{
        multiplier: ZodOptional<...>;
        unit: ZodOptional<...>;
     }, $strip>>>;
     value: ZodNumber;
   }, $strip>], ZodObject<{
     context: ZodOptional<ZodNullable<ZodEnum<{
        Interruption.Begin: "Interruption.Begin";
        Interruption.End: "Interruption.End";
        Other: "Other";
        Sample.Clock: "Sample.Clock";
        Sample.Periodic: "Sample.Periodic";
        Transaction.Begin: "Transaction.Begin";
        Transaction.End: "Transaction.End";
        Trigger: "Trigger";
     }>>>;
     location: ZodOptional<ZodNullable<ZodEnum<{
        Body: "Body";
        Cable: "Cable";
        EV: "EV";
        Inlet: "Inlet";
        Outlet: "Outlet";
     }>>>;
     measurand: ZodOptional<ZodNullable<ZodEnum<{
        Current.Export: "Current.Export";
        Current.Import: "Current.Import";
        Current.Offered: "Current.Offered";
        Energy.Active.Export.Interval: "Energy.Active.Export.Interval";
        Energy.Active.Export.Register: "Energy.Active.Export.Register";
        Energy.Active.Import.Interval: "Energy.Active.Import.Interval";
        Energy.Active.Import.Register: "Energy.Active.Import.Register";
        Energy.Active.Net: "Energy.Active.Net";
        Energy.Apparent.Export: "Energy.Apparent.Export";
        Energy.Apparent.Import: "Energy.Apparent.Import";
        Energy.Apparent.Net: "Energy.Apparent.Net";
        Energy.Reactive.Export.Interval: "Energy.Reactive.Export.Interval";
        Energy.Reactive.Export.Register: "Energy.Reactive.Export.Register";
        Energy.Reactive.Import.Interval: "Energy.Reactive.Import.Interval";
        Energy.Reactive.Import.Register: "Energy.Reactive.Import.Register";
        Energy.Reactive.Net: "Energy.Reactive.Net";
        Frequency: "Frequency";
        Power.Active.Export: "Power.Active.Export";
        Power.Active.Import: "Power.Active.Import";
        Power.Factor: "Power.Factor";
        Power.Offered: "Power.Offered";
        Power.Reactive.Export: "Power.Reactive.Export";
        Power.Reactive.Import: "Power.Reactive.Import";
        RPM: "RPM";
        SoC: "SoC";
        Temperature: "Temperature";
        Voltage: "Voltage";
     }>>>;
     phase: ZodOptional<ZodNullable<ZodEnum<{
        L1: "L1";
        L1-L2: "L1-L2";
        L1-N: "L1-N";
        L2: "L2";
        L2-L3: "L2-L3";
        L2-N: "L2-N";
        L3: "L3";
        L3-L1: "L3-L1";
        L3-N: "L3-N";
        N: "N";
     }>>>;
     signedMeterValue: ZodOptional<ZodNullable<ZodObject<{
        encodingMethod: ZodString;
        publicKey: ZodString;
        signedMeterData: ZodString;
        signingMethod: ZodString;
     }, $strip>>>;
     unitOfMeasure: ZodOptional<ZodNullable<ZodObject<{
        multiplier: ZodOptional<ZodNullable<...>>;
        unit: ZodOptional<ZodNullable<...>>;
     }, $strip>>>;
     value: ZodNumber;
  }, $strip>>;
  tariffId: ZodOptional<ZodNullable<ZodNumber>>;
  tenantId: ZodOptional<ZodNumber>;
  timestamp: ZodISODateTime;
  transactionDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
  transactionEventId: ZodOptional<ZodNullable<ZodNumber>>;
  transactionId: ZodOptional<ZodNullable<ZodString>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/meter.value.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/meter.value.dto.ts#L24)

---

### MeterValueProps

```ts
const MeterValueProps: object;
```

Defined in: [00_Base/src/interfaces/dto/meter.value.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/meter.value.dto.ts#L20)

#### Type Declaration

| Name                                                                | Type                      | Defined in |
| ------------------------------------------------------------------- | ------------------------- | ---------- |
| <a id="property-connectorid"></a> `connectorId`                     | `"connectorId"`           |            |
| <a id="property-createdat"></a> `createdAt`                         | `"createdAt"`             |            |
| <a id="property-id"></a> `id`                                       | `"id"`                    |            |
| <a id="property-sampledvalue"></a> `sampledValue`                   | `"sampledValue"`          |            |
| <a id="property-tariffid"></a> `tariffId`                           | `"tariffId"`              |            |
| <a id="property-tenant"></a> `tenant`                               | `"tenant"`                |            |
| <a id="property-tenantid"></a> `tenantId`                           | `"tenantId"`              |            |
| <a id="property-timestamp"></a> `timestamp`                         | `"timestamp"`             |            |
| <a id="property-transactiondatabaseid"></a> `transactionDatabaseId` | `"transactionDatabaseId"` |            |
| <a id="property-transactioneventid"></a> `transactionEventId`       | `"transactionEventId"`    |            |
| <a id="property-transactionid"></a> `transactionId`                 | `"transactionId"`         |            |
| <a id="property-updatedat"></a> `updatedAt`                         | `"updatedAt"`             |            |

---

### MeterValueSchema

```ts
const MeterValueSchema: ZodObject<{
  connectorId: ZodOptional<ZodNumber>;
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  sampledValue: ZodTuple<[ZodObject<{
     context: ZodOptional<ZodNullable<ZodEnum<{
        Interruption.Begin: "Interruption.Begin";
        Interruption.End: "Interruption.End";
        Other: "Other";
        Sample.Clock: "Sample.Clock";
        Sample.Periodic: "Sample.Periodic";
        Transaction.Begin: "Transaction.Begin";
        Transaction.End: "Transaction.End";
        Trigger: "Trigger";
     }>>>;
     location: ZodOptional<ZodNullable<ZodEnum<{
        Body: "Body";
        Cable: "Cable";
        EV: "EV";
        Inlet: "Inlet";
        Outlet: "Outlet";
     }>>>;
     measurand: ZodOptional<ZodNullable<ZodEnum<{
        Current.Export: "Current.Export";
        Current.Import: "Current.Import";
        Current.Offered: "Current.Offered";
        Energy.Active.Export.Interval: "Energy.Active.Export.Interval";
        Energy.Active.Export.Register: "Energy.Active.Export.Register";
        Energy.Active.Import.Interval: "Energy.Active.Import.Interval";
        Energy.Active.Import.Register: "Energy.Active.Import.Register";
        Energy.Active.Net: "Energy.Active.Net";
        Energy.Apparent.Export: "Energy.Apparent.Export";
        Energy.Apparent.Import: "Energy.Apparent.Import";
        Energy.Apparent.Net: "Energy.Apparent.Net";
        Energy.Reactive.Export.Interval: "Energy.Reactive.Export.Interval";
        Energy.Reactive.Export.Register: "Energy.Reactive.Export.Register";
        Energy.Reactive.Import.Interval: "Energy.Reactive.Import.Interval";
        Energy.Reactive.Import.Register: "Energy.Reactive.Import.Register";
        Energy.Reactive.Net: "Energy.Reactive.Net";
        Frequency: "Frequency";
        Power.Active.Export: "Power.Active.Export";
        Power.Active.Import: "Power.Active.Import";
        Power.Factor: "Power.Factor";
        Power.Offered: "Power.Offered";
        Power.Reactive.Export: "Power.Reactive.Export";
        Power.Reactive.Import: "Power.Reactive.Import";
        RPM: "RPM";
        SoC: "SoC";
        Temperature: "Temperature";
        Voltage: "Voltage";
     }>>>;
     phase: ZodOptional<ZodNullable<ZodEnum<{
        L1: "L1";
        L1-L2: "L1-L2";
        L1-N: "L1-N";
        L2: "L2";
        L2-L3: "L2-L3";
        L2-N: "L2-N";
        L3: "L3";
        L3-L1: "L3-L1";
        L3-N: "L3-N";
        N: "N";
     }>>>;
     signedMeterValue: ZodOptional<ZodNullable<ZodObject<{
        encodingMethod: ZodString;
        publicKey: ZodString;
        signedMeterData: ZodString;
        signingMethod: ZodString;
     }, $strip>>>;
     unitOfMeasure: ZodOptional<ZodNullable<ZodObject<{
        multiplier: ZodOptional<...>;
        unit: ZodOptional<...>;
     }, $strip>>>;
     value: ZodNumber;
   }, $strip>], ZodObject<{
     context: ZodOptional<ZodNullable<ZodEnum<{
        Interruption.Begin: "Interruption.Begin";
        Interruption.End: "Interruption.End";
        Other: "Other";
        Sample.Clock: "Sample.Clock";
        Sample.Periodic: "Sample.Periodic";
        Transaction.Begin: "Transaction.Begin";
        Transaction.End: "Transaction.End";
        Trigger: "Trigger";
     }>>>;
     location: ZodOptional<ZodNullable<ZodEnum<{
        Body: "Body";
        Cable: "Cable";
        EV: "EV";
        Inlet: "Inlet";
        Outlet: "Outlet";
     }>>>;
     measurand: ZodOptional<ZodNullable<ZodEnum<{
        Current.Export: "Current.Export";
        Current.Import: "Current.Import";
        Current.Offered: "Current.Offered";
        Energy.Active.Export.Interval: "Energy.Active.Export.Interval";
        Energy.Active.Export.Register: "Energy.Active.Export.Register";
        Energy.Active.Import.Interval: "Energy.Active.Import.Interval";
        Energy.Active.Import.Register: "Energy.Active.Import.Register";
        Energy.Active.Net: "Energy.Active.Net";
        Energy.Apparent.Export: "Energy.Apparent.Export";
        Energy.Apparent.Import: "Energy.Apparent.Import";
        Energy.Apparent.Net: "Energy.Apparent.Net";
        Energy.Reactive.Export.Interval: "Energy.Reactive.Export.Interval";
        Energy.Reactive.Export.Register: "Energy.Reactive.Export.Register";
        Energy.Reactive.Import.Interval: "Energy.Reactive.Import.Interval";
        Energy.Reactive.Import.Register: "Energy.Reactive.Import.Register";
        Energy.Reactive.Net: "Energy.Reactive.Net";
        Frequency: "Frequency";
        Power.Active.Export: "Power.Active.Export";
        Power.Active.Import: "Power.Active.Import";
        Power.Factor: "Power.Factor";
        Power.Offered: "Power.Offered";
        Power.Reactive.Export: "Power.Reactive.Export";
        Power.Reactive.Import: "Power.Reactive.Import";
        RPM: "RPM";
        SoC: "SoC";
        Temperature: "Temperature";
        Voltage: "Voltage";
     }>>>;
     phase: ZodOptional<ZodNullable<ZodEnum<{
        L1: "L1";
        L1-L2: "L1-L2";
        L1-N: "L1-N";
        L2: "L2";
        L2-L3: "L2-L3";
        L2-N: "L2-N";
        L3: "L3";
        L3-L1: "L3-L1";
        L3-N: "L3-N";
        N: "N";
     }>>>;
     signedMeterValue: ZodOptional<ZodNullable<ZodObject<{
        encodingMethod: ZodString;
        publicKey: ZodString;
        signedMeterData: ZodString;
        signingMethod: ZodString;
     }, $strip>>>;
     unitOfMeasure: ZodOptional<ZodNullable<ZodObject<{
        multiplier: ZodOptional<ZodNullable<...>>;
        unit: ZodOptional<ZodNullable<...>>;
     }, $strip>>>;
     value: ZodNumber;
  }, $strip>>;
  tariffId: ZodOptional<ZodNullable<ZodNumber>>;
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
  timestamp: ZodISODateTime;
  transactionDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
  transactionEventId: ZodOptional<ZodNullable<ZodNumber>>;
  transactionId: ZodOptional<ZodNullable<ZodString>>;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/meter.value.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/meter.value.dto.ts#L9)

---

### meterValueSchemas

```ts
const meterValueSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/meter.value.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/meter.value.dto.ts#L33)

#### Type Declaration

| Name                                                      | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Default value            | Defined in                                                                                                                                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-metervalue"></a> `MeterValue`             | `ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNumber`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `sampledValue`: `ZodTuple`\<\[`ZodObject`\<\{ `context`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Interruption.Begin`: ...; `Interruption.End`: ...; `Other`: ...; `Sample.Clock`: ...; `Sample.Periodic`: ...; `Transaction.Begin`: ...; `Transaction.End`: ...; `Trigger`: ...; \}\>\>\>; `location`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Body`: ...; `Cable`: ...; `EV`: ...; `Inlet`: ...; `Outlet`: ...; \}\>\>\>; `measurand`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Current.Export`: ...; `Current.Import`: ...; `Current.Offered`: ...; `Energy.Active.Export.Interval`: ...; `Energy.Active.Export.Register`: ...; `Energy.Active.Import.Interval`: ...; `Energy.Active.Import.Register`: ...; `Energy.Active.Net`: ...; `Energy.Apparent.Export`: ...; `Energy.Apparent.Import`: ...; `Energy.Apparent.Net`: ...; `Energy.Reactive.Export.Interval`: ...; `Energy.Reactive.Export.Register`: ...; `Energy.Reactive.Import.Interval`: ...; `Energy.Reactive.Import.Register`: ...; `Energy.Reactive.Net`: ...; `Frequency`: ...; `Power.Active.Export`: ...; `Power.Active.Import`: ...; `Power.Factor`: ...; `Power.Offered`: ...; `Power.Reactive.Export`: ...; `Power.Reactive.Import`: ...; `RPM`: ...; `SoC`: ...; `Temperature`: ...; `Voltage`: ...; \}\>\>\>; `phase`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `L1`: ...; `L1-L2`: ...; `L1-N`: ...; `L2`: ...; `L2-L3`: ...; `L2-N`: ...; `L3`: ...; `L3-L1`: ...; `L3-N`: ...; `N`: ...; \}\>\>\>; `signedMeterValue`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `encodingMethod`: ...; `publicKey`: ...; `signedMeterData`: ...; `signingMethod`: ...; \}, `$strip`\>\>\>; `unitOfMeasure`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `multiplier`: ...; `unit`: ...; \}, `$strip`\>\>\>; `value`: `ZodNumber`; \}, `$strip`\>\], `ZodObject`\<\{ `context`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Interruption.Begin`: `"Interruption.Begin"`; `Interruption.End`: `"Interruption.End"`; `Other`: `"Other"`; `Sample.Clock`: `"Sample.Clock"`; `Sample.Periodic`: `"Sample.Periodic"`; `Transaction.Begin`: `"Transaction.Begin"`; `Transaction.End`: `"Transaction.End"`; `Trigger`: `"Trigger"`; \}\>\>\>; `location`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Body`: `"Body"`; `Cable`: `"Cable"`; `EV`: `"EV"`; `Inlet`: `"Inlet"`; `Outlet`: `"Outlet"`; \}\>\>\>; `measurand`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Current.Export`: `"Current.Export"`; `Current.Import`: `"Current.Import"`; `Current.Offered`: `"Current.Offered"`; `Energy.Active.Export.Interval`: `"Energy.Active.Export.Interval"`; `Energy.Active.Export.Register`: `"Energy.Active.Export.Register"`; `Energy.Active.Import.Interval`: `"Energy.Active.Import.Interval"`; `Energy.Active.Import.Register`: `"Energy.Active.Import.Register"`; `Energy.Active.Net`: `"Energy.Active.Net"`; `Energy.Apparent.Export`: `"Energy.Apparent.Export"`; `Energy.Apparent.Import`: `"Energy.Apparent.Import"`; `Energy.Apparent.Net`: `"Energy.Apparent.Net"`; `Energy.Reactive.Export.Interval`: `"Energy.Reactive.Export.Interval"`; `Energy.Reactive.Export.Register`: `"Energy.Reactive.Export.Register"`; `Energy.Reactive.Import.Interval`: `"Energy.Reactive.Import.Interval"`; `Energy.Reactive.Import.Register`: `"Energy.Reactive.Import.Register"`; `Energy.Reactive.Net`: `"Energy.Reactive.Net"`; `Frequency`: `"Frequency"`; `Power.Active.Export`: `"Power.Active.Export"`; `Power.Active.Import`: `"Power.Active.Import"`; `Power.Factor`: `"Power.Factor"`; `Power.Offered`: `"Power.Offered"`; `Power.Reactive.Export`: `"Power.Reactive.Export"`; `Power.Reactive.Import`: `"Power.Reactive.Import"`; `RPM`: `"RPM"`; `SoC`: `"SoC"`; `Temperature`: `"Temperature"`; `Voltage`: `"Voltage"`; \}\>\>\>; `phase`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `L1`: `"L1"`; `L1-L2`: `"L1-L2"`; `L1-N`: `"L1-N"`; `L2`: `"L2"`; `L2-L3`: `"L2-L3"`; `L2-N`: `"L2-N"`; `L3`: `"L3"`; `L3-L1`: `"L3-L1"`; `L3-N`: `"L3-N"`; `N`: `"N"`; \}\>\>\>; `signedMeterValue`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `encodingMethod`: `ZodString`; `publicKey`: `ZodString`; `signedMeterData`: `ZodString`; `signingMethod`: `ZodString`; \}, `$strip`\>\>\>; `unitOfMeasure`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `multiplier`: `ZodOptional`\<...\>; `unit`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>; `value`: `ZodNumber`; \}, `$strip`\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionEventId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `MeterValueSchema`       | [00_Base/src/interfaces/dto/meter.value.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/meter.value.dto.ts#L34) |
| <a id="property-metervaluecreate"></a> `MeterValueCreate` | `ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNumber`\>; `sampledValue`: `ZodTuple`\<\[`ZodObject`\<\{ `context`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Interruption.Begin`: ...; `Interruption.End`: ...; `Other`: ...; `Sample.Clock`: ...; `Sample.Periodic`: ...; `Transaction.Begin`: ...; `Transaction.End`: ...; `Trigger`: ...; \}\>\>\>; `location`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Body`: ...; `Cable`: ...; `EV`: ...; `Inlet`: ...; `Outlet`: ...; \}\>\>\>; `measurand`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Current.Export`: ...; `Current.Import`: ...; `Current.Offered`: ...; `Energy.Active.Export.Interval`: ...; `Energy.Active.Export.Register`: ...; `Energy.Active.Import.Interval`: ...; `Energy.Active.Import.Register`: ...; `Energy.Active.Net`: ...; `Energy.Apparent.Export`: ...; `Energy.Apparent.Import`: ...; `Energy.Apparent.Net`: ...; `Energy.Reactive.Export.Interval`: ...; `Energy.Reactive.Export.Register`: ...; `Energy.Reactive.Import.Interval`: ...; `Energy.Reactive.Import.Register`: ...; `Energy.Reactive.Net`: ...; `Frequency`: ...; `Power.Active.Export`: ...; `Power.Active.Import`: ...; `Power.Factor`: ...; `Power.Offered`: ...; `Power.Reactive.Export`: ...; `Power.Reactive.Import`: ...; `RPM`: ...; `SoC`: ...; `Temperature`: ...; `Voltage`: ...; \}\>\>\>; `phase`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `L1`: ...; `L1-L2`: ...; `L1-N`: ...; `L2`: ...; `L2-L3`: ...; `L2-N`: ...; `L3`: ...; `L3-L1`: ...; `L3-N`: ...; `N`: ...; \}\>\>\>; `signedMeterValue`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `encodingMethod`: ...; `publicKey`: ...; `signedMeterData`: ...; `signingMethod`: ...; \}, `$strip`\>\>\>; `unitOfMeasure`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `multiplier`: ...; `unit`: ...; \}, `$strip`\>\>\>; `value`: `ZodNumber`; \}, `$strip`\>\], `ZodObject`\<\{ `context`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Interruption.Begin`: `"Interruption.Begin"`; `Interruption.End`: `"Interruption.End"`; `Other`: `"Other"`; `Sample.Clock`: `"Sample.Clock"`; `Sample.Periodic`: `"Sample.Periodic"`; `Transaction.Begin`: `"Transaction.Begin"`; `Transaction.End`: `"Transaction.End"`; `Trigger`: `"Trigger"`; \}\>\>\>; `location`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Body`: `"Body"`; `Cable`: `"Cable"`; `EV`: `"EV"`; `Inlet`: `"Inlet"`; `Outlet`: `"Outlet"`; \}\>\>\>; `measurand`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Current.Export`: `"Current.Export"`; `Current.Import`: `"Current.Import"`; `Current.Offered`: `"Current.Offered"`; `Energy.Active.Export.Interval`: `"Energy.Active.Export.Interval"`; `Energy.Active.Export.Register`: `"Energy.Active.Export.Register"`; `Energy.Active.Import.Interval`: `"Energy.Active.Import.Interval"`; `Energy.Active.Import.Register`: `"Energy.Active.Import.Register"`; `Energy.Active.Net`: `"Energy.Active.Net"`; `Energy.Apparent.Export`: `"Energy.Apparent.Export"`; `Energy.Apparent.Import`: `"Energy.Apparent.Import"`; `Energy.Apparent.Net`: `"Energy.Apparent.Net"`; `Energy.Reactive.Export.Interval`: `"Energy.Reactive.Export.Interval"`; `Energy.Reactive.Export.Register`: `"Energy.Reactive.Export.Register"`; `Energy.Reactive.Import.Interval`: `"Energy.Reactive.Import.Interval"`; `Energy.Reactive.Import.Register`: `"Energy.Reactive.Import.Register"`; `Energy.Reactive.Net`: `"Energy.Reactive.Net"`; `Frequency`: `"Frequency"`; `Power.Active.Export`: `"Power.Active.Export"`; `Power.Active.Import`: `"Power.Active.Import"`; `Power.Factor`: `"Power.Factor"`; `Power.Offered`: `"Power.Offered"`; `Power.Reactive.Export`: `"Power.Reactive.Export"`; `Power.Reactive.Import`: `"Power.Reactive.Import"`; `RPM`: `"RPM"`; `SoC`: `"SoC"`; `Temperature`: `"Temperature"`; `Voltage`: `"Voltage"`; \}\>\>\>; `phase`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `L1`: `"L1"`; `L1-L2`: `"L1-L2"`; `L1-N`: `"L1-N"`; `L2`: `"L2"`; `L2-L3`: `"L2-L3"`; `L2-N`: `"L2-N"`; `L3`: `"L3"`; `L3-L1`: `"L3-L1"`; `L3-N`: `"L3-N"`; `N`: `"N"`; \}\>\>\>; `signedMeterValue`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `encodingMethod`: `ZodString`; `publicKey`: `ZodString`; `signedMeterData`: `ZodString`; `signingMethod`: `ZodString`; \}, `$strip`\>\>\>; `unitOfMeasure`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `multiplier`: `ZodOptional`\<...\>; `unit`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>; `value`: `ZodNumber`; \}, `$strip`\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionEventId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `MeterValueCreateSchema` | [00_Base/src/interfaces/dto/meter.value.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/meter.value.dto.ts#L35) |
