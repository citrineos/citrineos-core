[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse

# 00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse

## Interfaces

### ClearMonitoringResultType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L29)

#### Properties

| Property                              | Type                                                                         | Description                                       | Defined in                                                                                                                                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                                | -                                                 | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L30) |
| <a id="id"></a> `id`                  | `number`                                                                     | Id of the monitor of which a clear was requested. | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L37) |
| <a id="status"></a> `status`          | [`ClearMonitoringStatusEnumType`](../enums.md#clearmonitoringstatusenumtype) | -                                                 | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L31) |
| <a id="statusinfo"></a> `statusInfo?` | [`StatusInfoType`](#statusinfotype) \| `null`                                | -                                                 | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L38) |

---

### ClearVariableMonitoringResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L14)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                                   | Type                                                                                            | Description     | Defined in                                                                                                                                                                                                                                      |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="clearmonitoringresult"></a> `clearMonitoringResult` | \[[`ClearMonitoringResultType`](#clearmonitoringresulttype), `...ClearMonitoringResultType[]`\] | **Min Items** 1 | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L19) |
| <a id="customdata-1"></a> `customData?`                    | [`CustomDataType`](#customdatatype) \| `null`                                                   | -               | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L15) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L25)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                      |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L26) |

---

### StatusInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L44)

Element providing more information about the status.

#### Properties

| Property                                      | Type                                          | Description                                                                                                   | Defined in                                                                                                                                                                                                                                      |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | `string` \| `null`                            | Additional text to provide detailed information.                                                              | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L55) |
| <a id="customdata-2"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L45) |
| <a id="reasoncode"></a> `reasonCode`          | `string`                                      | A predefined code for the reason why the status is returned in this response. The string is case-insensitive. | [00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.ts#L50) |
