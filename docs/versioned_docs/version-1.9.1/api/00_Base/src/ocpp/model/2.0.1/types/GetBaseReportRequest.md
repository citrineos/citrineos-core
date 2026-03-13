[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest

# 00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts#L27)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts#L28) |

---

### GetBaseReportRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                                   | Description            | Defined in                                                                                                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`          | -                      | [00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts#L15) |
| <a id="reportbase"></a> `reportBase`  | [`ReportBaseEnumType`](../enums.md#reportbaseenumtype) | -                      | [00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts#L21) |
| <a id="requestid"></a> `requestId`    | `number`                                               | The Id of the request. | [00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetBaseReportRequest.ts#L20) |
