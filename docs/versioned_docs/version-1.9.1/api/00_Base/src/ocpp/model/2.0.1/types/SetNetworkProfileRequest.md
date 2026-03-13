[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest

# 00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest

## Interfaces

### APNType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L78)

APN
urn:x-oca:ocpp:uid:2:233134
Collection of configuration data needed to make a data-connection over a cellular network.

NOTE: When asking a GSM modem to dial in, it is possible to specify which mobile operator should be used. This can be done with the mobile country code (MCC) in combination with a mobile network code (MNC). Example: If your preferred network is Vodafone Netherlands, the MCC=204 and the MNC=04 which means the key PreferredNetwork = 20404 Some modems allows to specify a preferred network, which means, if this network is not available, a different network is used. If you specify UseOnlyPreferredNetwork and this network is not available, the modem will not dial in.

#### Properties

| Property                                                        | Type                                                                 | Description                                                                                                                                                             | Defined in                                                                                                                                                                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="apn"></a> `apn`                                          | `string`                                                             | APN. APN. URI urn:x-oca:ocpp:uid:1:568814 The Access Point Name as an URL.                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:86](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L86)   |
| <a id="apnauthentication"></a> `apnAuthentication`              | [`APNAuthenticationEnumType`](../enums.md#apnauthenticationenumtype) | -                                                                                                                                                                       | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L123) |
| <a id="apnpassword"></a> `apnPassword?`                         | `string` \| `null`                                                   | APN. APN. Password urn:x-oca:ocpp:uid:1:568819 APN Password.                                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L100) |
| <a id="apnusername"></a> `apnUserName?`                         | `string` \| `null`                                                   | APN. APN. User\_ Name urn:x-oca:ocpp:uid:1:568818 APN username.                                                                                                         | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:93](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L93)   |
| <a id="customdata"></a> `customData?`                           | [`CustomDataType`](#customdatatype) \| `null`                        | -                                                                                                                                                                       | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L79)   |
| <a id="preferrednetwork"></a> `preferredNetwork?`               | `string` \| `null`                                                   | APN. Preferred* Network. Mobile* Network\_ ID urn:x-oca:ocpp:uid:1:568822 Preferred network, written as MCC and MNC concatenated. See note.                             | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:114](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L114) |
| <a id="simpin"></a> `simPin?`                                   | `number` \| `null`                                                   | APN. SIMPIN. PIN\_ Code urn:x-oca:ocpp:uid:1:568821 SIM card pin code.                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L107) |
| <a id="useonlypreferrednetwork"></a> `useOnlyPreferredNetwork?` | `boolean` \| `null`                                                  | APN. Use* Only* Preferred\_ Network. Indicator urn:x-oca:ocpp:uid:1:568824 Default: false. Use only the preferred Network, do not dial in when not available. See Note. | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:122](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L122) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L33)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                        |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L34) |

---

### NetworkConnectionProfileType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L43)

Communication\_ Function
urn:x-oca:ocpp:uid:2:233304
The NetworkConnectionProfile defines the functional and technical parameters of a communication link.

#### Properties

| Property                                       | Type                                                         | Description                                                                                                                                                                                                                                                              | Defined in                                                                                                                                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="apn-1"></a> `apn?`                      | [`APNType`](#apntype) \| `null`                              | -                                                                                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L45) |
| <a id="customdata-1"></a> `customData?`        | [`CustomDataType`](#customdatatype) \| `null`                | -                                                                                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L44) |
| <a id="messagetimeout"></a> `messageTimeout`   | `number`                                                     | Duration in seconds before a message send by the Charging Station via this network connection times-out. The best setting depends on the underlying network and response times of the CSMS. If you are looking for a some guideline: use 30 seconds as a starting point. | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L61) |
| <a id="ocppcsmsurl"></a> `ocppCsmsUrl`         | `string`                                                     | Communication* Function. OCPP* Central* System* URL. URI urn:x-oca:ocpp:uid:1:569357 URL of the CSMS(s) that this Charging Station communicates with.                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L54) |
| <a id="ocppinterface"></a> `ocppInterface`     | [`OCPPInterfaceEnumType`](../enums.md#ocppinterfaceenumtype) | -                                                                                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L67) |
| <a id="ocpptransport"></a> `ocppTransport`     | [`OCPPTransportEnumType`](../enums.md#ocpptransportenumtype) | -                                                                                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L47) |
| <a id="ocppversion"></a> `ocppVersion`         | [`OCPPVersionEnumType`](../enums.md#ocppversionenumtype)     | -                                                                                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L46) |
| <a id="securityprofile"></a> `securityProfile` | `number`                                                     | This field specifies the security profile used when connecting to the CSMS with this NetworkConnectionProfile.                                                                                                                                                           | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:66](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L66) |
| <a id="vpn"></a> `vpn?`                        | [`VPNType`](#vpntype) \| `null`                              | -                                                                                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L68) |

---

### SetNetworkProfileRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L20)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                           | Type                                                            | Description                                       | Defined in                                                                                                                                                                                                                        |
| -------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="configurationslot"></a> `configurationSlot` | `number`                                                        | Slot in which the configuration should be stored. | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L26) |
| <a id="connectiondata"></a> `connectionData`       | [`NetworkConnectionProfileType`](#networkconnectionprofiletype) | -                                                 | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L27) |
| <a id="customdata-2"></a> `customData?`            | [`CustomDataType`](#customdatatype) \| `null`                   | -                                                 | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L21) |

---

### VPNType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:131](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L131)

VPN
urn:x-oca:ocpp:uid:2:233268
VPN Configuration settings

#### Properties

| Property                                | Type                                          | Description                                                        | Defined in                                                                                                                                                                                                                          |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-3"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null` | -                                                                  | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:132](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L132) |
| <a id="group"></a> `group?`             | `string` \| `null`                            | VPN. Group. Group\_ Name urn:x-oca:ocpp:uid:1:569274 VPN group.    | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:153](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L153) |
| <a id="key"></a> `key`                  | `string`                                      | VPN. Key. VPN\_ Key urn:x-oca:ocpp:uid:1:569276 VPN shared secret. | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:167](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L167) |
| <a id="password"></a> `password`        | `string`                                      | VPN. Password. Password urn:x-oca:ocpp:uid:1:569275 VPN Password.  | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:160](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L160) |
| <a id="server"></a> `server`            | `string`                                      | VPN. Server. URI urn:x-oca:ocpp:uid:1:569272 VPN Server Address    | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:139](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L139) |
| <a id="type"></a> `type`                | [`VPNEnumType`](../enums.md#vpnenumtype)      | -                                                                  | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:168](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L168) |
| <a id="user"></a> `user`                | `string`                                      | VPN. User. User\_ Name urn:x-oca:ocpp:uid:1:569273 VPN User        | [00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts:146](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.ts#L146) |
