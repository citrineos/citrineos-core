[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/util/idGenerator

# 02_Util/src/util/idGenerator

## Classes

### IdGenerator

Defined in: [02_Util/src/util/idGenerator.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/idGenerator.ts#L7)

#### Constructors

##### Constructor

```ts
new IdGenerator(stationSequenceRepository): IdGenerator;
```

Defined in: [02_Util/src/util/idGenerator.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/idGenerator.ts#L10)

###### Parameters

| Parameter                   | Type                                 |
| --------------------------- | ------------------------------------ |
| `stationSequenceRepository` | `IChargingStationSequenceRepository` |

###### Returns

[`IdGenerator`](#idgenerator)

#### Properties

| Property                                                             | Modifier  | Type                                 | Defined in                                                                                                                                                        |
| -------------------------------------------------------------------- | --------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_stationsequencerepository"></a> `_stationSequenceRepository` | `private` | `IChargingStationSequenceRepository` | [02_Util/src/util/idGenerator.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/idGenerator.ts#L8) |

#### Methods

##### generateRequestId()

```ts
generateRequestId(
   tenantId,
   stationId,
type): Promise<number>;
```

Defined in: [02_Util/src/util/idGenerator.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/idGenerator.ts#L14)

###### Parameters

| Parameter   | Type                                                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenantId`  | `number`                                                                                                                                                                                                                                              |
| `stationId` | `string`                                                                                                                                                                                                                                              |
| `type`      | \| `"transactionId"` \| `"remoteStartId"` \| `"customerInformation"` \| `"getBaseReport"` \| `"getChargingProfiles"` \| `"getDisplayMessages"` \| `"getLog"` \| `"getMonitoringReport"` \| `"getReport"` \| `"publishFirmware"` \| `"updateFirmware"` |

###### Returns

`Promise`\<`number`\>
