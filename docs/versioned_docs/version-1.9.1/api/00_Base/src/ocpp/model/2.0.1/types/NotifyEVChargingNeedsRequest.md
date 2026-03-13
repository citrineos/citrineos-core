[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest

# 00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest

## Interfaces

### ACChargingParametersType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L61)

AC* Charging* Parameters
urn:x-oca:ocpp:uid:2:233250
EV AC charging parameters.

#### Properties

| Property                                 | Type                                          | Description                                                                                                                                                                 | Defined in                                                                                                                                                                                                                                |
| ---------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`    | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L62) |
| <a id="energyamount"></a> `energyAmount` | `number`                                      | AC* Charging* Parameters. Energy* Amount. Energy* Amount urn:x-oca:ocpp:uid:1:569211 Amount of energy requested (in Wh). This includes energy required for preconditioning. | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L69) |
| <a id="evmaxcurrent"></a> `evMaxCurrent` | `number`                                      | AC* Charging* Parameters. EV\_ Max. Current urn:x-oca:ocpp:uid:1:569213 Maximum current (amps) supported by the electric vehicle (per phase). Includes cable capacity.      | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L83) |
| <a id="evmaxvoltage"></a> `evMaxVoltage` | `number`                                      | AC* Charging* Parameters. EV\_ Max. Voltage urn:x-oca:ocpp:uid:1:569214 Maximum voltage supported by the electric vehicle                                                   | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:90](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L90) |
| <a id="evmincurrent"></a> `evMinCurrent` | `number`                                      | AC* Charging* Parameters. EV\_ Min. Current urn:x-oca:ocpp:uid:1:569212 Minimum current (amps) supported by the electric vehicle (per phase).                               | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L76) |

---

### ChargingNeedsType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L41)

Charging\_ Needs
urn:x-oca:ocpp:uid:2:233249

#### Properties

| Property                                                       | Type                                                                   | Description                                                                                                   | Defined in                                                                                                                                                                                                                                |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="acchargingparameters"></a> `acChargingParameters?`      | [`ACChargingParametersType`](#acchargingparameterstype) \| `null`      | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L43) |
| <a id="customdata-1"></a> `customData?`                        | [`CustomDataType`](#customdatatype) \| `null`                          | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L42) |
| <a id="dcchargingparameters"></a> `dcChargingParameters?`      | [`DCChargingParametersType`](#dcchargingparameterstype) \| `null`      | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L44) |
| <a id="departuretime"></a> `departureTime?`                    | `string` \| `null`                                                     | Charging* Needs. Departure* Time. Date\_ Time urn:x-oca:ocpp:uid:1:569223 Estimated departure time of the EV. | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L52) |
| <a id="requestedenergytransfer"></a> `requestedEnergyTransfer` | [`EnergyTransferModeEnumType`](../enums.md#energytransfermodeenumtype) | -                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L45) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L32)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                                |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L33) |

---

### DCChargingParametersType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L100)

DC* Charging* Parameters
urn:x-oca:ocpp:uid:2:233251
EV DC charging parameters

#### Properties

| Property                                          | Type                                          | Description                                                                                                                                                                         | Defined in                                                                                                                                                                                                                                  |
| ------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="bulksoc"></a> `bulkSoC?`                   | `number` \| `null`                            | DC* Charging* Parameters. Bulk\_ SOC. Percentage urn:x-oca:ocpp:uid:1:569222 Percentage of SoC at which the EV considers a fast charging process to end. (possible values: 0 - 100) | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:157](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L157) |
| <a id="customdata-2"></a> `customData?`           | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                                                                   | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:101](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L101) |
| <a id="energyamount-1"></a> `energyAmount?`       | `number` \| `null`                            | DC* Charging* Parameters. Energy* Amount. Energy* Amount urn:x-oca:ocpp:uid:1:569217 Amount of energy requested (in Wh). This inludes energy required for preconditioning.          | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:122](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L122) |
| <a id="evenergycapacity"></a> `evEnergyCapacity?` | `number` \| `null`                            | DC* Charging* Parameters. EV* Energy* Capacity. Numeric urn:x-oca:ocpp:uid:1:569220 Capacity of the electric vehicle battery (in Wh)                                                | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:143](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L143) |
| <a id="evmaxcurrent-1"></a> `evMaxCurrent`        | `number`                                      | DC* Charging* Parameters. EV\_ Max. Current urn:x-oca:ocpp:uid:1:569215 Maximum current (amps) supported by the electric vehicle. Includes cable capacity.                          | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L108) |
| <a id="evmaxpower"></a> `evMaxPower?`             | `number` \| `null`                            | DC* Charging* Parameters. EV\_ Max. Power urn:x-oca:ocpp:uid:1:569218 Maximum power (in W) supported by the electric vehicle. Required for DC charging.                             | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:129](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L129) |
| <a id="evmaxvoltage-1"></a> `evMaxVoltage`        | `number`                                      | DC* Charging* Parameters. EV\_ Max. Voltage urn:x-oca:ocpp:uid:1:569216 Maximum voltage supported by the electric vehicle                                                           | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L115) |
| <a id="fullsoc"></a> `fullSoC?`                   | `number` \| `null`                            | DC* Charging* Parameters. Full\_ SOC. Percentage urn:x-oca:ocpp:uid:1:569221 Percentage of SoC at which the EV considers the battery fully charged. (possible values: 0 - 100)      | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:150](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L150) |
| <a id="stateofcharge"></a> `stateOfCharge?`       | `number` \| `null`                            | DC* Charging* Parameters. State* Of* Charge. Numeric urn:x-oca:ocpp:uid:1:569219 Energy available in the battery (in percent of the battery capacity)                               | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:136](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L136) |

---

### NotifyEVChargingNeedsRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                            | Type                                          | Description                                                                       | Defined in                                                                                                                                                                                                                                |
| --------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingneeds"></a> `chargingNeeds`          | [`ChargingNeedsType`](#chargingneedstype)     | -                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L21) |
| <a id="customdata-3"></a> `customData?`             | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L15) |
| <a id="evseid"></a> `evseId`                        | `number`                                      | Defines the EVSE and connector to which the EV is connected. EvseId may not be 0. | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L26) |
| <a id="maxscheduletuples"></a> `maxScheduleTuples?` | `number` \| `null`                            | Contains the maximum schedule tuples the car supports per schedule.               | [00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.ts#L20) |
