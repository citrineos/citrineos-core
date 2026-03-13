[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest

# 00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts#L27)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                    |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts#L28) |

---

### ReservationStatusUpdateRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                                       | Type                                                                             | Description                | Defined in                                                                                                                                                                                                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`                          | [`CustomDataType`](#customdatatype) \| `null`                                    | -                          | [00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts#L15) |
| <a id="reservationid"></a> `reservationId`                     | `number`                                                                         | The ID of the reservation. | [00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts#L20) |
| <a id="reservationupdatestatus"></a> `reservationUpdateStatus` | [`ReservationUpdateStatusEnumType`](../enums.md#reservationupdatestatusenumtype) | -                          | [00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.ts#L21) |
