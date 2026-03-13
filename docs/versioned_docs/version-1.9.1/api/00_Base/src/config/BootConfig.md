[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 00_Base/src/config/BootConfig

# 00_Base/src/config/BootConfig

## Interfaces

### BootConfig

Defined in: [00_Base/src/config/BootConfig.ts:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L5)

#### Properties

| Property                                                                    | Type                 | Description                                                                     | Defined in                                                                                                                                                            |
| --------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="bootretryinterval"></a> `bootRetryInterval?`                         | `number` \| `null`   | Also declared in SystemConfig. If absent, SystemConfig value is used.           | [00_Base/src/config/BootConfig.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L13) |
| <a id="bootwithrejectedvariables"></a> `bootWithRejectedVariables?`         | `boolean` \| `null`  | Also declared in SystemConfig. If absent, SystemConfig value is used.           | [00_Base/src/config/BootConfig.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L27) |
| <a id="changeconfigurationsonpending"></a> `changeConfigurationsOnPending?` | `boolean` \| `null`  | Specifically for OCPP 1.6 which plays similar role to pendingBootSetVariableIds | [00_Base/src/config/BootConfig.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L31) |
| <a id="getbasereportonpending"></a> `getBaseReportOnPending?`               | `boolean` \| `null`  | Also declared in SystemConfig. If absent, SystemConfig value is used.           | [00_Base/src/config/BootConfig.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L19) |
| <a id="getconfigurationsonpending"></a> `getConfigurationsOnPending?`       | `boolean` \| `null`  | Specifically for OCPP 1.6 which plays similar role to getBaseReportOnPending    | [00_Base/src/config/BootConfig.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L35) |
| <a id="heartbeatinterval"></a> `heartbeatInterval?`                         | `number` \| `null`   | Also declared in SystemConfig. If absent, SystemConfig value is used.           | [00_Base/src/config/BootConfig.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L9)   |
| <a id="pendingbootsetvariableids"></a> `pendingBootSetVariableIds?`         | `number`[] \| `null` | Ids of variable attributes to be sent in SetVariablesRequest on pending boot    | [00_Base/src/config/BootConfig.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L23) |
| <a id="status"></a> `status`                                                | `string`             | -                                                                               | [00_Base/src/config/BootConfig.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L14) |
| <a id="statusinfo"></a> `statusInfo?`                                       | `object` \| `null`   | -                                                                               | [00_Base/src/config/BootConfig.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L15) |

## Variables

### BOOT_STATUS

```ts
const BOOT_STATUS: 'boot_status' = 'boot_status';
```

Defined in: [00_Base/src/config/BootConfig.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/BootConfig.ts#L45)

Cache boot status is used to keep track of the overall boot process for Rejected or Pending.
When Accepting a boot, blacklist needs to be cleared if and only if there was a previously
Rejected or Pending boot. When starting to configure charger, i.e. sending GetBaseReport or
SetVariables, this should only be done if configuring is not still ongoing from a previous
BootNotificationRequest. Cache boot status mediates this behavior.
