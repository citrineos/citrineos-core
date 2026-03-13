[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/Monitoring/src/module/MonitoringService

# 03_Modules/Monitoring/src/module/MonitoringService

## Classes

### MonitoringService

Defined in: [03_Modules/Monitoring/src/module/MonitoringService.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/MonitoringService.ts#L9)

#### Constructors

##### Constructor

```ts
new MonitoringService(variableMonitoringRepository, logger?): MonitoringService;
```

Defined in: [03_Modules/Monitoring/src/module/MonitoringService.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/MonitoringService.ts#L13)

###### Parameters

| Parameter                      | Type                            |
| ------------------------------ | ------------------------------- |
| `variableMonitoringRepository` | `IVariableMonitoringRepository` |
| `logger?`                      | `Logger`\<`ILogObj`\>           |

###### Returns

[`MonitoringService`](#monitoringservice)

#### Properties

| Property                                                                   | Modifier    | Type                            | Defined in                                                                                                                                                                                                      |
| -------------------------------------------------------------------------- | ----------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger`                                             | `protected` | `Logger`\<`ILogObj`\>           | [03_Modules/Monitoring/src/module/MonitoringService.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/MonitoringService.ts#L11) |
| <a id="_variablemonitoringrepository"></a> `_variableMonitoringRepository` | `protected` | `IVariableMonitoringRepository` | [03_Modules/Monitoring/src/module/MonitoringService.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/MonitoringService.ts#L10) |

#### Methods

##### processClearMonitoringResult()

```ts
processClearMonitoringResult(
   tenantId,
   stationId,
clearMonitoringResult): Promise<void>;
```

Defined in: [03_Modules/Monitoring/src/module/MonitoringService.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/MonitoringService.ts#L23)

###### Parameters

| Parameter               | Type                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `tenantId`              | `number`                                                          |
| `stationId`             | `string`                                                          |
| `clearMonitoringResult` | \[`ClearMonitoringResultType`, `...ClearMonitoringResultType[]`\] |

###### Returns

`Promise`\<`void`\>
