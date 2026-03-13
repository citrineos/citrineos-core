[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/connector.dto

# 00_Base/src/interfaces/dto/connector.dto

## Type Aliases

### ConnectorCreate

```ts
type ConnectorCreate = z.infer<typeof ConnectorCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/connector.dto.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/connector.dto.ts#L59)

---

### ConnectorDto

```ts
type ConnectorDto = z.infer<typeof ConnectorSchema>;
```

Defined in: [00_Base/src/interfaces/dto/connector.dto.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/connector.dto.ts#L47)

## Variables

### ConnectorCreateSchema

```ts
const ConnectorCreateSchema: ZodObject<
  {
    connectorId: ZodNumber;
    errorCode: ZodOptional<
      ZodNullable<
        ZodDefault<
          ZodEnum<{
            ConnectorLockFailure: 'ConnectorLockFailure';
            EVCommunicationError: 'EVCommunicationError';
            GroundFailure: 'GroundFailure';
            HighTemperature: 'HighTemperature';
            InternalError: 'InternalError';
            LocalListConflict: 'LocalListConflict';
            NoError: 'NoError';
            OtherError: 'OtherError';
            OverCurrentFailure: 'OverCurrentFailure';
            OverVoltage: 'OverVoltage';
            PowerMeterFailure: 'PowerMeterFailure';
            PowerSwitchFailure: 'PowerSwitchFailure';
            ReaderFailure: 'ReaderFailure';
            ResetFailure: 'ResetFailure';
            UnderVoltage: 'UnderVoltage';
            WeakSignal: 'WeakSignal';
          }>
        >
      >
    >;
    evseId: ZodNumber;
    evseTypeConnectorId: ZodOptional<ZodNumber>;
    format: ZodOptional<
      ZodNullable<
        ZodEnum<{
          Cable: 'Cable';
          Socket: 'Socket';
        }>
      >
    >;
    info: ZodOptional<ZodNullable<ZodString>>;
    maximumAmperage: ZodOptional<ZodNullable<ZodNumber>>;
    maximumPowerWatts: ZodOptional<ZodNullable<ZodNumber>>;
    maximumVoltage: ZodOptional<ZodNullable<ZodNumber>>;
    powerType: ZodOptional<
      ZodNullable<
        ZodEnum<{
          AC1Phase: 'AC1Phase';
          AC2Phase: 'AC2Phase';
          AC2PhaseSplit: 'AC2PhaseSplit';
          AC3Phase: 'AC3Phase';
          DC: 'DC';
        }>
      >
    >;
    stationId: ZodString;
    status: ZodOptional<
      ZodNullable<
        ZodDefault<
          ZodEnum<{
            Available: 'Available';
            Charging: 'Charging';
            Faulted: 'Faulted';
            Finishing: 'Finishing';
            Occupied: 'Occupied';
            Preparing: 'Preparing';
            Reserved: 'Reserved';
            SuspendedEV: 'SuspendedEV';
            SuspendedEVSE: 'SuspendedEVSE';
            Unavailable: 'Unavailable';
            Unknown: 'Unknown';
          }>
        >
      >
    >;
    tariffId: ZodOptional<ZodNullable<ZodNumber>>;
    tenantId: ZodOptional<ZodNumber>;
    termsAndConditionsUrl: ZodOptional<ZodNullable<ZodString>>;
    timestamp: ZodISODateTime;
    type: ZodOptional<
      ZodNullable<
        ZodEnum<{
          CHAdeMO: 'CHAdeMO';
          ChaoJi: 'ChaoJi';
          DomesticA: 'DomesticA';
          DomesticB: 'DomesticB';
          DomesticC: 'DomesticC';
          DomesticD: 'DomesticD';
          DomesticE: 'DomesticE';
          DomesticF: 'DomesticF';
          DomesticG: 'DomesticG';
          DomesticH: 'DomesticH';
          DomesticI: 'DomesticI';
          DomesticJ: 'DomesticJ';
          DomesticK: 'DomesticK';
          DomesticL: 'DomesticL';
          DomesticM: 'DomesticM';
          DomesticN: 'DomesticN';
          DomesticO: 'DomesticO';
          GBTAC: 'GBTAC';
          GBTDC: 'GBTDC';
          IEC603092Single16: 'IEC603092Single16';
          IEC603092Three16: 'IEC603092Three16';
          IEC603092Three32: 'IEC603092Three32';
          IEC603092Three64: 'IEC603092Three64';
          IEC62196T1: 'IEC62196T1';
          IEC62196T1COMBO: 'IEC62196T1COMBO';
          IEC62196T2: 'IEC62196T2';
          IEC62196T2COMBO: 'IEC62196T2COMBO';
          IEC62196T3A: 'IEC62196T3A';
          IEC62196T3C: 'IEC62196T3C';
          NEMA1030: 'NEMA1030';
          NEMA1050: 'NEMA1050';
          NEMA1430: 'NEMA1430';
          NEMA1450: 'NEMA1450';
          NEMA520: 'NEMA520';
          NEMA630: 'NEMA630';
          NEMA650: 'NEMA650';
          PantographBottomUp: 'PantographBottomUp';
          PantographTopDown: 'PantographTopDown';
          TeslaR: 'TeslaR';
          TeslaS: 'TeslaS';
        }>
      >
    >;
    vendorErrorCode: ZodOptional<ZodNullable<ZodString>>;
    vendorId: ZodOptional<ZodNullable<ZodString>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/connector.dto.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/connector.dto.ts#L49)

---

### ConnectorProps

```ts
const ConnectorProps: object;
```

Defined in: [00_Base/src/interfaces/dto/connector.dto.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/connector.dto.ts#L45)

#### Type Declaration

| Name                                                                | Type                      | Defined in |
| ------------------------------------------------------------------- | ------------------------- | ---------- |
| <a id="property-chargingstation"></a> `chargingStation`             | `"chargingStation"`       |            |
| <a id="property-connectorid"></a> `connectorId`                     | `"connectorId"`           |            |
| <a id="property-createdat"></a> `createdAt`                         | `"createdAt"`             |            |
| <a id="property-errorcode"></a> `errorCode`                         | `"errorCode"`             |            |
| <a id="property-evse"></a> `evse`                                   | `"evse"`                  |            |
| <a id="property-evseid"></a> `evseId`                               | `"evseId"`                |            |
| <a id="property-evsetypeconnectorid"></a> `evseTypeConnectorId`     | `"evseTypeConnectorId"`   |            |
| <a id="property-format"></a> `format`                               | `"format"`                |            |
| <a id="property-id"></a> `id`                                       | `"id"`                    |            |
| <a id="property-info"></a> `info`                                   | `"info"`                  |            |
| <a id="property-maximumamperage"></a> `maximumAmperage`             | `"maximumAmperage"`       |            |
| <a id="property-maximumpowerwatts"></a> `maximumPowerWatts`         | `"maximumPowerWatts"`     |            |
| <a id="property-maximumvoltage"></a> `maximumVoltage`               | `"maximumVoltage"`        |            |
| <a id="property-powertype"></a> `powerType`                         | `"powerType"`             |            |
| <a id="property-stationid"></a> `stationId`                         | `"stationId"`             |            |
| <a id="property-status"></a> `status`                               | `"status"`                |            |
| <a id="property-tariff"></a> `tariff`                               | `"tariff"`                |            |
| <a id="property-tariffid"></a> `tariffId`                           | `"tariffId"`              |            |
| <a id="property-tenant"></a> `tenant`                               | `"tenant"`                |            |
| <a id="property-tenantid"></a> `tenantId`                           | `"tenantId"`              |            |
| <a id="property-termsandconditionsurl"></a> `termsAndConditionsUrl` | `"termsAndConditionsUrl"` |            |
| <a id="property-timestamp"></a> `timestamp`                         | `"timestamp"`             |            |
| <a id="property-type"></a> `type`                                   | `"type"`                  |            |
| <a id="property-updatedat"></a> `updatedAt`                         | `"updatedAt"`             |            |
| <a id="property-vendorerrorcode"></a> `vendorErrorCode`             | `"vendorErrorCode"`       |            |
| <a id="property-vendorid"></a> `vendorId`                           | `"vendorId"`              |            |

---

### ConnectorSchema

```ts
const ConnectorSchema: ZodObject<{
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
     authorizationAmount: ZodOptional<ZodNullable<ZodNumber>>;
     createdAt: ZodOptional<ZodDate>;
     currency: ZodString;
     id: ZodOptional<ZodNumber>;
     paymentFee: ZodOptional<ZodNullable<ZodNumber>>;
     pricePerKwh: ZodNumber;
     pricePerMin: ZodOptional<ZodNullable<ZodNumber>>;
     pricePerSession: ZodOptional<ZodNullable<ZodNumber>>;
     tariffAltText: ZodOptional<ZodNullable<ZodRecord<ZodString, ZodAny>>>;
     taxRate: ZodOptional<ZodNullable<ZodNumber>>;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<...>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<...>>;
        serverProfileOCPI: ZodOptional<ZodNullable<...>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<...>>;
     }, $strip>>;
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
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/connector.dto.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/connector.dto.ts#L39)

---

### connectorSchemas

```ts
const connectorSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/connector.dto.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/connector.dto.ts#L61)

#### Type Declaration

| Name                                                    | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Default value           | Defined in                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-connector"></a> `Connector`             | `ZodObject`\<\{ `chargingStation`: `ZodOptional`\<`ZodAny`\>; `connectorId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `errorCode`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<\{ `ConnectorLockFailure`: `"ConnectorLockFailure"`; `EVCommunicationError`: `"EVCommunicationError"`; `GroundFailure`: `"GroundFailure"`; `HighTemperature`: `"HighTemperature"`; `InternalError`: `"InternalError"`; `LocalListConflict`: `"LocalListConflict"`; `NoError`: `"NoError"`; `OtherError`: `"OtherError"`; `OverCurrentFailure`: `"OverCurrentFailure"`; `OverVoltage`: `"OverVoltage"`; `PowerMeterFailure`: `"PowerMeterFailure"`; `PowerSwitchFailure`: `"PowerSwitchFailure"`; `ReaderFailure`: `"ReaderFailure"`; `ResetFailure`: `"ResetFailure"`; `UnderVoltage`: `"UnderVoltage"`; `WeakSignal`: `"WeakSignal"`; \}\>\>\>\>; `evse`: `ZodOptional`\<`ZodAny`\>; `evseId`: `ZodNumber`; `evseTypeConnectorId`: `ZodOptional`\<`ZodNumber`\>; `format`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Cable`: `"Cable"`; `Socket`: `"Socket"`; \}\>\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `info`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `maximumAmperage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumPowerWatts`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumVoltage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `powerType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `AC1Phase`: `"AC1Phase"`; `AC2Phase`: `"AC2Phase"`; `AC2PhaseSplit`: `"AC2PhaseSplit"`; `AC3Phase`: `"AC3Phase"`; `DC`: `"DC"`; \}\>\>\>; `stationId`: `ZodString`; `status`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<\{ `Available`: `"Available"`; `Charging`: `"Charging"`; `Faulted`: `"Faulted"`; `Finishing`: `"Finishing"`; `Occupied`: `"Occupied"`; `Preparing`: `"Preparing"`; `Reserved`: `"Reserved"`; `SuspendedEV`: `"SuspendedEV"`; `SuspendedEVSE`: `"SuspendedEVSE"`; `Unavailable`: `"Unavailable"`; `Unknown`: `"Unknown"`; \}\>\>\>\>; `tariff`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `authorizationAmount`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `currency`: `ZodString`; `id`: `ZodOptional`\<`ZodNumber`\>; `paymentFee`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `pricePerKwh`: `ZodNumber`; `pricePerMin`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `pricePerSession`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tariffAltText`: `ZodOptional`\<`ZodNullable`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>; `taxRate`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodAny`\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `termsAndConditionsUrl`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `timestamp`: `ZodISODateTime`; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `CHAdeMO`: `"CHAdeMO"`; `ChaoJi`: `"ChaoJi"`; `DomesticA`: `"DomesticA"`; `DomesticB`: `"DomesticB"`; `DomesticC`: `"DomesticC"`; `DomesticD`: `"DomesticD"`; `DomesticE`: `"DomesticE"`; `DomesticF`: `"DomesticF"`; `DomesticG`: `"DomesticG"`; `DomesticH`: `"DomesticH"`; `DomesticI`: `"DomesticI"`; `DomesticJ`: `"DomesticJ"`; `DomesticK`: `"DomesticK"`; `DomesticL`: `"DomesticL"`; `DomesticM`: `"DomesticM"`; `DomesticN`: `"DomesticN"`; `DomesticO`: `"DomesticO"`; `GBTAC`: `"GBTAC"`; `GBTDC`: `"GBTDC"`; `IEC603092Single16`: `"IEC603092Single16"`; `IEC603092Three16`: `"IEC603092Three16"`; `IEC603092Three32`: `"IEC603092Three32"`; `IEC603092Three64`: `"IEC603092Three64"`; `IEC62196T1`: `"IEC62196T1"`; `IEC62196T1COMBO`: `"IEC62196T1COMBO"`; `IEC62196T2`: `"IEC62196T2"`; `IEC62196T2COMBO`: `"IEC62196T2COMBO"`; `IEC62196T3A`: `"IEC62196T3A"`; `IEC62196T3C`: `"IEC62196T3C"`; `NEMA1030`: `"NEMA1030"`; `NEMA1050`: `"NEMA1050"`; `NEMA1430`: `"NEMA1430"`; `NEMA1450`: `"NEMA1450"`; `NEMA520`: `"NEMA520"`; `NEMA630`: `"NEMA630"`; `NEMA650`: `"NEMA650"`; `PantographBottomUp`: `"PantographBottomUp"`; `PantographTopDown`: `"PantographTopDown"`; `TeslaR`: `"TeslaR"`; `TeslaS`: `"TeslaS"`; \}\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `vendorErrorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `vendorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\> | `ConnectorSchema`       | [00_Base/src/interfaces/dto/connector.dto.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/connector.dto.ts#L62) |
| <a id="property-connectorcreate"></a> `ConnectorCreate` | `ZodObject`\<\{ `connectorId`: `ZodNumber`; `errorCode`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<\{ `ConnectorLockFailure`: `"ConnectorLockFailure"`; `EVCommunicationError`: `"EVCommunicationError"`; `GroundFailure`: `"GroundFailure"`; `HighTemperature`: `"HighTemperature"`; `InternalError`: `"InternalError"`; `LocalListConflict`: `"LocalListConflict"`; `NoError`: `"NoError"`; `OtherError`: `"OtherError"`; `OverCurrentFailure`: `"OverCurrentFailure"`; `OverVoltage`: `"OverVoltage"`; `PowerMeterFailure`: `"PowerMeterFailure"`; `PowerSwitchFailure`: `"PowerSwitchFailure"`; `ReaderFailure`: `"ReaderFailure"`; `ResetFailure`: `"ResetFailure"`; `UnderVoltage`: `"UnderVoltage"`; `WeakSignal`: `"WeakSignal"`; \}\>\>\>\>; `evseId`: `ZodNumber`; `evseTypeConnectorId`: `ZodOptional`\<`ZodNumber`\>; `format`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Cable`: `"Cable"`; `Socket`: `"Socket"`; \}\>\>\>; `info`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `maximumAmperage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumPowerWatts`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumVoltage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `powerType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `AC1Phase`: `"AC1Phase"`; `AC2Phase`: `"AC2Phase"`; `AC2PhaseSplit`: `"AC2PhaseSplit"`; `AC3Phase`: `"AC3Phase"`; `DC`: `"DC"`; \}\>\>\>; `stationId`: `ZodString`; `status`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<\{ `Available`: `"Available"`; `Charging`: `"Charging"`; `Faulted`: `"Faulted"`; `Finishing`: `"Finishing"`; `Occupied`: `"Occupied"`; `Preparing`: `"Preparing"`; `Reserved`: `"Reserved"`; `SuspendedEV`: `"SuspendedEV"`; `SuspendedEVSE`: `"SuspendedEVSE"`; `Unavailable`: `"Unavailable"`; `Unknown`: `"Unknown"`; \}\>\>\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `termsAndConditionsUrl`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `timestamp`: `ZodISODateTime`; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `CHAdeMO`: `"CHAdeMO"`; `ChaoJi`: `"ChaoJi"`; `DomesticA`: `"DomesticA"`; `DomesticB`: `"DomesticB"`; `DomesticC`: `"DomesticC"`; `DomesticD`: `"DomesticD"`; `DomesticE`: `"DomesticE"`; `DomesticF`: `"DomesticF"`; `DomesticG`: `"DomesticG"`; `DomesticH`: `"DomesticH"`; `DomesticI`: `"DomesticI"`; `DomesticJ`: `"DomesticJ"`; `DomesticK`: `"DomesticK"`; `DomesticL`: `"DomesticL"`; `DomesticM`: `"DomesticM"`; `DomesticN`: `"DomesticN"`; `DomesticO`: `"DomesticO"`; `GBTAC`: `"GBTAC"`; `GBTDC`: `"GBTDC"`; `IEC603092Single16`: `"IEC603092Single16"`; `IEC603092Three16`: `"IEC603092Three16"`; `IEC603092Three32`: `"IEC603092Three32"`; `IEC603092Three64`: `"IEC603092Three64"`; `IEC62196T1`: `"IEC62196T1"`; `IEC62196T1COMBO`: `"IEC62196T1COMBO"`; `IEC62196T2`: `"IEC62196T2"`; `IEC62196T2COMBO`: `"IEC62196T2COMBO"`; `IEC62196T3A`: `"IEC62196T3A"`; `IEC62196T3C`: `"IEC62196T3C"`; `NEMA1030`: `"NEMA1030"`; `NEMA1050`: `"NEMA1050"`; `NEMA1430`: `"NEMA1430"`; `NEMA1450`: `"NEMA1450"`; `NEMA520`: `"NEMA520"`; `NEMA630`: `"NEMA630"`; `NEMA650`: `"NEMA650"`; `PantographBottomUp`: `"PantographBottomUp"`; `PantographTopDown`: `"PantographTopDown"`; `TeslaR`: `"TeslaR"`; `TeslaS`: `"TeslaS"`; \}\>\>\>; `vendorErrorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `vendorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `ConnectorCreateSchema` | [00_Base/src/interfaces/dto/connector.dto.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/connector.dto.ts#L63) |

---

### ConnectorSchemaWithoutParent

```ts
const ConnectorSchemaWithoutParent: ZodObject<{
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
     authorizationAmount: ZodOptional<ZodNullable<ZodNumber>>;
     createdAt: ZodOptional<ZodDate>;
     currency: ZodString;
     id: ZodOptional<ZodNumber>;
     paymentFee: ZodOptional<ZodNullable<ZodNumber>>;
     pricePerKwh: ZodNumber;
     pricePerMin: ZodOptional<ZodNullable<ZodNumber>>;
     pricePerSession: ZodOptional<ZodNullable<ZodNumber>>;
     tariffAltText: ZodOptional<ZodNullable<ZodRecord<ZodString, ZodAny>>>;
     taxRate: ZodOptional<ZodNullable<ZodNumber>>;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<...>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<...>>;
        serverProfileOCPI: ZodOptional<ZodNullable<...>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<...>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>>;
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
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/connector.dto.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/connector.dto.ts#L16)
