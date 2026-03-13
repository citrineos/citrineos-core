[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse

# 00_Base/src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse.ts#L20)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                    |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse.ts#L21) |

---

### NotifyMonitoringReportResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse.ts#L13)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                              | Type                                          | Defined in                                                                                                                                                                                                                                    |
| ------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | [00_Base/src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse.ts#L14) |
