[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/Transactions/src/module/StatusNotificationService

# 03_Modules/Transactions/src/module/StatusNotificationService

## Classes

### StatusNotificationService

Defined in: [03_Modules/Transactions/src/module/StatusNotificationService.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/StatusNotificationService.ts#L19)

#### Constructors

##### Constructor

```ts
new StatusNotificationService(
   componentRepository,
   deviceModelRepository,
   locationRepository,
   logger?): StatusNotificationService;
```

Defined in: [03_Modules/Transactions/src/module/StatusNotificationService.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/StatusNotificationService.ts#L25)

###### Parameters

| Parameter               | Type                            |
| ----------------------- | ------------------------------- |
| `componentRepository`   | `CrudRepository`\<`Component`\> |
| `deviceModelRepository` | `IDeviceModelRepository`        |
| `locationRepository`    | `ILocationRepository`           |
| `logger?`               | `Logger`\<`ILogObj`\>           |

###### Returns

[`StatusNotificationService`](#statusnotificationservice)

#### Properties

| Property                                                     | Modifier    | Type                            | Defined in                                                                                                                                                                                                                          |
| ------------------------------------------------------------ | ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_componentrepository"></a> `_componentRepository`     | `protected` | `CrudRepository`\<`Component`\> | [03_Modules/Transactions/src/module/StatusNotificationService.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/StatusNotificationService.ts#L20) |
| <a id="_devicemodelrepository"></a> `_deviceModelRepository` | `protected` | `IDeviceModelRepository`        | [03_Modules/Transactions/src/module/StatusNotificationService.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/StatusNotificationService.ts#L21) |
| <a id="_locationrepository"></a> `_locationRepository`       | `protected` | `ILocationRepository`           | [03_Modules/Transactions/src/module/StatusNotificationService.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/StatusNotificationService.ts#L22) |
| <a id="_logger"></a> `_logger`                               | `protected` | `Logger`\<`ILogObj`\>           | [03_Modules/Transactions/src/module/StatusNotificationService.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/StatusNotificationService.ts#L23) |

#### Methods

##### processOcpp16StatusNotification()

```ts
processOcpp16StatusNotification(
   tenantId,
   stationId,
statusNotificationRequest): Promise<void>;
```

Defined in: [03_Modules/Transactions/src/module/StatusNotificationService.ts:133](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/StatusNotificationService.ts#L133)

###### Parameters

| Parameter                   | Type                        |
| --------------------------- | --------------------------- |
| `tenantId`                  | `number`                    |
| `stationId`                 | `string`                    |
| `statusNotificationRequest` | `StatusNotificationRequest` |

###### Returns

`Promise`\<`void`\>

##### processStatusNotification()

```ts
processStatusNotification(
   tenantId,
   stationId,
statusNotificationRequest): Promise<void>;
```

Defined in: [03_Modules/Transactions/src/module/StatusNotificationService.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/StatusNotificationService.ts#L45)

Stores an internal record of the incoming status, then updates the device model for the updated connector.

###### Parameters

| Parameter                   | Type                        | Description                                                  |
| --------------------------- | --------------------------- | ------------------------------------------------------------ |
| `tenantId`                  | `number`                    | -                                                            |
| `stationId`                 | `string`                    | The Charging Station sending the status notification request |
| `statusNotificationRequest` | `StatusNotificationRequest` | -                                                            |

###### Returns

`Promise`\<`void`\>
