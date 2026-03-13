[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/EVDriver/src/module/LocalAuthListService

# 03_Modules/EVDriver/src/module/LocalAuthListService

## Classes

### LocalAuthListService

Defined in: [03_Modules/EVDriver/src/module/LocalAuthListService.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/LocalAuthListService.ts#L14)

#### Constructors

##### Constructor

```ts
new LocalAuthListService(localAuthListRepository, deviceModelRepository): LocalAuthListService;
```

Defined in: [03_Modules/EVDriver/src/module/LocalAuthListService.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/LocalAuthListService.ts#L18)

###### Parameters

| Parameter                 | Type                       |
| ------------------------- | -------------------------- |
| `localAuthListRepository` | `ILocalAuthListRepository` |
| `deviceModelRepository`   | `IDeviceModelRepository`   |

###### Returns

[`LocalAuthListService`](#localauthlistservice)

#### Properties

| Property                                                         | Modifier    | Type                       | Defined in                                                                                                                                                                                                        |
| ---------------------------------------------------------------- | ----------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_devicemodelrepository"></a> `_deviceModelRepository`     | `protected` | `IDeviceModelRepository`   | [03_Modules/EVDriver/src/module/LocalAuthListService.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/LocalAuthListService.ts#L16) |
| <a id="_localauthlistrepository"></a> `_localAuthListRepository` | `protected` | `ILocalAuthListRepository` | [03_Modules/EVDriver/src/module/LocalAuthListService.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/LocalAuthListService.ts#L15) |

#### Methods

##### countUpdatedAuthListFromRequestAndCurrentVersion()

```ts
private countUpdatedAuthListFromRequestAndCurrentVersion(sendLocalList, localListVersion?): Promise<number>;
```

Defined in: [03_Modules/EVDriver/src/module/LocalAuthListService.ts:129](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/LocalAuthListService.ts#L129)

###### Parameters

| Parameter           | Type               |
| ------------------- | ------------------ |
| `sendLocalList`     | `SendLocalList`    |
| `localListVersion?` | `LocalListVersion` |

###### Returns

`Promise`\<`number`\>

##### createSendLocalListFromStationIdAndRequestAndCurrentVersion()

```ts
private createSendLocalListFromStationIdAndRequestAndCurrentVersion(
   tenantId,
   stationId,
   correlationId,
   sendLocalListRequest,
localListVersion?): Promise<SendLocalList>;
```

Defined in: [03_Modules/EVDriver/src/module/LocalAuthListService.ts:87](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/LocalAuthListService.ts#L87)

###### Parameters

| Parameter              | Type                   |
| ---------------------- | ---------------------- |
| `tenantId`             | `number`               |
| `stationId`            | `string`               |
| `correlationId`        | `string`               |
| `sendLocalListRequest` | `SendLocalListRequest` |
| `localListVersion?`    | `LocalListVersion`     |

###### Returns

`Promise`\<`SendLocalList`\>

##### getItemsPerMessageSendLocalListByStationId()

```ts
private getItemsPerMessageSendLocalListByStationId(tenantId, stationId): Promise<number | null>;
```

Defined in: [03_Modules/EVDriver/src/module/LocalAuthListService.ts:150](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/LocalAuthListService.ts#L150)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`number` \| `null`\>

##### getMaxLocalAuthListEntries()

```ts
private getMaxLocalAuthListEntries(tenantId): Promise<number | null>;
```

Defined in: [03_Modules/EVDriver/src/module/LocalAuthListService.ts:171](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/LocalAuthListService.ts#L171)

###### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `tenantId` | `number` |

###### Returns

`Promise`\<`number` \| `null`\>

##### persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest()

```ts
persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
   tenantId,
   stationId,
   correlationId,
sendLocalListRequest): Promise<SendLocalList>;
```

Defined in: [03_Modules/EVDriver/src/module/LocalAuthListService.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/LocalAuthListService.ts#L34)

Validates a SendLocalListRequest and persists it, then returns the correlation Id.

###### Parameters

| Parameter              | Type                   | Description                                                        |
| ---------------------- | ---------------------- | ------------------------------------------------------------------ |
| `tenantId`             | `number`               | -                                                                  |
| `stationId`            | `string`               | The ID of the station to which the SendLocalListRequest belongs.   |
| `correlationId`        | `string`               | The correlation Id that will be used for the SendLocalListRequest. |
| `sendLocalListRequest` | `SendLocalListRequest` | The SendLocalListRequest to validate and persist.                  |

###### Returns

`Promise`\<`SendLocalList`\>

The persisted SendLocalList.
