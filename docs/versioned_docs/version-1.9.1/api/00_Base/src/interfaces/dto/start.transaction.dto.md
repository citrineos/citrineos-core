[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/start.transaction.dto

# 00_Base/src/interfaces/dto/start.transaction.dto

## Type Aliases

### StartTransactionCreate

```ts
type StartTransactionCreate = z.infer<typeof StartTransactionCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/start.transaction.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/start.transaction.dto.ts#L32)

---

### StartTransactionDto

```ts
type StartTransactionDto = z.infer<typeof StartTransactionSchema>;
```

Defined in: [00_Base/src/interfaces/dto/start.transaction.dto.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/start.transaction.dto.ts#L22)

## Variables

### StartTransactionCreateSchema

```ts
const StartTransactionCreateSchema: ZodObject<
  {
    connectorDatabaseId: ZodNumber;
    meterStart: ZodNumber;
    reservationId: ZodOptional<ZodNullable<ZodNumber>>;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    timestamp: ZodISODateTime;
    transactionDatabaseId: ZodNumber;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/start.transaction.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/start.transaction.dto.ts#L24)

---

### StartTransactionProps

```ts
const StartTransactionProps: object;
```

Defined in: [00_Base/src/interfaces/dto/start.transaction.dto.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/start.transaction.dto.ts#L20)

#### Type Declaration

| Name                                                                | Type                      | Defined in |
| ------------------------------------------------------------------- | ------------------------- | ---------- |
| <a id="property-connector"></a> `connector`                         | `"connector"`             |            |
| <a id="property-connectordatabaseid"></a> `connectorDatabaseId`     | `"connectorDatabaseId"`   |            |
| <a id="property-createdat"></a> `createdAt`                         | `"createdAt"`             |            |
| <a id="property-id"></a> `id`                                       | `"id"`                    |            |
| <a id="property-meterstart"></a> `meterStart`                       | `"meterStart"`            |            |
| <a id="property-reservationid"></a> `reservationId`                 | `"reservationId"`         |            |
| <a id="property-stationid"></a> `stationId`                         | `"stationId"`             |            |
| <a id="property-tenant"></a> `tenant`                               | `"tenant"`                |            |
| <a id="property-tenantid"></a> `tenantId`                           | `"tenantId"`              |            |
| <a id="property-timestamp"></a> `timestamp`                         | `"timestamp"`             |            |
| <a id="property-transactiondatabaseid"></a> `transactionDatabaseId` | `"transactionDatabaseId"` |            |
| <a id="property-updatedat"></a> `updatedAt`                         | `"updatedAt"`             |            |

---

### StartTransactionSchema

```ts
const StartTransactionSchema: ZodObject<{
  connector: ZodOptional<ZodObject<{
     chargingStation: ZodOptional<ZodAny>;
     connectorId: ZodNumber;
     createdAt: ZodOptional<ZodDate>;
     errorCode: ZodOptional<ZodNullable<ZodDefault<ZodEnum<{
        ConnectorLockFailure: "ConnectorLockFailure";
        EVCommunicationError: "EVCommunicationError";
        GroundFailure: "GroundFailure";
        HighTemperature: "HighTemperature";
        InternalError: "InternalError";
        LocalListConflict: "LocalListConflict";
        NoError: "NoError";
        OtherError: "OtherError";
        OverCurrentFailure: "OverCurrentFailure";
        OverVoltage: "OverVoltage";
        PowerMeterFailure: "PowerMeterFailure";
        PowerSwitchFailure: "PowerSwitchFailure";
        ReaderFailure: "ReaderFailure";
        ResetFailure: "ResetFailure";
        UnderVoltage: "UnderVoltage";
        WeakSignal: "WeakSignal";
     }>>>>;
     evse: ZodOptional<ZodAny>;
     evseId: ZodNumber;
     evseTypeConnectorId: ZodOptional<ZodNumber>;
     format: ZodOptional<ZodNullable<ZodEnum<{
        Cable: "Cable";
        Socket: "Socket";
     }>>>;
     id: ZodOptional<ZodNumber>;
     info: ZodOptional<ZodNullable<ZodString>>;
     maximumAmperage: ZodOptional<ZodNullable<ZodNumber>>;
     maximumPowerWatts: ZodOptional<ZodNullable<ZodNumber>>;
     maximumVoltage: ZodOptional<ZodNullable<ZodNumber>>;
     powerType: ZodOptional<ZodNullable<ZodEnum<{
        AC1Phase: "AC1Phase";
        AC2Phase: "AC2Phase";
        AC2PhaseSplit: "AC2PhaseSplit";
        AC3Phase: "AC3Phase";
        DC: "DC";
     }>>>;
     stationId: ZodString;
     status: ZodOptional<ZodNullable<ZodDefault<ZodEnum<{
        Available: "Available";
        Charging: "Charging";
        Faulted: "Faulted";
        Finishing: "Finishing";
        Occupied: "Occupied";
        Preparing: "Preparing";
        Reserved: "Reserved";
        SuspendedEV: "SuspendedEV";
        SuspendedEVSE: "SuspendedEVSE";
        Unavailable: "Unavailable";
        Unknown: "Unknown";
     }>>>>;
     tariff: ZodOptional<ZodNullable<ZodObject<{
        authorizationAmount: ZodOptional<ZodNullable<...>>;
        createdAt: ZodOptional<ZodDate>;
        currency: ZodString;
        id: ZodOptional<ZodNumber>;
        paymentFee: ZodOptional<ZodNullable<...>>;
        pricePerKwh: ZodNumber;
        pricePerMin: ZodOptional<ZodNullable<...>>;
        pricePerSession: ZodOptional<ZodNullable<...>>;
        tariffAltText: ZodOptional<ZodNullable<...>>;
        taxRate: ZodOptional<ZodNullable<...>>;
        tenant: ZodOptional<ZodObject<..., ...>>;
        tenantId: ZodOptional<ZodNumber>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>>;
     tariffId: ZodOptional<ZodNullable<ZodNumber>>;
     tenant: ZodOptional<ZodAny>;
     tenantId: ZodOptional<ZodNumber>;
     termsAndConditionsUrl: ZodOptional<ZodNullable<ZodString>>;
     timestamp: ZodISODateTime;
     type: ZodOptional<ZodNullable<ZodEnum<{
        CHAdeMO: "CHAdeMO";
        ChaoJi: "ChaoJi";
        DomesticA: "DomesticA";
        DomesticB: "DomesticB";
        DomesticC: "DomesticC";
        DomesticD: "DomesticD";
        DomesticE: "DomesticE";
        DomesticF: "DomesticF";
        DomesticG: "DomesticG";
        DomesticH: "DomesticH";
        DomesticI: "DomesticI";
        DomesticJ: "DomesticJ";
        DomesticK: "DomesticK";
        DomesticL: "DomesticL";
        DomesticM: "DomesticM";
        DomesticN: "DomesticN";
        DomesticO: "DomesticO";
        GBTAC: "GBTAC";
        GBTDC: "GBTDC";
        IEC603092Single16: "IEC603092Single16";
        IEC603092Three16: "IEC603092Three16";
        IEC603092Three32: "IEC603092Three32";
        IEC603092Three64: "IEC603092Three64";
        IEC62196T1: "IEC62196T1";
        IEC62196T1COMBO: "IEC62196T1COMBO";
        IEC62196T2: "IEC62196T2";
        IEC62196T2COMBO: "IEC62196T2COMBO";
        IEC62196T3A: "IEC62196T3A";
        IEC62196T3C: "IEC62196T3C";
        NEMA1030: "NEMA1030";
        NEMA1050: "NEMA1050";
        NEMA1430: "NEMA1430";
        NEMA1450: "NEMA1450";
        NEMA520: "NEMA520";
        NEMA630: "NEMA630";
        NEMA650: "NEMA650";
        PantographBottomUp: "PantographBottomUp";
        PantographTopDown: "PantographTopDown";
        TeslaR: "TeslaR";
        TeslaS: "TeslaS";
     }>>>;
     updatedAt: ZodOptional<ZodDate>;
     vendorErrorCode: ZodOptional<ZodNullable<ZodString>>;
     vendorId: ZodOptional<ZodNullable<ZodString>>;
  }, $strip>>;
  connectorDatabaseId: ZodNumber;
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  meterStart: ZodNumber;
  reservationId: ZodOptional<ZodNullable<ZodNumber>>;
  stationId: ZodString;
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
  transactionDatabaseId: ZodNumber;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/start.transaction.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/start.transaction.dto.ts#L9)

---

### startTransactionSchemas

```ts
const startTransactionSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/start.transaction.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/start.transaction.dto.ts#L34)

#### Type Declaration

| Name                                                                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Default value                  | Defined in                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-starttransaction"></a> `StartTransaction`             | `ZodObject`\<\{ `connector`: `ZodOptional`\<`ZodObject`\<\{ `chargingStation`: `ZodOptional`\<`ZodAny`\>; `connectorId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `errorCode`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<\{ `ConnectorLockFailure`: ...; `EVCommunicationError`: ...; `GroundFailure`: ...; `HighTemperature`: ...; `InternalError`: ...; `LocalListConflict`: ...; `NoError`: ...; `OtherError`: ...; `OverCurrentFailure`: ...; `OverVoltage`: ...; `PowerMeterFailure`: ...; `PowerSwitchFailure`: ...; `ReaderFailure`: ...; `ResetFailure`: ...; `UnderVoltage`: ...; `WeakSignal`: ...; \}\>\>\>\>; `evse`: `ZodOptional`\<`ZodAny`\>; `evseId`: `ZodNumber`; `evseTypeConnectorId`: `ZodOptional`\<`ZodNumber`\>; `format`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Cable`: `"Cable"`; `Socket`: `"Socket"`; \}\>\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `info`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `maximumAmperage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumPowerWatts`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumVoltage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `powerType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `AC1Phase`: `"AC1Phase"`; `AC2Phase`: `"AC2Phase"`; `AC2PhaseSplit`: `"AC2PhaseSplit"`; `AC3Phase`: `"AC3Phase"`; `DC`: `"DC"`; \}\>\>\>; `stationId`: `ZodString`; `status`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<\{ `Available`: ...; `Charging`: ...; `Faulted`: ...; `Finishing`: ...; `Occupied`: ...; `Preparing`: ...; `Reserved`: ...; `SuspendedEV`: ...; `SuspendedEVSE`: ...; `Unavailable`: ...; `Unknown`: ...; \}\>\>\>\>; `tariff`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `authorizationAmount`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `currency`: `ZodString`; `id`: `ZodOptional`\<...\>; `paymentFee`: `ZodOptional`\<...\>; `pricePerKwh`: `ZodNumber`; `pricePerMin`: `ZodOptional`\<...\>; `pricePerSession`: `ZodOptional`\<...\>; `tariffAltText`: `ZodOptional`\<...\>; `taxRate`: `ZodOptional`\<...\>; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodAny`\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `termsAndConditionsUrl`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `timestamp`: `ZodISODateTime`; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `CHAdeMO`: `"CHAdeMO"`; `ChaoJi`: `"ChaoJi"`; `DomesticA`: `"DomesticA"`; `DomesticB`: `"DomesticB"`; `DomesticC`: `"DomesticC"`; `DomesticD`: `"DomesticD"`; `DomesticE`: `"DomesticE"`; `DomesticF`: `"DomesticF"`; `DomesticG`: `"DomesticG"`; `DomesticH`: `"DomesticH"`; `DomesticI`: `"DomesticI"`; `DomesticJ`: `"DomesticJ"`; `DomesticK`: `"DomesticK"`; `DomesticL`: `"DomesticL"`; `DomesticM`: `"DomesticM"`; `DomesticN`: `"DomesticN"`; `DomesticO`: `"DomesticO"`; `GBTAC`: `"GBTAC"`; `GBTDC`: `"GBTDC"`; `IEC603092Single16`: `"IEC603092Single16"`; `IEC603092Three16`: `"IEC603092Three16"`; `IEC603092Three32`: `"IEC603092Three32"`; `IEC603092Three64`: `"IEC603092Three64"`; `IEC62196T1`: `"IEC62196T1"`; `IEC62196T1COMBO`: `"IEC62196T1COMBO"`; `IEC62196T2`: `"IEC62196T2"`; `IEC62196T2COMBO`: `"IEC62196T2COMBO"`; `IEC62196T3A`: `"IEC62196T3A"`; `IEC62196T3C`: `"IEC62196T3C"`; `NEMA1030`: `"NEMA1030"`; `NEMA1050`: `"NEMA1050"`; `NEMA1430`: `"NEMA1430"`; `NEMA1450`: `"NEMA1450"`; `NEMA520`: `"NEMA520"`; `NEMA630`: `"NEMA630"`; `NEMA650`: `"NEMA650"`; `PantographBottomUp`: `"PantographBottomUp"`; `PantographTopDown`: `"PantographTopDown"`; `TeslaR`: `"TeslaR"`; `TeslaS`: `"TeslaS"`; \}\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `vendorErrorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `vendorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `connectorDatabaseId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `meterStart`: `ZodNumber`; `reservationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodNumber`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `StartTransactionSchema`       | [00_Base/src/interfaces/dto/start.transaction.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/start.transaction.dto.ts#L35) |
| <a id="property-starttransactioncreate"></a> `StartTransactionCreate` | `ZodObject`\<\{ `connectorDatabaseId`: `ZodNumber`; `meterStart`: `ZodNumber`; `reservationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodNumber`; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `StartTransactionCreateSchema` | [00_Base/src/interfaces/dto/start.transaction.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/start.transaction.dto.ts#L36) |
