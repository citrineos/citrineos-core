[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/Configuration/src/module/DeviceModelService

# 03_Modules/Configuration/src/module/DeviceModelService

## Classes

### DeviceModelService

Defined in: [03_Modules/Configuration/src/module/DeviceModelService.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DeviceModelService.ts#L9)

#### Constructors

##### Constructor

```ts
new DeviceModelService(deviceModelRepository): DeviceModelService;
```

Defined in: [03_Modules/Configuration/src/module/DeviceModelService.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DeviceModelService.ts#L12)

###### Parameters

| Parameter               | Type                     |
| ----------------------- | ------------------------ |
| `deviceModelRepository` | `IDeviceModelRepository` |

###### Returns

[`DeviceModelService`](#devicemodelservice)

#### Properties

| Property                                                     | Modifier    | Type                     | Defined in                                                                                                                                                                                                              |
| ------------------------------------------------------------ | ----------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_devicemodelrepository"></a> `_deviceModelRepository` | `protected` | `IDeviceModelRepository` | [03_Modules/Configuration/src/module/DeviceModelService.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DeviceModelService.ts#L10) |

#### Methods

##### getItemsPerMessageGetVariablesByStationId()

```ts
getItemsPerMessageGetVariablesByStationId(tenantId, stationId): Promise<number | null>;
```

Defined in: [03_Modules/Configuration/src/module/DeviceModelService.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DeviceModelService.ts#L61)

Fetches the ItemsPerMessageGetVariables attribute from the device model.
Returns null if no such attribute exists.
It is possible for there to be multiple ItemsPerMessageGetVariables attributes if component instances or evses
are associated with alternate options. That structure is not supported by this logic, and that
structure is a violation of Part 2 - Specification of OCPP 2.0.1.
In that case, the first attribute will be returned.

###### Parameters

| Parameter   | Type     | Description                  |
| ----------- | -------- | ---------------------------- |
| `tenantId`  | `number` | -                            |
| `stationId` | `string` | Charging station identifier. |

###### Returns

`Promise`\<`number` \| `null`\>

ItemsPerMessageGetVariables as a number or null if no such attribute exists.

##### getItemsPerMessageSetVariablesByStationId()

```ts
getItemsPerMessageSetVariablesByStationId(tenantId, stationId): Promise<number | null>;
```

Defined in: [03_Modules/Configuration/src/module/DeviceModelService.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DeviceModelService.ts#L27)

Fetches the ItemsPerMessageSetVariables attribute from the device model.
Returns null if no such attribute exists.
It is possible for there to be multiple ItemsPerMessageSetVariables attributes if component instances or evses
are associated with alternate options. That structure is not supported by this logic, and that
structure is a violation of Part 2 - Specification of OCPP 2.0.1.
In that case, the first attribute will be returned.

###### Parameters

| Parameter   | Type     | Description                  |
| ----------- | -------- | ---------------------------- |
| `tenantId`  | `number` | -                            |
| `stationId` | `string` | Charging station identifier. |

###### Returns

`Promise`\<`number` \| `null`\>

ItemsPerMessageSetVariables as a number or null if no such attribute exists.

##### updateDeviceModel()

```ts
updateDeviceModel(
   chargingStation,
   tenantId,
   stationId,
timestamp): Promise<void>;
```

Defined in: [03_Modules/Configuration/src/module/DeviceModelService.ts:84](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DeviceModelService.ts#L84)

###### Parameters

| Parameter         | Type     |
| ----------------- | -------- |
| `chargingStation` | `any`    |
| `tenantId`        | `number` |
| `stationId`       | `string` |
| `timestamp`       | `string` |

###### Returns

`Promise`\<`void`\>
