[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest

# 00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts#L46)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                        |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts#L47) |

---

### NotifyCustomerInformationRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                               | Type                                          | Description                                                                                                                                                                          | Defined in                                                                                                                                                                                                                                        |
| -------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`  | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts#L14) |
| <a id="data"></a> `data`               | `string`                                      | (Part of) the requested data. No format specified in which the data is returned. Should be human readable.                                                                           | [00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts#L19) |
| <a id="generatedat"></a> `generatedAt` | `string`                                      | Timestamp of the moment this message was generated at the Charging Station.                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts#L34) |
| <a id="requestid"></a> `requestId`     | `number`                                      | The Id of the request.                                                                                                                                                               | [00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts#L40) |
| <a id="seqno"></a> `seqNo`             | `number`                                      | Sequence number of this message. First message starts at 0.                                                                                                                          | [00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts#L29) |
| <a id="tbc"></a> `tbc?`                | `boolean` \| `null`                           | “to be continued” indicator. Indicates whether another part of the monitoringData follows in an upcoming notifyMonitoringReportRequest message. Default value when omitted is false. | [00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.ts#L24) |
