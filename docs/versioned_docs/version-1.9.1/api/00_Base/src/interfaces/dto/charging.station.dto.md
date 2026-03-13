[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/charging.station.dto

# 00_Base/src/interfaces/dto/charging.station.dto

## Type Aliases

### ChargingStationCreate

```ts
type ChargingStationCreate = z.infer<typeof ChargingStationCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.dto.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L57)

---

### ChargingStationDto

```ts
type ChargingStationDto = z.infer<typeof ChargingStationSchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.dto.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L43)

---

### ChargingStationOCPI

```ts
type ChargingStationOCPI = z.infer<typeof ChargingStationOCPISchema>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.dto.ts:66](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L66)

## Variables

### ChargingStationCreateSchema

```ts
const ChargingStationCreateSchema: ZodObject<
  {
    capabilities: ZodOptional<
      ZodNullable<
        ZodArray<
          ZodEnum<{
            ChargingPreferencesCapable: 'ChargingPreferencesCapable';
            ChargingProfileCapable: 'ChargingProfileCapable';
            ChipCardSupport: 'ChipCardSupport';
            ContactlessCardSupport: 'ContactlessCardSupport';
            CreditCardPayable: 'CreditCardPayable';
            DebitCardPayable: 'DebitCardPayable';
            PEDTerminal: 'PEDTerminal';
            RemoteStartStopCapable: 'RemoteStartStopCapable';
            Reservable: 'Reservable';
            RFIDReader: 'RFIDReader';
            StartSessionConnectorRequired: 'StartSessionConnectorRequired';
            TokenGroupCapable: 'TokenGroupCapable';
            UnlockCapable: 'UnlockCapable';
          }>
        >
      >
    >;
    chargeBoxSerialNumber: ZodOptional<ZodNullable<ZodString>>;
    chargePointModel: ZodOptional<ZodNullable<ZodString>>;
    chargePointSerialNumber: ZodOptional<ZodNullable<ZodString>>;
    chargePointVendor: ZodOptional<ZodNullable<ZodString>>;
    coordinates: ZodOptional<
      ZodNullable<
        ZodObject<
          {
            coordinates: ZodArray<ZodNumber>;
            type: ZodLiteral<'Point'>;
          },
          $strip
        >
      >
    >;
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
    parkingRestrictions: ZodOptional<
      ZodNullable<
        ZodArray<
          ZodEnum<{
            Customers: 'Customers';
            Disabled: 'Disabled';
            EVOnly: 'EVOnly';
            Motorcycles: 'Motorcycles';
            Plugged: 'Plugged';
          }>
        >
      >
    >;
    protocol: ZodOptional<ZodNullable<ZodEnum<typeof OCPPVersion>>>;
    tenantId: ZodOptional<ZodNumber>;
    use16StatusNotification0: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.dto.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L45)

---

### ChargingStationOCPISchema

```ts
const ChargingStationOCPISchema: ZodObject<{
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
  connectors: ZodArray<ZodObject<{
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
  coordinates: ZodObject<{
     coordinates: ZodArray<ZodNumber>;
     type: ZodLiteral<"Point">;
  }, $strip>;
  createdAt: ZodOptional<ZodDate>;
  evses: ZodArray<ZodObject<{
     connectors: ZodOptional<ZodNullable<ZodArray<ZodObject<{
        connectorId: ZodNumber;
        createdAt: ZodOptional<...>;
        errorCode: ZodOptional<...>;
        evseId: ZodNumber;
        evseTypeConnectorId: ZodOptional<...>;
        format: ZodOptional<...>;
        id: ZodOptional<...>;
        info: ZodOptional<...>;
        maximumAmperage: ZodOptional<...>;
        maximumPowerWatts: ZodOptional<...>;
        maximumVoltage: ZodOptional<...>;
        powerType: ZodOptional<...>;
        stationId: ZodString;
        status: ZodOptional<...>;
        tariff: ZodOptional<...>;
        tariffId: ZodOptional<...>;
        tenant: ZodOptional<...>;
        tenantId: ZodOptional<...>;
        termsAndConditionsUrl: ZodOptional<...>;
        timestamp: ZodISODateTime;
        type: ZodOptional<...>;
        updatedAt: ZodOptional<...>;
        vendorErrorCode: ZodOptional<...>;
        vendorId: ZodOptional<...>;
     }, $strip>>>>;
     createdAt: ZodOptional<ZodDate>;
     evseId: ZodString;
     evseTypeId: ZodOptional<ZodNumber>;
     id: ZodOptional<ZodNumber>;
     physicalReference: ZodOptional<ZodNullable<ZodString>>;
     removed: ZodOptional<ZodBoolean>;
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
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>;
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
  updatedAt: ZodOptional<ZodDate>;
  use16StatusNotification0: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.dto.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L60)

---

### ChargingStationProps

```ts
const ChargingStationProps: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.dto.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L41)

#### Type Declaration

| Name                                                                          | Type                           | Defined in |
| ----------------------------------------------------------------------------- | ------------------------------ | ---------- |
| <a id="property-capabilities"></a> `capabilities`                             | `"capabilities"`               |            |
| <a id="property-chargeboxserialnumber"></a> `chargeBoxSerialNumber`           | `"chargeBoxSerialNumber"`      |            |
| <a id="property-chargepointmodel"></a> `chargePointModel`                     | `"chargePointModel"`           |            |
| <a id="property-chargepointserialnumber"></a> `chargePointSerialNumber`       | `"chargePointSerialNumber"`    |            |
| <a id="property-chargepointvendor"></a> `chargePointVendor`                   | `"chargePointVendor"`          |            |
| <a id="property-connectors"></a> `connectors`                                 | `"connectors"`                 |            |
| <a id="property-coordinates"></a> `coordinates`                               | `"coordinates"`                |            |
| <a id="property-createdat"></a> `createdAt`                                   | `"createdAt"`                  |            |
| <a id="property-evses"></a> `evses`                                           | `"evses"`                      |            |
| <a id="property-firmwareversion"></a> `firmwareVersion`                       | `"firmwareVersion"`            |            |
| <a id="property-floorlevel"></a> `floorLevel`                                 | `"floorLevel"`                 |            |
| <a id="property-iccid"></a> `iccid`                                           | `"iccid"`                      |            |
| <a id="property-id"></a> `id`                                                 | `"id"`                         |            |
| <a id="property-imsi"></a> `imsi`                                             | `"imsi"`                       |            |
| <a id="property-isonline"></a> `isOnline`                                     | `"isOnline"`                   |            |
| <a id="property-latestocppmessagetimestamp"></a> `latestOcppMessageTimestamp` | `"latestOcppMessageTimestamp"` |            |
| <a id="property-locationid"></a> `locationId`                                 | `"locationId"`                 |            |
| <a id="property-meterserialnumber"></a> `meterSerialNumber`                   | `"meterSerialNumber"`          |            |
| <a id="property-metertype"></a> `meterType`                                   | `"meterType"`                  |            |
| <a id="property-networkprofiles"></a> `networkProfiles`                       | `"networkProfiles"`            |            |
| <a id="property-parkingrestrictions"></a> `parkingRestrictions`               | `"parkingRestrictions"`        |            |
| <a id="property-protocol"></a> `protocol`                                     | `"protocol"`                   |            |
| <a id="property-tenant"></a> `tenant`                                         | `"tenant"`                     |            |
| <a id="property-tenantid"></a> `tenantId`                                     | `"tenantId"`                   |            |
| <a id="property-updatedat"></a> `updatedAt`                                   | `"updatedAt"`                  |            |
| <a id="property-use16statusnotification0"></a> `use16StatusNotification0`     | `"use16StatusNotification0"`   |            |

---

### ChargingStationSchema

```ts
const ChargingStationSchema: ZodObject<{
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
     errorCode: ZodOptional<ZodNullable<ZodDefault<ZodEnum<...>>>>;
     evse: ZodOptional<ZodAny>;
     evseId: ZodNumber;
     evseTypeConnectorId: ZodOptional<ZodNumber>;
     format: ZodOptional<ZodNullable<ZodEnum<{
        Cable: ...;
        Socket: ...;
     }>>>;
     id: ZodOptional<ZodNumber>;
     info: ZodOptional<ZodNullable<ZodString>>;
     maximumAmperage: ZodOptional<ZodNullable<ZodNumber>>;
     maximumPowerWatts: ZodOptional<ZodNullable<ZodNumber>>;
     maximumVoltage: ZodOptional<ZodNullable<ZodNumber>>;
     powerType: ZodOptional<ZodNullable<ZodEnum<{
        AC1Phase: ...;
        AC2Phase: ...;
        AC2PhaseSplit: ...;
        AC3Phase: ...;
        DC: ...;
     }>>>;
     stationId: ZodString;
     status: ZodOptional<ZodNullable<ZodDefault<ZodEnum<...>>>>;
     tariff: ZodOptional<ZodNullable<ZodObject<{
        authorizationAmount: ...;
        createdAt: ...;
        currency: ...;
        id: ...;
        paymentFee: ...;
        pricePerKwh: ...;
        pricePerMin: ...;
        pricePerSession: ...;
        tariffAltText: ...;
        taxRate: ...;
        tenant: ...;
        tenantId: ...;
        updatedAt: ...;
     }, $strip>>>;
     tariffId: ZodOptional<ZodNullable<ZodNumber>>;
     tenant: ZodOptional<ZodAny>;
     tenantId: ZodOptional<ZodNumber>;
     termsAndConditionsUrl: ZodOptional<ZodNullable<ZodString>>;
     timestamp: ZodISODateTime;
     type: ZodOptional<ZodNullable<ZodEnum<{
        CHAdeMO: ...;
        ChaoJi: ...;
        DomesticA: ...;
        DomesticB: ...;
        DomesticC: ...;
        DomesticD: ...;
        DomesticE: ...;
        DomesticF: ...;
        DomesticG: ...;
        DomesticH: ...;
        DomesticI: ...;
        DomesticJ: ...;
        DomesticK: ...;
        DomesticL: ...;
        DomesticM: ...;
        DomesticN: ...;
        DomesticO: ...;
        GBTAC: ...;
        GBTDC: ...;
        IEC603092Single16: ...;
        IEC603092Three16: ...;
        IEC603092Three32: ...;
        IEC603092Three64: ...;
        IEC62196T1: ...;
        IEC62196T1COMBO: ...;
        IEC62196T2: ...;
        IEC62196T2COMBO: ...;
        IEC62196T3A: ...;
        IEC62196T3C: ...;
        NEMA1030: ...;
        NEMA1050: ...;
        NEMA1430: ...;
        NEMA1450: ...;
        NEMA520: ...;
        NEMA630: ...;
        NEMA650: ...;
        PantographBottomUp: ...;
        PantographTopDown: ...;
        TeslaR: ...;
        TeslaS: ...;
     }>>>;
     updatedAt: ZodOptional<ZodDate>;
     vendorErrorCode: ZodOptional<ZodNullable<ZodString>>;
     vendorId: ZodOptional<ZodNullable<ZodString>>;
  }, $strip>>>>;
  coordinates: ZodOptional<ZodNullable<ZodObject<{
     coordinates: ZodArray<ZodNumber>;
     type: ZodLiteral<"Point">;
  }, $strip>>>;
  createdAt: ZodOptional<ZodDate>;
  evses: ZodOptional<ZodNullable<ZodArray<ZodObject<{
     connectors: ZodOptional<ZodNullable<ZodArray<ZodObject<..., ...>>>>;
     createdAt: ZodOptional<ZodDate>;
     evseId: ZodString;
     evseTypeId: ZodOptional<ZodNumber>;
     id: ZodOptional<ZodNumber>;
     physicalReference: ZodOptional<ZodNullable<ZodString>>;
     removed: ZodOptional<ZodBoolean>;
     stationId: ZodString;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<...>;
        createdAt: ZodOptional<...>;
        id: ZodOptional<...>;
        isUserTenant: ZodDefault<...>;
        name: ZodString;
        partyId: ZodOptional<...>;
        serverProfileOCPI: ZodOptional<...>;
        updatedAt: ZodOptional<...>;
        url: ZodOptional<...>;
     }, $strip>>;
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
  updatedAt: ZodOptional<ZodDate>;
  use16StatusNotification0: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.dto.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L16)

---

### chargingStationSchemas

```ts
const chargingStationSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/charging.station.dto.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L68)

#### Type Declaration

| Name                                                                | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Default value                 | Defined in                                                                                                                                                                                                |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-chargingstation"></a> `ChargingStation`             | `ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `ChargingPreferencesCapable`: `"ChargingPreferencesCapable"`; `ChargingProfileCapable`: `"ChargingProfileCapable"`; `ChipCardSupport`: `"ChipCardSupport"`; `ContactlessCardSupport`: `"ContactlessCardSupport"`; `CreditCardPayable`: `"CreditCardPayable"`; `DebitCardPayable`: `"DebitCardPayable"`; `PEDTerminal`: `"PEDTerminal"`; `RemoteStartStopCapable`: `"RemoteStartStopCapable"`; `Reservable`: `"Reservable"`; `RFIDReader`: `"RFIDReader"`; `StartSessionConnectorRequired`: `"StartSessionConnectorRequired"`; `TokenGroupCapable`: `"TokenGroupCapable"`; `UnlockCapable`: `"UnlockCapable"`; \}\>\>\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `chargingStation`: `ZodOptional`\<`ZodAny`\>; `connectorId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `errorCode`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<...\>\>\>; `evse`: `ZodOptional`\<`ZodAny`\>; `evseId`: `ZodNumber`; `evseTypeConnectorId`: `ZodOptional`\<`ZodNumber`\>; `format`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<...\>\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `info`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `maximumAmperage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumPowerWatts`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumVoltage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `powerType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<...\>\>\>; `stationId`: `ZodString`; `status`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<...\>\>\>; `tariff`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodAny`\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `termsAndConditionsUrl`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `timestamp`: `ZodISODateTime`; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `vendorErrorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `vendorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>\>\>; `coordinates`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `coordinates`: `ZodArray`\<`ZodNumber`\>; `type`: `ZodLiteral`\<`"Point"`\>; \}, `$strip`\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evses`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<...\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evseId`: `ZodString`; `evseTypeId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `physicalReference`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `removed`: `ZodOptional`\<`ZodBoolean`\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `networkProfiles`: `ZodOptional`\<`ZodAny`\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `Customers`: `"Customers"`; `Disabled`: `"Disabled"`; `EVOnly`: `"EVOnly"`; `Motorcycles`: `"Motorcycles"`; `Plugged`: `"Plugged"`; \}\>\>\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `ChargingStationSchema`       | [00_Base/src/interfaces/dto/charging.station.dto.ts:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L69) |
| <a id="property-chargingstationcreate"></a> `ChargingStationCreate` | `ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `ChargingPreferencesCapable`: `"ChargingPreferencesCapable"`; `ChargingProfileCapable`: `"ChargingProfileCapable"`; `ChipCardSupport`: `"ChipCardSupport"`; `ContactlessCardSupport`: `"ContactlessCardSupport"`; `CreditCardPayable`: `"CreditCardPayable"`; `DebitCardPayable`: `"DebitCardPayable"`; `PEDTerminal`: `"PEDTerminal"`; `RemoteStartStopCapable`: `"RemoteStartStopCapable"`; `Reservable`: `"Reservable"`; `RFIDReader`: `"RFIDReader"`; `StartSessionConnectorRequired`: `"StartSessionConnectorRequired"`; `TokenGroupCapable`: `"TokenGroupCapable"`; `UnlockCapable`: `"UnlockCapable"`; \}\>\>\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `coordinates`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `coordinates`: `ZodArray`\<`ZodNumber`\>; `type`: `ZodLiteral`\<`"Point"`\>; \}, `$strip`\>\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `Customers`: `"Customers"`; `Disabled`: `"Disabled"`; `EVOnly`: `"EVOnly"`; `Motorcycles`: `"Motorcycles"`; `Plugged`: `"Plugged"`; \}\>\>\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `ChargingStationCreateSchema` | [00_Base/src/interfaces/dto/charging.station.dto.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L70) |
| <a id="property-chargingstationocpi"></a> `ChargingStationOCPI`     | `ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `ChargingPreferencesCapable`: `"ChargingPreferencesCapable"`; `ChargingProfileCapable`: `"ChargingProfileCapable"`; `ChipCardSupport`: `"ChipCardSupport"`; `ContactlessCardSupport`: `"ContactlessCardSupport"`; `CreditCardPayable`: `"CreditCardPayable"`; `DebitCardPayable`: `"DebitCardPayable"`; `PEDTerminal`: `"PEDTerminal"`; `RemoteStartStopCapable`: `"RemoteStartStopCapable"`; `Reservable`: `"Reservable"`; `RFIDReader`: `"RFIDReader"`; `StartSessionConnectorRequired`: `"StartSessionConnectorRequired"`; `TokenGroupCapable`: `"TokenGroupCapable"`; `UnlockCapable`: `"UnlockCapable"`; \}\>\>\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connectors`: `ZodArray`\<`ZodObject`\<\{ `chargingStation`: `ZodOptional`\<`ZodAny`\>; `connectorId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `errorCode`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<\{ `ConnectorLockFailure`: ...; `EVCommunicationError`: ...; `GroundFailure`: ...; `HighTemperature`: ...; `InternalError`: ...; `LocalListConflict`: ...; `NoError`: ...; `OtherError`: ...; `OverCurrentFailure`: ...; `OverVoltage`: ...; `PowerMeterFailure`: ...; `PowerSwitchFailure`: ...; `ReaderFailure`: ...; `ResetFailure`: ...; `UnderVoltage`: ...; `WeakSignal`: ...; \}\>\>\>\>; `evse`: `ZodOptional`\<`ZodAny`\>; `evseId`: `ZodNumber`; `evseTypeConnectorId`: `ZodOptional`\<`ZodNumber`\>; `format`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Cable`: `"Cable"`; `Socket`: `"Socket"`; \}\>\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `info`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `maximumAmperage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumPowerWatts`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `maximumVoltage`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `powerType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `AC1Phase`: `"AC1Phase"`; `AC2Phase`: `"AC2Phase"`; `AC2PhaseSplit`: `"AC2PhaseSplit"`; `AC3Phase`: `"AC3Phase"`; `DC`: `"DC"`; \}\>\>\>; `stationId`: `ZodString`; `status`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodEnum`\<\{ `Available`: ...; `Charging`: ...; `Faulted`: ...; `Finishing`: ...; `Occupied`: ...; `Preparing`: ...; `Reserved`: ...; `SuspendedEV`: ...; `SuspendedEVSE`: ...; `Unavailable`: ...; `Unknown`: ...; \}\>\>\>\>; `tariff`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `authorizationAmount`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `currency`: `ZodString`; `id`: `ZodOptional`\<...\>; `paymentFee`: `ZodOptional`\<...\>; `pricePerKwh`: `ZodNumber`; `pricePerMin`: `ZodOptional`\<...\>; `pricePerSession`: `ZodOptional`\<...\>; `tariffAltText`: `ZodOptional`\<...\>; `taxRate`: `ZodOptional`\<...\>; `tenant`: `ZodOptional`\<...\>; `tenantId`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; \}, `$strip`\>\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodAny`\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `termsAndConditionsUrl`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `timestamp`: `ZodISODateTime`; `type`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `CHAdeMO`: `"CHAdeMO"`; `ChaoJi`: `"ChaoJi"`; `DomesticA`: `"DomesticA"`; `DomesticB`: `"DomesticB"`; `DomesticC`: `"DomesticC"`; `DomesticD`: `"DomesticD"`; `DomesticE`: `"DomesticE"`; `DomesticF`: `"DomesticF"`; `DomesticG`: `"DomesticG"`; `DomesticH`: `"DomesticH"`; `DomesticI`: `"DomesticI"`; `DomesticJ`: `"DomesticJ"`; `DomesticK`: `"DomesticK"`; `DomesticL`: `"DomesticL"`; `DomesticM`: `"DomesticM"`; `DomesticN`: `"DomesticN"`; `DomesticO`: `"DomesticO"`; `GBTAC`: `"GBTAC"`; `GBTDC`: `"GBTDC"`; `IEC603092Single16`: `"IEC603092Single16"`; `IEC603092Three16`: `"IEC603092Three16"`; `IEC603092Three32`: `"IEC603092Three32"`; `IEC603092Three64`: `"IEC603092Three64"`; `IEC62196T1`: `"IEC62196T1"`; `IEC62196T1COMBO`: `"IEC62196T1COMBO"`; `IEC62196T2`: `"IEC62196T2"`; `IEC62196T2COMBO`: `"IEC62196T2COMBO"`; `IEC62196T3A`: `"IEC62196T3A"`; `IEC62196T3C`: `"IEC62196T3C"`; `NEMA1030`: `"NEMA1030"`; `NEMA1050`: `"NEMA1050"`; `NEMA1430`: `"NEMA1430"`; `NEMA1450`: `"NEMA1450"`; `NEMA520`: `"NEMA520"`; `NEMA630`: `"NEMA630"`; `NEMA650`: `"NEMA650"`; `PantographBottomUp`: `"PantographBottomUp"`; `PantographTopDown`: `"PantographTopDown"`; `TeslaR`: `"TeslaR"`; `TeslaS`: `"TeslaS"`; \}\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `vendorErrorCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `vendorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `coordinates`: `ZodObject`\<\{ `coordinates`: `ZodArray`\<`ZodNumber`\>; `type`: `ZodLiteral`\<`"Point"`\>; \}, `$strip`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evses`: `ZodArray`\<`ZodObject`\<\{ `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `connectorId`: ...; `createdAt`: ...; `errorCode`: ...; `evseId`: ...; `evseTypeConnectorId`: ...; `format`: ...; `id`: ...; `info`: ...; `maximumAmperage`: ...; `maximumPowerWatts`: ...; `maximumVoltage`: ...; `powerType`: ...; `stationId`: ...; `status`: ...; `tariff`: ...; `tariffId`: ...; `tenant`: ...; `tenantId`: ...; `termsAndConditionsUrl`: ...; `timestamp`: ...; `type`: ...; `updatedAt`: ...; `vendorErrorCode`: ...; `vendorId`: ...; \}, `$strip`\>\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evseId`: `ZodString`; `evseTypeId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `physicalReference`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `removed`: `ZodOptional`\<`ZodBoolean`\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `networkProfiles`: `ZodOptional`\<`ZodAny`\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `Customers`: `"Customers"`; `Disabled`: `"Disabled"`; `EVOnly`: `"EVOnly"`; `Motorcycles`: `"Motorcycles"`; `Plugged`: `"Plugged"`; \}\>\>\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<_typeof_ [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; \}, `$strip`\> | `ChargingStationOCPISchema`   | [00_Base/src/interfaces/dto/charging.station.dto.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/charging.station.dto.ts#L71) |
