[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/security/SignedMeterValuesUtil

# 02_Util/src/security/SignedMeterValuesUtil

## Classes

### SignedMeterValuesUtil

Defined in: [02_Util/src/security/SignedMeterValuesUtil.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L16)

Util to process and validate signed meter values.

#### Constructors

##### Constructor

```ts
new SignedMeterValuesUtil(
   fileStorage?,
   config,
   logger?): SignedMeterValuesUtil;
```

Defined in: [02_Util/src/security/SignedMeterValuesUtil.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L31)

###### Parameters

| Parameter      | Type                  | Description                                                      |
| -------------- | --------------------- | ---------------------------------------------------------------- |
| `fileStorage?` | `IFileStorage`        | The `fileStorage` allows access to the configured file storage.  |
| `config?`      | `object` & `object`   | The `config` contains the current system configuration settings. |
| `logger?`      | `Logger`\<`ILogObj`\> | The `logger` represents an instance of Logger\<ILogObj\>.        |

###### Returns

[`SignedMeterValuesUtil`](#signedmetervaluesutil)

#### Properties

| Property                                                                                     | Modifier  | Type                                     | Defined in                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------- | --------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_chargingstationsecurityinforepository"></a> `_chargingStationSecurityInfoRepository` | `private` | `IChargingStationSecurityInfoRepository` | [02_Util/src/security/SignedMeterValuesUtil.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L19) |
| <a id="_filestorage"></a> `_fileStorage`                                                     | `private` | `IFileStorage`                           | [02_Util/src/security/SignedMeterValuesUtil.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L17) |
| <a id="_logger"></a> `_logger`                                                               | `private` | `Logger`\<`ILogObj`\>                    | [02_Util/src/security/SignedMeterValuesUtil.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L18) |
| <a id="_signedmetervaluesconfiguration"></a> `_signedMeterValuesConfiguration`               | `private` | `SignedMeterValuesConfig` \| `undefined` | [02_Util/src/security/SignedMeterValuesUtil.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L21) |

#### Methods

##### formatKey()

```ts
private formatKey(key): string;
```

Defined in: [02_Util/src/security/SignedMeterValuesUtil.ts:211](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L211)

###### Parameters

| Parameter | Type                    |
| --------- | ----------------------- |
| `key`     | `string` \| `undefined` |

###### Returns

`string`

##### validateMeterValues()

```ts
validateMeterValues(
   tenantId,
   stationId,
meterValues): Promise<boolean>;
```

Defined in: [02_Util/src/security/SignedMeterValuesUtil.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L62)

Checks the validity of a meter value.

If a meter value is unsigned, it is valid.

If a meter value is signed, it is valid if:

- SignedMeterValuesConfig is configured
  AND
- The incoming signed meter value's signing method matches the configured signing method
  AND
- The incoming signed meter value's public key is empty but there is a public key stored for that charging station
  OR
- The incoming signed meter value's public key isn't empty and it matches the configured public key

###### Parameters

| Parameter     | Type                                        | Description                                     |
| ------------- | ------------------------------------------- | ----------------------------------------------- |
| `tenantId`    | `number`                                    | -                                               |
| `stationId`   | `string`                                    | The charging station the meter values belong to |
| `meterValues` | \[`MeterValueType`, `...MeterValueType[]`\] | The list of meter values                        |

###### Returns

`Promise`\<`boolean`\>

##### validateRsaSignature()

```ts
private validateRsaSignature(
   configuredPublicKey,
   signingMethod,
   encodingMethod,
signatureData): Promise<boolean>;
```

Defined in: [02_Util/src/security/SignedMeterValuesUtil.ts:183](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L183)

###### Parameters

| Parameter             | Type     |
| --------------------- | -------- |
| `configuredPublicKey` | `string` |
| `signingMethod`       | `string` |
| `encodingMethod`      | `string` |
| `signatureData`       | `string` |

###### Returns

`Promise`\<`boolean`\>

##### validateSignedMeterValueSignature()

```ts
private validateSignedMeterValueSignature(signedMeterValue, publicKeyFileId?): Promise<boolean>;
```

Defined in: [02_Util/src/security/SignedMeterValuesUtil.ts:118](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L118)

###### Parameters

| Parameter          | Type                   |
| ------------------ | ---------------------- |
| `signedMeterValue` | `SignedMeterValueType` |
| `publicKeyFileId?` | `string`               |

###### Returns

`Promise`\<`boolean`\>

##### validateSignedSampledValue()

```ts
private validateSignedSampledValue(
   tenantId,
   stationId,
signedMeterValue): Promise<boolean>;
```

Defined in: [02_Util/src/security/SignedMeterValuesUtil.ts:85](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/security/SignedMeterValuesUtil.ts#L85)

###### Parameters

| Parameter          | Type                   |
| ------------------ | ---------------------- |
| `tenantId`         | `number`               |
| `stationId`        | `string`               |
| `signedMeterValue` | `SignedMeterValueType` |

###### Returns

`Promise`\<`boolean`\>
