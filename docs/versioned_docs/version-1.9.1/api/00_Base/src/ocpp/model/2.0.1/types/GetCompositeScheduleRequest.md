[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest

# 00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts#L33)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                              |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts#L34) |

---

### GetCompositeScheduleRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                          | Type                                                                            | Description                                                                                                                                                  | Defined in                                                                                                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingrateunit"></a> `chargingRateUnit?` | \| [`ChargingRateUnitEnumType`](../enums.md#chargingrateunitenumtype) \| `null` | -                                                                                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts#L22) |
| <a id="customdata"></a> `customData?`             | [`CustomDataType`](#customdatatype) \| `null`                                   | -                                                                                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts#L15) |
| <a id="duration"></a> `duration`                  | `number`                                                                        | Length of the requested schedule in seconds.                                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts#L21) |
| <a id="evseid"></a> `evseId`                      | `number`                                                                        | The ID of the EVSE for which the schedule is requested. When evseid=0, the Charging Station will calculate the expected consumption for the grid connection. | [00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.ts#L27) |
