[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse

# 00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse.ts#L25)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                          |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse.ts#L26) |

---

### HeartbeatResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse.ts#L13)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                               | Type                                          | Description                            | Defined in                                                                                                                                                                                                          |
| -------------------------------------- | --------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="currenttime"></a> `currentTime` | `string`                                      | Contains the current time of the CSMS. | [00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse.ts#L19) |
| <a id="customdata"></a> `customData?`  | [`CustomDataType`](#customdatatype) \| `null` | -                                      | [00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/HeartbeatResponse.ts#L14) |
