[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse

# 00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse

## Interfaces

### GetCompositeScheduleResponse

Defined in: [00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts#L17)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                          | Type                                                                                                       | Defined in                                                                                                                                                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingschedule"></a> `chargingSchedule?` | `object`                                                                                                   | [00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts#L21) |
| `chargingSchedule.chargingRateUnit`               | [`GetCompositeScheduleResponseChargingRateUnit`](../enums.md#getcompositescheduleresponsechargingrateunit) | [00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts#L24) |
| `chargingSchedule.chargingSchedulePeriod`         | `object`[]                                                                                                 | [00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts#L25) |
| `chargingSchedule.duration?`                      | `number` \| `null`                                                                                         | [00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts#L22) |
| `chargingSchedule.minChargingRate?`               | `number` \| `null`                                                                                         | [00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts#L30) |
| `chargingSchedule.startSchedule?`                 | `string` \| `null`                                                                                         | [00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts#L23) |
| <a id="connectorid"></a> `connectorId?`           | `number` \| `null`                                                                                         | [00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts#L19) |
| <a id="schedulestart"></a> `scheduleStart?`       | `string` \| `null`                                                                                         | [00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts#L20) |
| <a id="status"></a> `status`                      | [`GetCompositeScheduleResponseStatus`](../enums.md#getcompositescheduleresponsestatus)                     | [00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/1.6/types/GetCompositeScheduleResponse.ts#L18) |
