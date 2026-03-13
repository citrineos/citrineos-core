[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/Reporting/src/module/services

# 03_Modules/Reporting/src/module/services

## Classes

### DeviceModelService

Defined in: [03_Modules/Reporting/src/module/services.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Reporting/src/module/services.ts#L8)

#### Constructors

##### Constructor

```ts
new DeviceModelService(deviceModelRepository): DeviceModelService;
```

Defined in: [03_Modules/Reporting/src/module/services.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Reporting/src/module/services.ts#L11)

###### Parameters

| Parameter               | Type                     |
| ----------------------- | ------------------------ |
| `deviceModelRepository` | `IDeviceModelRepository` |

###### Returns

[`DeviceModelService`](#devicemodelservice)

#### Properties

| Property                                                     | Modifier    | Type                     | Defined in                                                                                                                                                                                |
| ------------------------------------------------------------ | ----------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_devicemodelrepository"></a> `_deviceModelRepository` | `protected` | `IDeviceModelRepository` | [03_Modules/Reporting/src/module/services.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Reporting/src/module/services.ts#L9) |

#### Methods

##### getBytesPerMessageByComponentAndVariableInstanceAndStationId()

```ts
getBytesPerMessageByComponentAndVariableInstanceAndStationId(
   componentName,
   variableInstance,
   tenantId,
stationId): Promise<number | null>;
```

Defined in: [03_Modules/Reporting/src/module/services.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Reporting/src/module/services.ts#L56)

Fetches the BytesPerMessage attribute from the device model.
Returns null if no such attribute exists.
It is possible for there to be multiple BytesPerMessage attributes if component instances or evses
are associated with alternate options. That structure is not supported by this logic, and that
structure is a violation of Part 2 - Specification of OCPP 2.0.1.
In that case, the first attribute will be returned.

###### Parameters

| Parameter          | Type     | Description                  |
| ------------------ | -------- | ---------------------------- |
| `componentName`    | `string` | -                            |
| `variableInstance` | `string` | -                            |
| `tenantId`         | `number` | -                            |
| `stationId`        | `string` | Charging station identifier. |

###### Returns

`Promise`\<`number` \| `null`\>

BytesPerMessage as a number or null if no such attribute exists.

##### getItemsPerMessageByComponentAndVariableInstanceAndStationId()

```ts
getItemsPerMessageByComponentAndVariableInstanceAndStationId(
   componentName,
   variableInstance,
   tenantId,
stationId): Promise<number | null>;
```

Defined in: [03_Modules/Reporting/src/module/services.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Reporting/src/module/services.ts#L21)

Fetches the ItemsPerMessage attribute from the device model.
Returns null if no such attribute exists.

###### Parameters

| Parameter          | Type     | Description                  |
| ------------------ | -------- | ---------------------------- |
| `componentName`    | `string` | -                            |
| `variableInstance` | `string` | -                            |
| `tenantId`         | `number` | -                            |
| `stationId`        | `string` | Charging station identifier. |

###### Returns

`Promise`\<`number` \| `null`\>

ItemsPerMessage as a number or null if no such attribute exists.
