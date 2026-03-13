[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/transaction.event.dto

# 00_Base/src/interfaces/dto/transaction.event.dto

## Type Aliases

### TransactionEventCreate

```ts
type TransactionEventCreate = z.infer<typeof TransactionEventCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/transaction.event.dto.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.event.dto.ts#L46)

---

### TransactionEventDto

```ts
type TransactionEventDto = z.infer<typeof TransactionEventSchema>;
```

Defined in: [00_Base/src/interfaces/dto/transaction.event.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.event.dto.ts#L34)

## Variables

### TransactionEventCreateSchema

```ts
const TransactionEventCreateSchema: ZodObject<
  {
    cableMaxCurrent: ZodOptional<ZodNullable<ZodNumber>>;
    eventType: ZodEnum<{
      Ended: 'Ended';
      Started: 'Started';
      Updated: 'Updated';
    }>;
    evseId: ZodOptional<ZodNullable<ZodNumber>>;
    idTokenType: ZodOptional<ZodNullable<ZodString>>;
    idTokenValue: ZodOptional<ZodNullable<ZodString>>;
    numberOfPhasesUsed: ZodOptional<ZodNullable<ZodNumber>>;
    offline: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
    reservationId: ZodOptional<ZodNullable<ZodNumber>>;
    seqNo: ZodNumber;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    timestamp: ZodISODateTime;
    transactionDatabaseId: ZodOptional<ZodNumber>;
    transactionInfo: ZodOptional<
      ZodObject<
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
      >
    >;
    triggerReason: ZodEnum<{
      AbnormalCondition: 'AbnormalCondition';
      Authorized: 'Authorized';
      CablePluggedIn: 'CablePluggedIn';
      ChargingRateChanged: 'ChargingRateChanged';
      ChargingStateChanged: 'ChargingStateChanged';
      Deauthorized: 'Deauthorized';
      EnergyLimitReached: 'EnergyLimitReached';
      EVCommunicationLost: 'EVCommunicationLost';
      EVConnectTimeout: 'EVConnectTimeout';
      EVDeparted: 'EVDeparted';
      EVDetected: 'EVDetected';
      MeterValueClock: 'MeterValueClock';
      MeterValuePeriodic: 'MeterValuePeriodic';
      RemoteStart: 'RemoteStart';
      RemoteStop: 'RemoteStop';
      ResetCommand: 'ResetCommand';
      SignedDataReceived: 'SignedDataReceived';
      StopAuthorized: 'StopAuthorized';
      TimeLimitReached: 'TimeLimitReached';
      Trigger: 'Trigger';
      UnlockCommand: 'UnlockCommand';
    }>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/transaction.event.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.event.dto.ts#L36)

---

### TransactionEventProps

```ts
const TransactionEventProps: object;
```

Defined in: [00_Base/src/interfaces/dto/transaction.event.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.event.dto.ts#L32)

#### Type Declaration

| Name                                                                | Type                      | Defined in |
| ------------------------------------------------------------------- | ------------------------- | ---------- |
| <a id="property-cablemaxcurrent"></a> `cableMaxCurrent`             | `"cableMaxCurrent"`       |            |
| <a id="property-createdat"></a> `createdAt`                         | `"createdAt"`             |            |
| <a id="property-eventtype"></a> `eventType`                         | `"eventType"`             |            |
| <a id="property-evse"></a> `evse`                                   | `"evse"`                  |            |
| <a id="property-evseid"></a> `evseId`                               | `"evseId"`                |            |
| <a id="property-id"></a> `id`                                       | `"id"`                    |            |
| <a id="property-idtokentype"></a> `idTokenType`                     | `"idTokenType"`           |            |
| <a id="property-idtokenvalue"></a> `idTokenValue`                   | `"idTokenValue"`          |            |
| <a id="property-metervalue"></a> `meterValue`                       | `"meterValue"`            |            |
| <a id="property-numberofphasesused"></a> `numberOfPhasesUsed`       | `"numberOfPhasesUsed"`    |            |
| <a id="property-offline"></a> `offline`                             | `"offline"`               |            |
| <a id="property-reservationid"></a> `reservationId`                 | `"reservationId"`         |            |
| <a id="property-seqno"></a> `seqNo`                                 | `"seqNo"`                 |            |
| <a id="property-stationid"></a> `stationId`                         | `"stationId"`             |            |
| <a id="property-tenant"></a> `tenant`                               | `"tenant"`                |            |
| <a id="property-tenantid"></a> `tenantId`                           | `"tenantId"`              |            |
| <a id="property-timestamp"></a> `timestamp`                         | `"timestamp"`             |            |
| <a id="property-transactiondatabaseid"></a> `transactionDatabaseId` | `"transactionDatabaseId"` |            |
| <a id="property-transactioninfo"></a> `transactionInfo`             | `"transactionInfo"`       |            |
| <a id="property-triggerreason"></a> `triggerReason`                 | `"triggerReason"`         |            |
| <a id="property-updatedat"></a> `updatedAt`                         | `"updatedAt"`             |            |

---

### TransactionEventSchema

```ts
const TransactionEventSchema: ZodObject<{
  cableMaxCurrent: ZodOptional<ZodNullable<ZodNumber>>;
  createdAt: ZodOptional<ZodDate>;
  eventType: ZodEnum<{
     Ended: "Ended";
     Started: "Started";
     Updated: "Updated";
  }>;
  evse: ZodOptional<ZodObject<{
     connectorId: ZodOptional<ZodNullable<ZodNumber>>;
     createdAt: ZodOptional<ZodDate>;
     databaseId: ZodOptional<ZodNumber>;
     id: ZodNumber;
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
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>;
  evseId: ZodOptional<ZodNullable<ZodNumber>>;
  id: ZodOptional<ZodNumber>;
  idTokenType: ZodOptional<ZodNullable<ZodString>>;
  idTokenValue: ZodOptional<ZodNullable<ZodString>>;
  meterValue: ZodOptional<ZodTuple<[ZodObject<{
     connectorId: ZodOptional<ZodNumber>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     sampledValue: ZodTuple<[ZodObject<{
        context: ...;
        location: ...;
        measurand: ...;
        phase: ...;
        signedMeterValue: ...;
        unitOfMeasure: ...;
        value: ...;
      }, $strip>], ZodObject<{
        context: ZodOptional<...>;
        location: ZodOptional<...>;
        measurand: ZodOptional<...>;
        phase: ZodOptional<...>;
        signedMeterValue: ZodOptional<...>;
        unitOfMeasure: ZodOptional<...>;
        value: ZodNumber;
     }, $strip>>;
     tariffId: ZodOptional<ZodNullable<ZodNumber>>;
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
     timestamp: ZodISODateTime;
     transactionDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
     transactionEventId: ZodOptional<ZodNullable<ZodNumber>>;
     transactionId: ZodOptional<ZodNullable<ZodString>>;
     updatedAt: ZodOptional<ZodDate>;
   }, $strip>], ZodObject<{
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
  numberOfPhasesUsed: ZodOptional<ZodNullable<ZodNumber>>;
  offline: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
  reservationId: ZodOptional<ZodNullable<ZodNumber>>;
  seqNo: ZodNumber;
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
  transactionDatabaseId: ZodOptional<ZodNumber>;
  transactionInfo: ZodOptional<ZodObject<{
     chargingState: ZodOptional<ZodNullable<ZodEnum<{
        Charging: "Charging";
        EVConnected: "EVConnected";
        Idle: "Idle";
        SuspendedEV: "SuspendedEV";
        SuspendedEVSE: "SuspendedEVSE";
     }>>>;
     remoteStartId: ZodOptional<ZodNullable<ZodNumber>>;
     stoppedReason: ZodOptional<ZodNullable<ZodEnum<{
        DeAuthorized: "DeAuthorized";
        EmergencyStop: "EmergencyStop";
        EnergyLimitReached: "EnergyLimitReached";
        EVDisconnected: "EVDisconnected";
        GroundFault: "GroundFault";
        ImmediateReset: "ImmediateReset";
        Local: "Local";
        LocalOutOfCredit: "LocalOutOfCredit";
        MasterPass: "MasterPass";
        Other: "Other";
        OvercurrentFault: "OvercurrentFault";
        PowerLoss: "PowerLoss";
        PowerQuality: "PowerQuality";
        Reboot: "Reboot";
        Remote: "Remote";
        SOCLimitReached: "SOCLimitReached";
        StoppedByEV: "StoppedByEV";
        TimeLimitReached: "TimeLimitReached";
        Timeout: "Timeout";
     }>>>;
     timeSpentCharging: ZodOptional<ZodNullable<ZodNumber>>;
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
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/transaction.event.dto.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.event.dto.ts#L12)

---

### transactionEventSchemas

```ts
const transactionEventSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/transaction.event.dto.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.event.dto.ts#L48)

#### Type Declaration

| Name                                                                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Default value                  | Defined in                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-transactionevent"></a> `TransactionEvent`             | `ZodObject`\<\{ `cableMaxCurrent`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `eventType`: `ZodEnum`\<\{ `Ended`: `"Ended"`; `Started`: `"Started"`; `Updated`: `"Updated"`; \}\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `idTokenType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `idTokenValue`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterValue`: `ZodOptional`\<`ZodTuple`\<\[`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNumber`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `sampledValue`: `ZodTuple`\<\[`ZodObject`\<..., ...\>\], `ZodObject`\<\{ `context`: ...; `location`: ...; `measurand`: ...; `phase`: ...; `signedMeterValue`: ...; `unitOfMeasure`: ...; `value`: ...; \}, `$strip`\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionEventId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\], `ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNumber`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `sampledValue`: `ZodTuple`\<\[`ZodObject`\<\{ `context`: ...; `location`: ...; `measurand`: ...; `phase`: ...; `signedMeterValue`: ...; `unitOfMeasure`: ...; `value`: ...; \}, `$strip`\>\], `ZodObject`\<\{ `context`: `ZodOptional`\<...\>; `location`: `ZodOptional`\<...\>; `measurand`: `ZodOptional`\<...\>; `phase`: `ZodOptional`\<...\>; `signedMeterValue`: `ZodOptional`\<...\>; `unitOfMeasure`: `ZodOptional`\<...\>; `value`: `ZodNumber`; \}, `$strip`\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionEventId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `numberOfPhasesUsed`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `offline`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `reservationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `seqNo`: `ZodNumber`; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `transactionInfo`: `ZodOptional`\<`ZodObject`\<\{ `chargingState`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Charging`: `"Charging"`; `EVConnected`: `"EVConnected"`; `Idle`: `"Idle"`; `SuspendedEV`: `"SuspendedEV"`; `SuspendedEVSE`: `"SuspendedEVSE"`; \}\>\>\>; `remoteStartId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `stoppedReason`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `DeAuthorized`: `"DeAuthorized"`; `EmergencyStop`: `"EmergencyStop"`; `EnergyLimitReached`: `"EnergyLimitReached"`; `EVDisconnected`: `"EVDisconnected"`; `GroundFault`: `"GroundFault"`; `ImmediateReset`: `"ImmediateReset"`; `Local`: `"Local"`; `LocalOutOfCredit`: `"LocalOutOfCredit"`; `MasterPass`: `"MasterPass"`; `Other`: `"Other"`; `OvercurrentFault`: `"OvercurrentFault"`; `PowerLoss`: `"PowerLoss"`; `PowerQuality`: `"PowerQuality"`; `Reboot`: `"Reboot"`; `Remote`: `"Remote"`; `SOCLimitReached`: `"SOCLimitReached"`; `StoppedByEV`: `"StoppedByEV"`; `TimeLimitReached`: `"TimeLimitReached"`; `Timeout`: `"Timeout"`; \}\>\>\>; `timeSpentCharging`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionId`: `ZodString`; \}, `$strip`\>\>; `triggerReason`: `ZodEnum`\<\{ `AbnormalCondition`: `"AbnormalCondition"`; `Authorized`: `"Authorized"`; `CablePluggedIn`: `"CablePluggedIn"`; `ChargingRateChanged`: `"ChargingRateChanged"`; `ChargingStateChanged`: `"ChargingStateChanged"`; `Deauthorized`: `"Deauthorized"`; `EnergyLimitReached`: `"EnergyLimitReached"`; `EVCommunicationLost`: `"EVCommunicationLost"`; `EVConnectTimeout`: `"EVConnectTimeout"`; `EVDeparted`: `"EVDeparted"`; `EVDetected`: `"EVDetected"`; `MeterValueClock`: `"MeterValueClock"`; `MeterValuePeriodic`: `"MeterValuePeriodic"`; `RemoteStart`: `"RemoteStart"`; `RemoteStop`: `"RemoteStop"`; `ResetCommand`: `"ResetCommand"`; `SignedDataReceived`: `"SignedDataReceived"`; `StopAuthorized`: `"StopAuthorized"`; `TimeLimitReached`: `"TimeLimitReached"`; `Trigger`: `"Trigger"`; `UnlockCommand`: `"UnlockCommand"`; \}\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `TransactionEventSchema`       | [00_Base/src/interfaces/dto/transaction.event.dto.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.event.dto.ts#L49) |
| <a id="property-transactioneventcreate"></a> `TransactionEventCreate` | `ZodObject`\<\{ `cableMaxCurrent`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `eventType`: `ZodEnum`\<\{ `Ended`: `"Ended"`; `Started`: `"Started"`; `Updated`: `"Updated"`; \}\>; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `idTokenType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `idTokenValue`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `numberOfPhasesUsed`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `offline`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<`ZodBoolean`\>\>\>; `reservationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `seqNo`: `ZodNumber`; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodOptional`\<`ZodNumber`\>; `transactionInfo`: `ZodOptional`\<`ZodObject`\<\{ `chargingState`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Charging`: `"Charging"`; `EVConnected`: `"EVConnected"`; `Idle`: `"Idle"`; `SuspendedEV`: `"SuspendedEV"`; `SuspendedEVSE`: `"SuspendedEVSE"`; \}\>\>\>; `remoteStartId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `stoppedReason`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `DeAuthorized`: `"DeAuthorized"`; `EmergencyStop`: `"EmergencyStop"`; `EnergyLimitReached`: `"EnergyLimitReached"`; `EVDisconnected`: `"EVDisconnected"`; `GroundFault`: `"GroundFault"`; `ImmediateReset`: `"ImmediateReset"`; `Local`: `"Local"`; `LocalOutOfCredit`: `"LocalOutOfCredit"`; `MasterPass`: `"MasterPass"`; `Other`: `"Other"`; `OvercurrentFault`: `"OvercurrentFault"`; `PowerLoss`: `"PowerLoss"`; `PowerQuality`: `"PowerQuality"`; `Reboot`: `"Reboot"`; `Remote`: `"Remote"`; `SOCLimitReached`: `"SOCLimitReached"`; `StoppedByEV`: `"StoppedByEV"`; `TimeLimitReached`: `"TimeLimitReached"`; `Timeout`: `"Timeout"`; \}\>\>\>; `timeSpentCharging`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionId`: `ZodString`; \}, `$strip`\>\>; `triggerReason`: `ZodEnum`\<\{ `AbnormalCondition`: `"AbnormalCondition"`; `Authorized`: `"Authorized"`; `CablePluggedIn`: `"CablePluggedIn"`; `ChargingRateChanged`: `"ChargingRateChanged"`; `ChargingStateChanged`: `"ChargingStateChanged"`; `Deauthorized`: `"Deauthorized"`; `EnergyLimitReached`: `"EnergyLimitReached"`; `EVCommunicationLost`: `"EVCommunicationLost"`; `EVConnectTimeout`: `"EVConnectTimeout"`; `EVDeparted`: `"EVDeparted"`; `EVDetected`: `"EVDetected"`; `MeterValueClock`: `"MeterValueClock"`; `MeterValuePeriodic`: `"MeterValuePeriodic"`; `RemoteStart`: `"RemoteStart"`; `RemoteStop`: `"RemoteStop"`; `ResetCommand`: `"ResetCommand"`; `SignedDataReceived`: `"SignedDataReceived"`; `StopAuthorized`: `"StopAuthorized"`; `TimeLimitReached`: `"TimeLimitReached"`; `Trigger`: `"Trigger"`; `UnlockCommand`: `"UnlockCommand"`; \}\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `TransactionEventCreateSchema` | [00_Base/src/interfaces/dto/transaction.event.dto.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/transaction.event.dto.ts#L50) |
