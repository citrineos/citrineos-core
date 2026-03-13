[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 01_Data/src/layers/sequelize/mapper/1.6/LocationMapper

# 01_Data/src/layers/sequelize/mapper/1.6/LocationMapper

## Classes

### LocationMapper

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/LocationMapper.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/LocationMapper.ts#L8)

#### Constructors

##### Constructor

```ts
new LocationMapper(): LocationMapper;
```

###### Returns

[`LocationMapper`](#locationmapper)

#### Methods

##### mapStatusNotificationRequestErrorCodeToConnectorErrorCode()

```ts
static mapStatusNotificationRequestErrorCodeToConnectorErrorCode(errorCode):
  | "ConnectorLockFailure"
  | "EVCommunicationError"
  | "GroundFailure"
  | "HighTemperature"
  | "InternalError"
  | "LocalListConflict"
  | "NoError"
  | "OtherError"
  | "OverCurrentFailure"
  | "PowerMeterFailure"
  | "PowerSwitchFailure"
  | "ReaderFailure"
  | "ResetFailure"
  | "UnderVoltage"
  | "OverVoltage"
  | "WeakSignal";
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/LocationMapper.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/LocationMapper.ts#L36)

###### Parameters

| Parameter   | Type                                 |
| ----------- | ------------------------------------ |
| `errorCode` | `StatusNotificationRequestErrorCode` |

###### Returns

\| `"ConnectorLockFailure"`
\| `"EVCommunicationError"`
\| `"GroundFailure"`
\| `"HighTemperature"`
\| `"InternalError"`
\| `"LocalListConflict"`
\| `"NoError"`
\| `"OtherError"`
\| `"OverCurrentFailure"`
\| `"PowerMeterFailure"`
\| `"PowerSwitchFailure"`
\| `"ReaderFailure"`
\| `"ResetFailure"`
\| `"UnderVoltage"`
\| `"OverVoltage"`
\| `"WeakSignal"`

##### mapStatusNotificationRequestStatusToConnectorStatus()

```ts
static mapStatusNotificationRequestStatusToConnectorStatus(status):
  | "Unknown"
  | "Charging"
  | "Faulted"
  | "Unavailable"
  | "Available"
  | "SuspendedEV"
  | "SuspendedEVSE"
  | "Occupied"
  | "Reserved"
  | "Preparing"
  | "Finishing";
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/LocationMapper.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/LocationMapper.ts#L9)

###### Parameters

| Parameter | Type                              |
| --------- | --------------------------------- |
| `status`  | `StatusNotificationRequestStatus` |

###### Returns

\| `"Unknown"`
\| `"Charging"`
\| `"Faulted"`
\| `"Unavailable"`
\| `"Available"`
\| `"SuspendedEV"`
\| `"SuspendedEVSE"`
\| `"Occupied"`
\| `"Reserved"`
\| `"Preparing"`
\| `"Finishing"`
