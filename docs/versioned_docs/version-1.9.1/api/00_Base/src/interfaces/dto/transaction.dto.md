[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/transaction.dto

# 00_Base/src/interfaces/dto/transaction.dto

## Type Aliases

### TransactionCreate

```ts
type TransactionCreate = z.infer<typeof TransactionCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/transaction.dto.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.dto.ts#L71)

---

### TransactionDto

```ts
type TransactionDto = z.infer<typeof TransactionSchema>;
```

Defined in: [00_Base/src/interfaces/dto/transaction.dto.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.dto.ts#L52)

## Variables

### TransactionCreateSchema

```ts
const TransactionCreateSchema: ZodObject<
  {
    authorizationId: ZodOptional<ZodNumber>;
    chargingState: ZodOptional<ZodNullable<ZodString>>;
    connectorId: ZodOptional<ZodNumber>;
    customData: ZodOptional<ZodNullable<ZodAny>>;
    endTime: ZodOptional<ZodISODateTime>;
    evseId: ZodOptional<ZodNumber>;
    isActive: ZodBoolean;
    locationId: ZodOptional<ZodNumber>;
    meterStart: ZodOptional<ZodNullable<ZodNumber>>;
    remoteStartId: ZodOptional<ZodNullable<ZodNumber>>;
    startTime: ZodOptional<ZodISODateTime>;
    stationId: ZodString;
    stoppedReason: ZodOptional<ZodNullable<ZodString>>;
    tariffId: ZodOptional<ZodNumber>;
    tenantId: ZodOptional<ZodNumber>;
    timeSpentCharging: ZodOptional<ZodNullable<ZodNumber>>;
    totalCost: ZodOptional<ZodNumber>;
    totalKwh: ZodOptional<ZodNullable<ZodNumber>>;
    transactionId: ZodString;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/transaction.dto.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.dto.ts#L54)

---

### TransactionProps

```ts
const TransactionProps: object;
```

Defined in: [00_Base/src/interfaces/dto/transaction.dto.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.dto.ts#L50)

#### Type Declaration

| Name                                                        | Type                  | Defined in |
| ----------------------------------------------------------- | --------------------- | ---------- |
| <a id="property-authorization"></a> `authorization`         | `"authorization"`     |            |
| <a id="property-authorizationid"></a> `authorizationId`     | `"authorizationId"`   |            |
| <a id="property-chargingstate"></a> `chargingState`         | `"chargingState"`     |            |
| <a id="property-connector"></a> `connector`                 | `"connector"`         |            |
| <a id="property-connectorid"></a> `connectorId`             | `"connectorId"`       |            |
| <a id="property-createdat"></a> `createdAt`                 | `"createdAt"`         |            |
| <a id="property-customdata"></a> `customData`               | `"customData"`        |            |
| <a id="property-endtime"></a> `endTime`                     | `"endTime"`           |            |
| <a id="property-evse"></a> `evse`                           | `"evse"`              |            |
| <a id="property-evseid"></a> `evseId`                       | `"evseId"`            |            |
| <a id="property-id"></a> `id`                               | `"id"`                |            |
| <a id="property-isactive"></a> `isActive`                   | `"isActive"`          |            |
| <a id="property-location"></a> `location`                   | `"location"`          |            |
| <a id="property-locationid"></a> `locationId`               | `"locationId"`        |            |
| <a id="property-meterstart"></a> `meterStart`               | `"meterStart"`        |            |
| <a id="property-metervalues"></a> `meterValues`             | `"meterValues"`       |            |
| <a id="property-remotestartid"></a> `remoteStartId`         | `"remoteStartId"`     |            |
| <a id="property-starttime"></a> `startTime`                 | `"startTime"`         |            |
| <a id="property-starttransaction"></a> `startTransaction`   | `"startTransaction"`  |            |
| <a id="property-station"></a> `station`                     | `"station"`           |            |
| <a id="property-stationid"></a> `stationId`                 | `"stationId"`         |            |
| <a id="property-stoppedreason"></a> `stoppedReason`         | `"stoppedReason"`     |            |
| <a id="property-stoptransaction"></a> `stopTransaction`     | `"stopTransaction"`   |            |
| <a id="property-tariff"></a> `tariff`                       | `"tariff"`            |            |
| <a id="property-tariffid"></a> `tariffId`                   | `"tariffId"`          |            |
| <a id="property-tenant"></a> `tenant`                       | `"tenant"`            |            |
| <a id="property-tenantid"></a> `tenantId`                   | `"tenantId"`          |            |
| <a id="property-timespentcharging"></a> `timeSpentCharging` | `"timeSpentCharging"` |            |
| <a id="property-totalcost"></a> `totalCost`                 | `"totalCost"`         |            |
| <a id="property-totalkwh"></a> `totalKwh`                   | `"totalKwh"`          |            |
| <a id="property-transactionevents"></a> `transactionEvents` | `"transactionEvents"` |            |
| <a id="property-transactionid"></a> `transactionId`         | `"transactionId"`     |            |
| <a id="property-updatedat"></a> `updatedAt`                 | `"updatedAt"`         |            |

---

### TransactionSchema

```ts
const TransactionSchema: ZodObject<{
  authorization: ZodOptional<ZodObject<{
     additionalInfo: ZodOptional<ZodNullable<ZodTuple<[ZodObject<{
        additionalIdToken: ...;
        id: ...;
        type: ...;
      }, $strip>], ZodObject<{
        additionalIdToken: ZodString;
        id: ZodOptional<...>;
        type: ZodString;
     }, $strip>>>>;
     allowedConnectorTypes: ZodOptional<ZodArray<ZodString>>;
     cacheExpiryDateTime: ZodOptional<ZodNullable<ZodISODateTime>>;
     chargingPriority: ZodOptional<ZodNullable<ZodNumber>>;
     concurrentTransaction: ZodOptional<ZodBoolean>;
     createdAt: ZodOptional<ZodDate>;
     disallowedEvseIdPrefixes: ZodOptional<ZodArray<ZodString>>;
     groupAuthorization: ZodOptional<ZodLazy<ZodObject<{
        additionalInfo: ZodOptional<ZodNullable<...>>;
        allowedConnectorTypes: ZodOptional<ZodArray<...>>;
        cacheExpiryDateTime: ZodOptional<ZodNullable<...>>;
        chargingPriority: ZodOptional<ZodNullable<...>>;
        concurrentTransaction: ZodOptional<ZodBoolean>;
        createdAt: ZodOptional<ZodDate>;
        disallowedEvseIdPrefixes: ZodOptional<ZodArray<...>>;
        groupAuthorizationId: ZodOptional<ZodNullable<...>>;
        id: ZodOptional<ZodNumber>;
        idToken: ZodString;
        idTokenType: ZodOptional<ZodNullable<...>>;
        language1: ZodOptional<ZodNullable<...>>;
        language2: ZodOptional<ZodNullable<...>>;
        personalMessage: ZodOptional<ZodNullable<...>>;
        realTimeAuth: ZodOptional<ZodNullable<...>>;
        realTimeAuthLastAttempt: ZodOptional<ZodNullable<...>>;
        realTimeAuthTimeout: ZodOptional<ZodNullable<...>>;
        realTimeAuthUrl: ZodOptional<ZodString>;
        status: ZodEnum<{
           Accepted: ...;
           Blocked: ...;
           ConcurrentTx: ...;
           Expired: ...;
           Invalid: ...;
           NoCredit: ...;
           NotAllowedTypeEVSE: ...;
           NotAtThisLocation: ...;
           NotAtThisTime: ...;
           Unknown: ...;
        }>;
        tenant: ZodOptional<ZodObject<..., ...>>;
        tenantId: ZodOptional<ZodNumber>;
        tenantPartner: ZodOptional<ZodNullable<...>>;
        tenantPartnerId: ZodOptional<ZodNullable<...>>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>>;
     groupAuthorizationId: ZodOptional<ZodNullable<ZodNumber>>;
     id: ZodOptional<ZodNumber>;
     idToken: ZodString;
     idTokenType: ZodOptional<ZodNullable<ZodEnum<{
        Central: "Central";
        eMAID: "eMAID";
        ISO14443: "ISO14443";
        ISO15693: "ISO15693";
        KeyCode: "KeyCode";
        Local: "Local";
        MacAddress: "MacAddress";
        NoAuthorization: "NoAuthorization";
        Other: "Other";
     }>>>;
     language1: ZodOptional<ZodNullable<ZodString>>;
     language2: ZodOptional<ZodNullable<ZodString>>;
     personalMessage: ZodOptional<ZodNullable<ZodAny>>;
     realTimeAuth: ZodOptional<ZodNullable<ZodEnum<{
        Allowed: "Allowed";
        AllowedOffline: "AllowedOffline";
        Never: "Never";
     }>>>;
     realTimeAuthLastAttempt: ZodOptional<ZodNullable<ZodObject<{
        connectorId: ZodNumber;
        evseId: ZodOptional<ZodNullable<...>>;
        result: ZodEnum<{
           Accepted: ...;
           Blocked: ...;
           ConcurrentTx: ...;
           Expired: ...;
           Invalid: ...;
           NoCredit: ...;
           NotAllowedTypeEVSE: ...;
           NotAtThisLocation: ...;
           NotAtThisTime: ...;
           Unknown: ...;
        }>;
        stationId: ZodString;
        timestamp: ZodISODateTime;
     }, $strip>>>;
     realTimeAuthTimeout: ZodOptional<ZodNullable<ZodNumber>>;
     realTimeAuthUrl: ZodOptional<ZodString>;
     status: ZodEnum<{
        Accepted: "Accepted";
        Blocked: "Blocked";
        ConcurrentTx: "ConcurrentTx";
        Expired: "Expired";
        Invalid: "Invalid";
        NoCredit: "NoCredit";
        NotAllowedTypeEVSE: "NotAllowedTypeEVSE";
        NotAtThisLocation: "NotAtThisLocation";
        NotAtThisTime: "NotAtThisTime";
        Unknown: "Unknown";
     }>;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<ZodString>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<ZodString>>;
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     tenantPartner: ZodOptional<ZodNullable<ZodObject<{
        countryCode: ZodOptional<ZodNullable<...>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        partnerProfileOCPI: ZodObject<{
           credentials: ...;
           endpoints: ...;
           roles: ...;
           serverCredentials: ...;
           version: ...;
        }, $strip>;
        partyId: ZodOptional<ZodNullable<...>>;
        tenant: ZodOptional<ZodObject<..., ...>>;
        tenantId: ZodOptional<ZodNumber>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>>;
     tenantPartnerId: ZodOptional<ZodNullable<ZodNumber>>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>;
  authorizationId: ZodOptional<ZodNumber>;
  chargingState: ZodOptional<ZodNullable<ZodString>>;
  connector: ZodOptional<ZodNullable<ZodObject<{
     chargingStation: ZodOptional<ZodAny>;
     connectorId: ZodNumber;
     createdAt: ZodOptional<ZodDate>;
     errorCode: ZodOptional<ZodNullable<ZodDefault<ZodEnum<{
        ConnectorLockFailure: ...;
        EVCommunicationError: ...;
        GroundFailure: ...;
        HighTemperature: ...;
        InternalError: ...;
        LocalListConflict: ...;
        NoError: ...;
        OtherError: ...;
        OverCurrentFailure: ...;
        OverVoltage: ...;
        PowerMeterFailure: ...;
        PowerSwitchFailure: ...;
        ReaderFailure: ...;
        ResetFailure: ...;
        UnderVoltage: ...;
        WeakSignal: ...;
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
        Available: ...;
        Charging: ...;
        Faulted: ...;
        Finishing: ...;
        Occupied: ...;
        Preparing: ...;
        Reserved: ...;
        SuspendedEV: ...;
        SuspendedEVSE: ...;
        Unavailable: ...;
        Unknown: ...;
     }>>>>;
     tariff: ZodOptional<ZodNullable<ZodObject<{
        authorizationAmount: ZodOptional<...>;
        createdAt: ZodOptional<...>;
        currency: ZodString;
        id: ZodOptional<...>;
        paymentFee: ZodOptional<...>;
        pricePerKwh: ZodNumber;
        pricePerMin: ZodOptional<...>;
        pricePerSession: ZodOptional<...>;
        tariffAltText: ZodOptional<...>;
        taxRate: ZodOptional<...>;
        tenant: ZodOptional<...>;
        tenantId: ZodOptional<...>;
        updatedAt: ZodOptional<...>;
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
  }, $strip>>>;
  connectorId: ZodOptional<ZodNumber>;
  createdAt: ZodOptional<ZodDate>;
  customData: ZodOptional<ZodNullable<ZodAny>>;
  endTime: ZodOptional<ZodISODateTime>;
  evse: ZodOptional<ZodNullable<ZodObject<{
     connectors: ZodOptional<ZodNullable<ZodArray<ZodObject<{
        connectorId: ...;
        createdAt: ...;
        errorCode: ...;
        evseId: ...;
        evseTypeConnectorId: ...;
        format: ...;
        id: ...;
        info: ...;
        maximumAmperage: ...;
        maximumPowerWatts: ...;
        maximumVoltage: ...;
        powerType: ...;
        stationId: ...;
        status: ...;
        tariff: ...;
        tariffId: ...;
        tenant: ...;
        tenantId: ...;
        termsAndConditionsUrl: ...;
        timestamp: ...;
        type: ...;
        updatedAt: ...;
        vendorErrorCode: ...;
        vendorId: ...;
     }, $strip>>>>;
     createdAt: ZodOptional<ZodDate>;
     evseId: ZodString;
     evseTypeId: ZodOptional<ZodNumber>;
     id: ZodOptional<ZodNumber>;
     physicalReference: ZodOptional<ZodNullable<ZodString>>;
     removed: ZodOptional<ZodBoolean>;
     stationId: ZodString;
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
  evseId: ZodOptional<ZodNumber>;
  id: ZodOptional<ZodNumber>;
  isActive: ZodBoolean;
  location: ZodOptional<ZodObject<{
     address: ZodString;
     chargingPool: ZodOptional<ZodNullable<ZodArray<ZodObject<{
        capabilities: ZodOptional<...>;
        chargeBoxSerialNumber: ZodOptional<...>;
        chargePointModel: ZodOptional<...>;
        chargePointSerialNumber: ZodOptional<...>;
        chargePointVendor: ZodOptional<...>;
        connectors: ZodOptional<...>;
        coordinates: ZodOptional<...>;
        createdAt: ZodOptional<...>;
        evses: ZodOptional<...>;
        firmwareVersion: ZodOptional<...>;
        floorLevel: ZodOptional<...>;
        iccid: ZodOptional<...>;
        id: ZodString;
        imsi: ZodOptional<...>;
        isOnline: ZodBoolean;
        latestOcppMessageTimestamp: ZodOptional<...>;
        locationId: ZodOptional<...>;
        meterSerialNumber: ZodOptional<...>;
        meterType: ZodOptional<...>;
        networkProfiles: ZodOptional<...>;
        parkingRestrictions: ZodOptional<...>;
        protocol: ZodOptional<...>;
        tenant: ZodOptional<...>;
        tenantId: ZodOptional<...>;
        updatedAt: ZodOptional<...>;
        use16StatusNotification0: ZodOptional<...>;
     }, $strip>>>>;
     city: ZodString;
     coordinates: ZodObject<{
        coordinates: ZodArray<ZodNumber>;
        type: ZodLiteral<"Point">;
     }, $strip>;
     country: ZodString;
     createdAt: ZodOptional<ZodDate>;
     facilities: ZodOptional<ZodNullable<ZodArray<ZodEnum<{
        Airport: "Airport";
        BikeSharing: "BikeSharing";
        BusStop: "BusStop";
        Cafe: "Cafe";
        CarpoolParking: "CarpoolParking";
        FuelStation: "FuelStation";
        Hotel: "Hotel";
        Mall: "Mall";
        MetroStation: "MetroStation";
        Museum: "Museum";
        Nature: "Nature";
        ParkingLot: "ParkingLot";
        RecreationArea: "RecreationArea";
        Restaurant: "Restaurant";
        Sport: "Sport";
        Supermarket: "Supermarket";
        TaxiStand: "TaxiStand";
        TrainStation: "TrainStation";
        TramStop: "TramStop";
        Wifi: "Wifi";
     }>>>>;
     id: ZodOptional<ZodNumber>;
     name: ZodString;
     openingHours: ZodOptional<ZodNullable<ZodAny>>;
     parkingType: ZodOptional<ZodNullable<ZodEnum<{
        AlongMotorway: "AlongMotorway";
        OnDriveway: "OnDriveway";
        OnStreet: "OnStreet";
        ParkingGarage: "ParkingGarage";
        ParkingLot: "ParkingLot";
        UndergroundGarage: "UndergroundGarage";
     }>>>;
     postalCode: ZodString;
     publishUpstream: ZodDefault<ZodBoolean>;
     state: ZodString;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<ZodString>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<ZodString>>;
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     timeZone: ZodDefault<ZodString>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>;
  locationId: ZodOptional<ZodNumber>;
  meterStart: ZodOptional<ZodNullable<ZodNumber>>;
  meterValues: ZodOptional<ZodArray<ZodObject<{
     connectorId: ZodOptional<ZodNumber>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     sampledValue: ZodTuple<[ZodObject<{
        context: ZodOptional<...>;
        location: ZodOptional<...>;
        measurand: ZodOptional<...>;
        phase: ZodOptional<...>;
        signedMeterValue: ZodOptional<...>;
        unitOfMeasure: ZodOptional<...>;
        value: ZodNumber;
      }, $strip>], ZodObject<{
        context: ZodOptional<ZodNullable<...>>;
        location: ZodOptional<ZodNullable<...>>;
        measurand: ZodOptional<ZodNullable<...>>;
        phase: ZodOptional<ZodNullable<...>>;
        signedMeterValue: ZodOptional<ZodNullable<...>>;
        unitOfMeasure: ZodOptional<ZodNullable<...>>;
        value: ZodNumber;
     }, $strip>>;
     tariffId: ZodOptional<ZodNullable<ZodNumber>>;
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
     timestamp: ZodISODateTime;
     transactionDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
     transactionEventId: ZodOptional<ZodNullable<ZodNumber>>;
     transactionId: ZodOptional<ZodNullable<ZodString>>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>>;
  remoteStartId: ZodOptional<ZodNullable<ZodNumber>>;
  startTime: ZodOptional<ZodISODateTime>;
  startTransaction: ZodOptional<ZodObject<{
     connector: ZodOptional<ZodObject<{
        chargingStation: ZodOptional<ZodAny>;
        connectorId: ZodNumber;
        createdAt: ZodOptional<ZodDate>;
        errorCode: ZodOptional<ZodNullable<ZodDefault<...>>>;
        evse: ZodOptional<ZodAny>;
        evseId: ZodNumber;
        evseTypeConnectorId: ZodOptional<ZodNumber>;
        format: ZodOptional<ZodNullable<ZodEnum<...>>>;
        id: ZodOptional<ZodNumber>;
        info: ZodOptional<ZodNullable<ZodString>>;
        maximumAmperage: ZodOptional<ZodNullable<ZodNumber>>;
        maximumPowerWatts: ZodOptional<ZodNullable<ZodNumber>>;
        maximumVoltage: ZodOptional<ZodNullable<ZodNumber>>;
        powerType: ZodOptional<ZodNullable<ZodEnum<...>>>;
        stationId: ZodString;
        status: ZodOptional<ZodNullable<ZodDefault<...>>>;
        tariff: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        tariffId: ZodOptional<ZodNullable<ZodNumber>>;
        tenant: ZodOptional<ZodAny>;
        tenantId: ZodOptional<ZodNumber>;
        termsAndConditionsUrl: ZodOptional<ZodNullable<ZodString>>;
        timestamp: ZodISODateTime;
        type: ZodOptional<ZodNullable<ZodEnum<...>>>;
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
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     timestamp: ZodISODateTime;
     transactionDatabaseId: ZodNumber;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>;
  station: ZodObject<{
     capabilities: ZodOptional<ZodNullable<ZodArray<ZodEnum<{
        ChargingPreferencesCapable: "ChargingPreferencesCapable";
        ChargingProfileCapable: "ChargingProfileCapable";
        ChipCardSupport: "ChipCardSupport";
        ContactlessCardSupport: "ContactlessCardSupport";
        CreditCardPayable: "CreditCardPayable";
        DebitCardPayable: "DebitCardPayable";
        PEDTerminal: "PEDTerminal";
        RemoteStartStopCapable: "RemoteStartStopCapable";
        Reservable: "Reservable";
        RFIDReader: "RFIDReader";
        StartSessionConnectorRequired: "StartSessionConnectorRequired";
        TokenGroupCapable: "TokenGroupCapable";
        UnlockCapable: "UnlockCapable";
     }>>>>;
     chargeBoxSerialNumber: ZodOptional<ZodNullable<ZodString>>;
     chargePointModel: ZodOptional<ZodNullable<ZodString>>;
     chargePointSerialNumber: ZodOptional<ZodNullable<ZodString>>;
     chargePointVendor: ZodOptional<ZodNullable<ZodString>>;
     connectors: ZodOptional<ZodNullable<ZodArray<ZodObject<{
        chargingStation: ZodOptional<ZodAny>;
        connectorId: ZodNumber;
        createdAt: ZodOptional<ZodDate>;
        errorCode: ZodOptional<ZodNullable<...>>;
        evse: ZodOptional<ZodAny>;
        evseId: ZodNumber;
        evseTypeConnectorId: ZodOptional<ZodNumber>;
        format: ZodOptional<ZodNullable<...>>;
        id: ZodOptional<ZodNumber>;
        info: ZodOptional<ZodNullable<...>>;
        maximumAmperage: ZodOptional<ZodNullable<...>>;
        maximumPowerWatts: ZodOptional<ZodNullable<...>>;
        maximumVoltage: ZodOptional<ZodNullable<...>>;
        powerType: ZodOptional<ZodNullable<...>>;
        stationId: ZodString;
        status: ZodOptional<ZodNullable<...>>;
        tariff: ZodOptional<ZodNullable<...>>;
        tariffId: ZodOptional<ZodNullable<...>>;
        tenant: ZodOptional<ZodAny>;
        tenantId: ZodOptional<ZodNumber>;
        termsAndConditionsUrl: ZodOptional<ZodNullable<...>>;
        timestamp: ZodISODateTime;
        type: ZodOptional<ZodNullable<...>>;
        updatedAt: ZodOptional<ZodDate>;
        vendorErrorCode: ZodOptional<ZodNullable<...>>;
        vendorId: ZodOptional<ZodNullable<...>>;
     }, $strip>>>>;
     coordinates: ZodOptional<ZodNullable<ZodObject<{
        coordinates: ZodArray<ZodNumber>;
        type: ZodLiteral<"Point">;
     }, $strip>>>;
     createdAt: ZodOptional<ZodDate>;
     evses: ZodOptional<ZodNullable<ZodArray<ZodObject<{
        connectors: ZodOptional<ZodNullable<...>>;
        createdAt: ZodOptional<ZodDate>;
        evseId: ZodString;
        evseTypeId: ZodOptional<ZodNumber>;
        id: ZodOptional<ZodNumber>;
        physicalReference: ZodOptional<ZodNullable<...>>;
        removed: ZodOptional<ZodBoolean>;
        stationId: ZodString;
        tenant: ZodOptional<ZodObject<..., ...>>;
        tenantId: ZodOptional<ZodNumber>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>>>;
     firmwareVersion: ZodOptional<ZodNullable<ZodString>>;
     floorLevel: ZodOptional<ZodNullable<ZodString>>;
     iccid: ZodOptional<ZodNullable<ZodString>>;
     id: ZodString;
     imsi: ZodOptional<ZodNullable<ZodString>>;
     isOnline: ZodBoolean;
     latestOcppMessageTimestamp: ZodOptional<ZodNullable<ZodString>>;
     locationId: ZodOptional<ZodNullable<ZodNumber>>;
     meterSerialNumber: ZodOptional<ZodNullable<ZodString>>;
     meterType: ZodOptional<ZodNullable<ZodString>>;
     networkProfiles: ZodOptional<ZodAny>;
     parkingRestrictions: ZodOptional<ZodNullable<ZodArray<ZodEnum<{
        Customers: "Customers";
        Disabled: "Disabled";
        EVOnly: "EVOnly";
        Motorcycles: "Motorcycles";
        Plugged: "Plugged";
     }>>>>;
     protocol: ZodOptional<ZodNullable<ZodEnum<typeof OCPPVersion>>>;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<ZodString>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<ZodString>>;
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<{
           credentialsRole: ...;
           versionDetails: ...;
           versionEndpoints: ...;
        }, $strip>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     updatedAt: ZodOptional<ZodDate>;
     use16StatusNotification0: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
  }, $strip>;
  stationId: ZodString;
  stoppedReason: ZodOptional<ZodNullable<ZodString>>;
  stopTransaction: ZodOptional<ZodObject<{
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     idTokenType: ZodOptional<ZodString>;
     idTokenValue: ZodOptional<ZodString>;
     meterStop: ZodNumber;
     meterValues: ZodOptional<ZodArray<ZodObject<{
        connectorId: ZodOptional<ZodNumber>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        sampledValue: ZodTuple<[...], ZodObject<..., ...>>;
        tariffId: ZodOptional<ZodNullable<...>>;
        tenant: ZodOptional<ZodObject<..., ...>>;
        tenantId: ZodOptional<ZodNumber>;
        timestamp: ZodISODateTime;
        transactionDatabaseId: ZodOptional<ZodNullable<...>>;
        transactionEventId: ZodOptional<ZodNullable<...>>;
        transactionId: ZodOptional<ZodNullable<...>>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>>;
     reason: ZodOptional<ZodString>;
     stationId: ZodString;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<ZodString>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<ZodString>>;
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     timestamp: ZodISODateTime;
     transactionDatabaseId: ZodNumber;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>;
  tariff: ZodOptional<ZodObject<{
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
        countryCode: ZodOptional<ZodNullable<ZodString>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<ZodString>>;
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>;
  tariffId: ZodOptional<ZodNumber>;
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
  timeSpentCharging: ZodOptional<ZodNullable<ZodNumber>>;
  totalCost: ZodOptional<ZodNumber>;
  totalKwh: ZodOptional<ZodNullable<ZodNumber>>;
  transactionEvents: ZodOptional<ZodArray<ZodObject<{
     cableMaxCurrent: ZodOptional<ZodNullable<ZodNumber>>;
     createdAt: ZodOptional<ZodDate>;
     eventType: ZodEnum<{
        Ended: "Ended";
        Started: "Started";
        Updated: "Updated";
     }>;
     evse: ZodOptional<ZodObject<{
        connectorId: ZodOptional<ZodNullable<...>>;
        createdAt: ZodOptional<ZodDate>;
        databaseId: ZodOptional<ZodNumber>;
        id: ZodNumber;
        tenant: ZodOptional<ZodObject<..., ...>>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>;
     evseId: ZodOptional<ZodNullable<ZodNumber>>;
     id: ZodOptional<ZodNumber>;
     idTokenType: ZodOptional<ZodNullable<ZodString>>;
     idTokenValue: ZodOptional<ZodNullable<ZodString>>;
     meterValue: ZodOptional<ZodTuple<[ZodObject<{
        connectorId: ...;
        createdAt: ...;
        id: ...;
        sampledValue: ...;
        tariffId: ...;
        tenant: ...;
        tenantId: ...;
        timestamp: ...;
        transactionDatabaseId: ...;
        transactionEventId: ...;
        transactionId: ...;
        updatedAt: ...;
      }, $strip>], ZodObject<{
        connectorId: ZodOptional<...>;
        createdAt: ZodOptional<...>;
        id: ZodOptional<...>;
        sampledValue: ZodTuple<..., ...>;
        tariffId: ZodOptional<...>;
        tenant: ZodOptional<...>;
        tenantId: ZodOptional<...>;
        timestamp: ZodISODateTime;
        transactionDatabaseId: ZodOptional<...>;
        transactionEventId: ZodOptional<...>;
        transactionId: ZodOptional<...>;
        updatedAt: ZodOptional<...>;
     }, $strip>>>;
     numberOfPhasesUsed: ZodOptional<ZodNullable<ZodNumber>>;
     offline: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
     reservationId: ZodOptional<ZodNullable<ZodNumber>>;
     seqNo: ZodNumber;
     stationId: ZodString;
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
     timestamp: ZodISODateTime;
     transactionDatabaseId: ZodOptional<ZodNumber>;
     transactionInfo: ZodOptional<ZodObject<{
        chargingState: ZodOptional<ZodNullable<...>>;
        remoteStartId: ZodOptional<ZodNullable<...>>;
        stoppedReason: ZodOptional<ZodNullable<...>>;
        timeSpentCharging: ZodOptional<ZodNullable<...>>;
        transactionId: ZodString;
     }, $strip>>;
     triggerReason: ZodEnum<{
        AbnormalCondition: "AbnormalCondition";
        Authorized: "Authorized";
        CablePluggedIn: "CablePluggedIn";
        ChargingRateChanged: "ChargingRateChanged";
        ChargingStateChanged: "ChargingStateChanged";
        Deauthorized: "Deauthorized";
        EnergyLimitReached: "EnergyLimitReached";
        EVCommunicationLost: "EVCommunicationLost";
        EVConnectTimeout: "EVConnectTimeout";
        EVDeparted: "EVDeparted";
        EVDetected: "EVDetected";
        MeterValueClock: "MeterValueClock";
        MeterValuePeriodic: "MeterValuePeriodic";
        RemoteStart: "RemoteStart";
        RemoteStop: "RemoteStop";
        ResetCommand: "ResetCommand";
        SignedDataReceived: "SignedDataReceived";
        StopAuthorized: "StopAuthorized";
        TimeLimitReached: "TimeLimitReached";
        Trigger: "Trigger";
        UnlockCommand: "UnlockCommand";
     }>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>>;
  transactionId: ZodString;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/transaction.dto.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.dto.ts#L18)

---

### transactionSchemas

```ts
const transactionSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/transaction.dto.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.dto.ts#L73)

#### Type Declaration

| Name                                                        | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Default value             | Defined in                                                                                                                                                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-transaction"></a> `Transaction`             | `ZodObject`\<\{ `authorization`: `ZodOptional`\<`ZodObject`\<\{ `additionalInfo`: `ZodOptional`\<`ZodNullable`\<`ZodTuple`\<\[`ZodObject`\<..., ...\>\], `ZodObject`\<\{ `additionalIdToken`: ...; `id`: ...; `type`: ...; \}, `$strip`\>\>\>\>; `allowedConnectorTypes`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `cacheExpiryDateTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `chargingPriority`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `concurrentTransaction`: `ZodOptional`\<`ZodBoolean`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `disallowedEvseIdPrefixes`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `groupAuthorization`: `ZodOptional`\<`ZodLazy`\<`ZodObject`\<\{ `additionalInfo`: `ZodOptional`\<...\>; `allowedConnectorTypes`: `ZodOptional`\<...\>; `cacheExpiryDateTime`: `ZodOptional`\<...\>; `chargingPriority`: `ZodOptional`\<...\>; `concurrentTransaction`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `disallowedEvseIdPrefixes`: `ZodOptional`\<...\>; `groupAuthorizationId`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `idToken`: `ZodString`; `idTokenType`: `ZodOptional`\<...\>; `language1`: `ZodOptional`\<...\>; `language2`: `ZodOptional`\<...\>; `personalMessage`: `ZodOptional`\<...\>; `realTimeAuth`: `ZodOptional`\<...\>; `realTimeAuthLastAttempt`: `ZodOptional`\<...\>; `realTimeAuthTimeout`: `ZodOptional`\<...\>; `realTimeAuthUrl`: `ZodOptional`\<...\>; `status`: `ZodEnum`\<...\>; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `tenantPartner`: `ZodOptional`\<...\>; `tenantPartnerId`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>; `groupAuthorizationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `idToken`: `ZodString`; `idTokenType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Central`: `"Central"`; `eMAID`: `"eMAID"`; `ISO14443`: `"ISO14443"`; `ISO15693`: `"ISO15693"`; `KeyCode`: `"KeyCode"`; `Local`: `"Local"`; `MacAddress`: `"MacAddress"`; `NoAuthorization`: `"NoAuthorization"`; `Other`: `"Other"`; \}\>\>\>; `language1`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `language2`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `personalMessage`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `realTimeAuth`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Allowed`: `"Allowed"`; `AllowedOffline`: `"AllowedOffline"`; `Never`: `"Never"`; \}\>\>\>; `realTimeAuthLastAttempt`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `connectorId`: `ZodNumber`; `evseId`: `ZodOptional`\<...\>; `result`: `ZodEnum`\<...\>; `stationId`: `ZodString`; `timestamp`: `ZodISODateTime`; \}, `$strip`\>\>\>; `realTimeAuthTimeout`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `realTimeAuthUrl`: `ZodOptional`\<`ZodString`\>; `status`: `ZodEnum`\<\{ `Accepted`: `"Accepted"`; `Blocked`: `"Blocked"`; `ConcurrentTx`: `"ConcurrentTx"`; `Expired`: `"Expired"`; `Invalid`: `"Invalid"`; `NoCredit`: `"NoCredit"`; `NotAllowedTypeEVSE`: `"NotAllowedTypeEVSE"`; `NotAtThisLocation`: `"NotAtThisLocation"`; `NotAtThisTime`: `"NotAtThisTime"`; `Unknown`: `"Unknown"`; \}\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tenantPartner`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `partnerProfileOCPI`: `ZodObject`\<..., ...\>; `partyId`: `ZodOptional`\<...\>; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>; `tenantPartnerId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `authorizationId`: `ZodOptional`\<`ZodNumber`\>; `chargingState`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connector`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `chargingStation`: `ZodOptional`\<`ZodAny`\>; `connectorId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `errorCode`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<...\>\>\>\>; `evse`: `ZodOptional`\<`ZodAny`\>; `evseId`: `ZodNumber`; `evseTypeConnectorId`: `ZodOptional`\<`ZodNumber`\>; `format`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Cable`: ...; `Socket`: ...; \}\>\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `info`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `maximumAmperage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumPowerWatts`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumVoltage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `powerType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `AC1Phase`: ...; `AC2Phase`: ...; `AC2PhaseSplit`: ...; `AC3Phase`: ...; `DC`: ...; \}\>\>\>; `stationId`: `ZodString`; `status`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<...\>\>\>\>; `tariff`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `authorizationAmount`: ...; `createdAt`: ...; `currency`: ...; `id`: ...; `paymentFee`: ...; `pricePerKwh`: ...; `pricePerMin`: ...; `pricePerSession`: ...; `tariffAltText`: ...; `taxRate`: ...; `tenant`: ...; `tenantId`: ...; `updatedAt`: ...; \}, `$strip`\>\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodAny`\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `termsAndConditionsUrl`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `timestamp`: `ZodISODateTime`; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `CHAdeMO`: ...; `ChaoJi`: ...; `DomesticA`: ...; `DomesticB`: ...; `DomesticC`: ...; `DomesticD`: ...; `DomesticE`: ...; `DomesticF`: ...; `DomesticG`: ...; `DomesticH`: ...; `DomesticI`: ...; `DomesticJ`: ...; `DomesticK`: ...; `DomesticL`: ...; `DomesticM`: ...; `DomesticN`: ...; `DomesticO`: ...; `GBTAC`: ...; `GBTDC`: ...; `IEC603092Single16`: ...; `IEC603092Three16`: ...; `IEC603092Three32`: ...; `IEC603092Three64`: ...; `IEC62196T1`: ...; `IEC62196T1COMBO`: ...; `IEC62196T2`: ...; `IEC62196T2COMBO`: ...; `IEC62196T3A`: ...; `IEC62196T3C`: ...; `NEMA1030`: ...; `NEMA1050`: ...; `NEMA1430`: ...; `NEMA1450`: ...; `NEMA520`: ...; `NEMA630`: ...; `NEMA650`: ...; `PantographBottomUp`: ...; `PantographTopDown`: ...; `TeslaR`: ...; `TeslaS`: ...; \}\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `vendorErrorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `vendorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>\>; `connectorId`: `ZodOptional`\<`ZodNumber`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `endTime`: `ZodOptional`\<`ZodISODateTime`\>; `evse`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<..., ...\>\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evseId`: `ZodString`; `evseTypeId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `physicalReference`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `removed`: `ZodOptional`\<`ZodBoolean`\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `evseId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isActive`: `ZodBoolean`; `location`: `ZodOptional`\<`ZodObject`\<\{ `address`: `ZodString`; `chargingPool`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `capabilities`: ...; `chargeBoxSerialNumber`: ...; `chargePointModel`: ...; `chargePointSerialNumber`: ...; `chargePointVendor`: ...; `connectors`: ...; `coordinates`: ...; `createdAt`: ...; `evses`: ...; `firmwareVersion`: ...; `floorLevel`: ...; `iccid`: ...; `id`: ...; `imsi`: ...; `isOnline`: ...; `latestOcppMessageTimestamp`: ...; `locationId`: ...; `meterSerialNumber`: ...; `meterType`: ...; `networkProfiles`: ...; `parkingRestrictions`: ...; `protocol`: ...; `tenant`: ...; `tenantId`: ...; `updatedAt`: ...; `use16StatusNotification0`: ...; \}, `$strip`\>\>\>\>; `city`: `ZodString`; `coordinates`: `ZodObject`\<\{ `coordinates`: `ZodArray`\<`ZodNumber`\>; `type`: `ZodLiteral`\<`"Point"`\>; \}, `$strip`\>; `country`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `facilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `Airport`: ...; `BikeSharing`: ...; `BusStop`: ...; `Cafe`: ...; `CarpoolParking`: ...; `FuelStation`: ...; `Hotel`: ...; `Mall`: ...; `MetroStation`: ...; `Museum`: ...; `Nature`: ...; `ParkingLot`: ...; `RecreationArea`: ...; `Restaurant`: ...; `Sport`: ...; `Supermarket`: ...; `TaxiStand`: ...; `TrainStation`: ...; `TramStop`: ...; `Wifi`: ...; \}\>\>\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `name`: `ZodString`; `openingHours`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `parkingType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `AlongMotorway`: `"AlongMotorway"`; `OnDriveway`: `"OnDriveway"`; `OnStreet`: `"OnStreet"`; `ParkingGarage`: `"ParkingGarage"`; `ParkingLot`: `"ParkingLot"`; `UndergroundGarage`: `"UndergroundGarage"`; \}\>\>\>; `postalCode`: `ZodString`; `publishUpstream`: `ZodDefault`\<`ZodBoolean`\>; `state`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeZone`: `ZodDefault`\<`ZodString`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `locationId`: `ZodOptional`\<`ZodNumber`\>; `meterStart`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterValues`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNumber`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `sampledValue`: `ZodTuple`\<\[`ZodObject`\<\{ `context`: ...; `location`: ...; `measurand`: ...; `phase`: ...; `signedMeterValue`: ...; `unitOfMeasure`: ...; `value`: ...; \}, `$strip`\>\], `ZodObject`\<\{ `context`: `ZodOptional`\<...\>; `location`: `ZodOptional`\<...\>; `measurand`: `ZodOptional`\<...\>; `phase`: `ZodOptional`\<...\>; `signedMeterValue`: `ZodOptional`\<...\>; `unitOfMeasure`: `ZodOptional`\<...\>; `value`: `ZodNumber`; \}, `$strip`\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionEventId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `remoteStartId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `startTime`: `ZodOptional`\<`ZodISODateTime`\>; `startTransaction`: `ZodOptional`\<`ZodObject`\<\{ `connector`: `ZodOptional`\<`ZodObject`\<\{ `chargingStation`: `ZodOptional`\<`ZodAny`\>; `connectorId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `errorCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `evse`: `ZodOptional`\<`ZodAny`\>; `evseId`: `ZodNumber`; `evseTypeConnectorId`: `ZodOptional`\<`ZodNumber`\>; `format`: `ZodOptional`\<`ZodNullable`\<...\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `info`: `ZodOptional`\<`ZodNullable`\<...\>\>; `maximumAmperage`: `ZodOptional`\<`ZodNullable`\<...\>\>; `maximumPowerWatts`: `ZodOptional`\<`ZodNullable`\<...\>\>; `maximumVoltage`: `ZodOptional`\<`ZodNullable`\<...\>\>; `powerType`: `ZodOptional`\<`ZodNullable`\<...\>\>; `stationId`: `ZodString`; `status`: `ZodOptional`\<`ZodNullable`\<...\>\>; `tariff`: `ZodOptional`\<`ZodNullable`\<...\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `tenant`: `ZodOptional`\<`ZodAny`\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `termsAndConditionsUrl`: `ZodOptional`\<`ZodNullable`\<...\>\>; `timestamp`: `ZodISODateTime`; `type`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `vendorErrorCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `vendorId`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `connectorDatabaseId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `meterStart`: `ZodNumber`; `reservationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodNumber`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `station`: `ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `ChargingPreferencesCapable`: `"ChargingPreferencesCapable"`; `ChargingProfileCapable`: `"ChargingProfileCapable"`; `ChipCardSupport`: `"ChipCardSupport"`; `ContactlessCardSupport`: `"ContactlessCardSupport"`; `CreditCardPayable`: `"CreditCardPayable"`; `DebitCardPayable`: `"DebitCardPayable"`; `PEDTerminal`: `"PEDTerminal"`; `RemoteStartStopCapable`: `"RemoteStartStopCapable"`; `Reservable`: `"Reservable"`; `RFIDReader`: `"RFIDReader"`; `StartSessionConnectorRequired`: `"StartSessionConnectorRequired"`; `TokenGroupCapable`: `"TokenGroupCapable"`; `UnlockCapable`: `"UnlockCapable"`; \}\>\>\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `chargingStation`: `ZodOptional`\<...\>; `connectorId`: `ZodNumber`; `createdAt`: `ZodOptional`\<...\>; `errorCode`: `ZodOptional`\<...\>; `evse`: `ZodOptional`\<...\>; `evseId`: `ZodNumber`; `evseTypeConnectorId`: `ZodOptional`\<...\>; `format`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `info`: `ZodOptional`\<...\>; `maximumAmperage`: `ZodOptional`\<...\>; `maximumPowerWatts`: `ZodOptional`\<...\>; `maximumVoltage`: `ZodOptional`\<...\>; `powerType`: `ZodOptional`\<...\>; `stationId`: `ZodString`; `status`: `ZodOptional`\<...\>; `tariff`: `ZodOptional`\<...\>; `tariffId`: `ZodOptional`\<...\>; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `termsAndConditionsUrl`: `ZodOptional`\<...\>; `timestamp`: `ZodISODateTime`; `type`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `vendorErrorCode`: `ZodOptional`\<...\>; `vendorId`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>\>; `coordinates`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `coordinates`: `ZodArray`\<`ZodNumber`\>; `type`: `ZodLiteral`\<`"Point"`\>; \}, `$strip`\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evses`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `connectors`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `evseId`: `ZodString`; `evseTypeId`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `physicalReference`: `ZodOptional`\<...\>; `removed`: `ZodOptional`\<...\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `networkProfiles`: `ZodOptional`\<`ZodAny`\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `Customers`: `"Customers"`; `Disabled`: `"Disabled"`; `EVOnly`: `"EVOnly"`; `Motorcycles`: `"Motorcycles"`; `Plugged`: `"Plugged"`; \}\>\>\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; \}, `$strip`\>; `stationId`: `ZodString`; `stoppedReason`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `stopTransaction`: `ZodOptional`\<`ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `idTokenType`: `ZodOptional`\<`ZodString`\>; `idTokenValue`: `ZodOptional`\<`ZodString`\>; `meterStop`: `ZodNumber`; `meterValues`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `sampledValue`: `ZodTuple`\<..., ...\>; `tariffId`: `ZodOptional`\<...\>; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodOptional`\<...\>; `transactionEventId`: `ZodOptional`\<...\>; `transactionId`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>; `reason`: `ZodOptional`\<`ZodString`\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodNumber`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `tariff`: `ZodOptional`\<`ZodObject`\<\{ `authorizationAmount`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `currency`: `ZodString`; `id`: `ZodOptional`\<`ZodNumber`\>; `paymentFee`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `pricePerKwh`: `ZodNumber`; `pricePerMin`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `pricePerSession`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tariffAltText`: `ZodOptional`\<`ZodNullable`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>; `taxRate`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `tariffId`: `ZodOptional`\<`ZodNumber`\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeSpentCharging`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `totalCost`: `ZodOptional`\<`ZodNumber`\>; `totalKwh`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionEvents`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `cableMaxCurrent`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `eventType`: `ZodEnum`\<\{ `Ended`: `"Ended"`; `Started`: `"Started"`; `Updated`: `"Updated"`; \}\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `databaseId`: `ZodOptional`\<...\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `idTokenType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `idTokenValue`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterValue`: `ZodOptional`\<`ZodTuple`\<\[`ZodObject`\<..., ...\>\], `ZodObject`\<\{ `connectorId`: ...; `createdAt`: ...; `id`: ...; `sampledValue`: ...; `tariffId`: ...; `tenant`: ...; `tenantId`: ...; `timestamp`: ...; `transactionDatabaseId`: ...; `transactionEventId`: ...; `transactionId`: ...; `updatedAt`: ...; \}, `$strip`\>\>\>; `numberOfPhasesUsed`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `offline`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `reservationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `seqNo`: `ZodNumber`; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `transactionInfo`: `ZodOptional`\<`ZodObject`\<\{ `chargingState`: `ZodOptional`\<...\>; `remoteStartId`: `ZodOptional`\<...\>; `stoppedReason`: `ZodOptional`\<...\>; `timeSpentCharging`: `ZodOptional`\<...\>; `transactionId`: `ZodString`; \}, `$strip`\>\>; `triggerReason`: `ZodEnum`\<\{ `AbnormalCondition`: `"AbnormalCondition"`; `Authorized`: `"Authorized"`; `CablePluggedIn`: `"CablePluggedIn"`; `ChargingRateChanged`: `"ChargingRateChanged"`; `ChargingStateChanged`: `"ChargingStateChanged"`; `Deauthorized`: `"Deauthorized"`; `EnergyLimitReached`: `"EnergyLimitReached"`; `EVCommunicationLost`: `"EVCommunicationLost"`; `EVConnectTimeout`: `"EVConnectTimeout"`; `EVDeparted`: `"EVDeparted"`; `EVDetected`: `"EVDetected"`; `MeterValueClock`: `"MeterValueClock"`; `MeterValuePeriodic`: `"MeterValuePeriodic"`; `RemoteStart`: `"RemoteStart"`; `RemoteStop`: `"RemoteStop"`; `ResetCommand`: `"ResetCommand"`; `SignedDataReceived`: `"SignedDataReceived"`; `StopAuthorized`: `"StopAuthorized"`; `TimeLimitReached`: `"TimeLimitReached"`; `Trigger`: `"Trigger"`; `UnlockCommand`: `"UnlockCommand"`; \}\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `transactionId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `TransactionSchema`       | [00_Base/src/interfaces/dto/transaction.dto.ts:74](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.dto.ts#L74) |
| <a id="property-transactioncreate"></a> `TransactionCreate` | `ZodObject`\<\{ `authorizationId`: `ZodOptional`\<`ZodNumber`\>; `chargingState`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connectorId`: `ZodOptional`\<`ZodNumber`\>; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `endTime`: `ZodOptional`\<`ZodISODateTime`\>; `evseId`: `ZodOptional`\<`ZodNumber`\>; `isActive`: `ZodBoolean`; `locationId`: `ZodOptional`\<`ZodNumber`\>; `meterStart`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `remoteStartId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `startTime`: `ZodOptional`\<`ZodISODateTime`\>; `stationId`: `ZodString`; `stoppedReason`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tariffId`: `ZodOptional`\<`ZodNumber`\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeSpentCharging`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `totalCost`: `ZodOptional`\<`ZodNumber`\>; `totalKwh`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionId`: `ZodString`; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `TransactionCreateSchema` | [00_Base/src/interfaces/dto/transaction.dto.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.dto.ts#L75) |
