[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 01_Data/src/layers/sequelize/mapper/2.0.1/LocationMapper

# 01_Data/src/layers/sequelize/mapper/2.0.1/LocationMapper

## Classes

### LocationMapper

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/LocationMapper.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/LocationMapper.ts#L8)

#### Constructors

##### Constructor

```ts
new LocationMapper(): LocationMapper;
```

###### Returns

[`LocationMapper`](#locationmapper)

#### Methods

##### mapConnectorStatus()

```ts
static mapConnectorStatus(status):
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

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/LocationMapper.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/LocationMapper.ts#L9)

###### Parameters

| Parameter | Type                      |
| --------- | ------------------------- |
| `status`  | `ConnectorStatusEnumType` |

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
