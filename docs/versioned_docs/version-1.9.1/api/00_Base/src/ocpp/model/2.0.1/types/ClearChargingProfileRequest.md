[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest

# 00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest

## Interfaces

### ClearChargingProfileRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                                        | Type                                                              | Description                              | Defined in                                                                                                                                                                                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingprofilecriteria"></a> `chargingProfileCriteria?` | [`ClearChargingProfileType`](#clearchargingprofiletype) \| `null` | -                                        | [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L21) |
| <a id="chargingprofileid"></a> `chargingProfileId?`             | `number` \| `null`                                                | The Id of the charging profile to clear. | [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L20) |
| <a id="customdata"></a> `customData?`                           | [`CustomDataType`](#customdatatype) \| `null`                     | -                                        | [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L15) |

---

### ClearChargingProfileType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L37)

Charging\_ Profile
urn:x-oca:ocpp:uid:2:233255
A ChargingProfile consists of a ChargingSchedule, describing the amount of power or current that can be delivered per time interval.

#### Properties

| Property                                                      | Type                                                                                        | Description                                                                                                                                                                                                                                                                                                                                                        | Defined in                                                                                                                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingprofilepurpose"></a> `chargingProfilePurpose?` | \| [`ChargingProfilePurposeEnumType`](../enums.md#chargingprofilepurposeenumtype) \| `null` | -                                                                                                                                                                                                                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L47) |
| <a id="customdata-1"></a> `customData?`                       | [`CustomDataType`](#customdatatype) \| `null`                                               | -                                                                                                                                                                                                                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L38) |
| <a id="evseid"></a> `evseId?`                                 | `number` \| `null`                                                                          | Identified* Object. MRID. Numeric* Identifier urn:x-enexis:ecdm:uid:1:569198 Specifies the id of the EVSE for which to clear charging profiles. An evseId of zero (0) specifies the charging profile for the overall Charging Station. Absence of this parameter means the clearing applies to all charging profiles that match the other criteria in the request. | [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L46) |
| <a id="stacklevel"></a> `stackLevel?`                         | `number` \| `null`                                                                          | Charging* Profile. Stack* Level. Counter urn:x-oca:ocpp:uid:1:569230 Specifies the stackLevel for which charging profiles will be cleared, if they meet the other criteria in the request.                                                                                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L54) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L27)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                              |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.ts#L28) |
