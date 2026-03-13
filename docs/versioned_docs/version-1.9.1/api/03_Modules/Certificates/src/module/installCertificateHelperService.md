[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/Certificates/src/module/installCertificateHelperService

# 03_Modules/Certificates/src/module/installCertificateHelperService

## Enumerations

### PemType

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L27)

#### Enumeration Members

##### Leaf

```ts
Leaf: 'Leaf';
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L30)

##### Root

```ts
Root: 'Root';
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L28)

##### SubCA

```ts
SubCA: 'SubCA';
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L29)

## Classes

### InstallCertificateHelperService

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L38)

#### Constructors

##### Constructor

```ts
new InstallCertificateHelperService(
   certificateRepository,
   installedCertificateRepository,
   installCertificateAttemptRepository,
   deleteCertificateAttemptRepository,
   certificateAuthorityService,
   networkConnection,
   fileStorage,
   logger): InstallCertificateHelperService;
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L48)

###### Parameters

| Parameter                             | Type                                   |
| ------------------------------------- | -------------------------------------- |
| `certificateRepository`               | `ICertificateRepository`               |
| `installedCertificateRepository`      | `IInstalledCertificateRepository`      |
| `installCertificateAttemptRepository` | `IInstallCertificateAttemptRepository` |
| `deleteCertificateAttemptRepository`  | `IDeleteCertificateAttemptRepository`  |
| `certificateAuthorityService`         | `CertificateAuthorityService`          |
| `networkConnection`                   | `WebsocketNetworkConnection`           |
| `fileStorage`                         | `IFileStorage`                         |
| `logger`                              | `Logger`\<`ILogObj`\>                  |

###### Returns

[`InstallCertificateHelperService`](#installcertificatehelperservice)

#### Properties

| Property                                                                               | Modifier    | Type                                   | Defined in                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------- | ----------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="certificateauthorityservice"></a> `certificateAuthorityService`                 | `protected` | `CertificateAuthorityService`          | [03_Modules/Certificates/src/module/installCertificateHelperService.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L43) |
| <a id="certificaterepository"></a> `certificateRepository`                             | `protected` | `ICertificateRepository`               | [03_Modules/Certificates/src/module/installCertificateHelperService.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L39) |
| <a id="deletecertificateattemptrepository"></a> `deleteCertificateAttemptRepository`   | `protected` | `IDeleteCertificateAttemptRepository`  | [03_Modules/Certificates/src/module/installCertificateHelperService.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L42) |
| <a id="filestorage"></a> `fileStorage`                                                 | `protected` | `IFileStorage`                         | [03_Modules/Certificates/src/module/installCertificateHelperService.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L45) |
| <a id="installcertificateattemptrepository"></a> `installCertificateAttemptRepository` | `protected` | `IInstallCertificateAttemptRepository` | [03_Modules/Certificates/src/module/installCertificateHelperService.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L41) |
| <a id="installedcertificaterepository"></a> `installedCertificateRepository`           | `protected` | `IInstalledCertificateRepository`      | [03_Modules/Certificates/src/module/installCertificateHelperService.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L40) |
| <a id="logger"></a> `logger`                                                           | `protected` | `Logger`\<`ILogObj`\>                  | [03_Modules/Certificates/src/module/installCertificateHelperService.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L46) |
| <a id="networkconnection"></a> `networkConnection`                                     | `protected` | `WebsocketNetworkConnection`           | [03_Modules/Certificates/src/module/installCertificateHelperService.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L44) |

#### Methods

##### createNewCertificate()

```ts
createNewCertificate(
   certificate,
   serialNumber,
   issuerName,
   organizationName,
   commonName,
   countryName,
   validBefore,
signatureAlgorithm): Promise<Certificate>;
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:184](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L184)

###### Parameters

| Parameter            | Type                                   |
| -------------------- | -------------------------------------- |
| `certificate`        | `string`                               |
| `serialNumber`       | `number` \| `null`                     |
| `issuerName`         | `string` \| `null`                     |
| `organizationName`   | `string` \| `null`                     |
| `commonName`         | `string` \| `null`                     |
| `countryName`        | `CountryNameEnumType` \| `null`        |
| `validBefore`        | `Date` \| `null`                       |
| `signatureAlgorithm` | `SignatureAlgorithmEnumType` \| `null` |

###### Returns

`Promise`\<`Certificate`\>

##### finalizeInstalledCertificate()

```ts
finalizeInstalledCertificate(
   tenantId,
   stationId,
status): Promise<void>;
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:126](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L126)

###### Parameters

| Parameter   | Type                               |
| ----------- | ---------------------------------- |
| `tenantId`  | `number`                           |
| `stationId` | `string`                           |
| `status`    | `InstallCertificateStatusEnumType` |

###### Returns

`Promise`\<`void`\>

##### generateSubCACertificateSignedByCAServer()

```ts
generateSubCACertificateSignedByCAServer(certificate): Promise<[string, string]>;
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:312](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L312)

Generates a sub CA certificate signed by a CA server.

###### Parameters

| Parameter     | Type          | Description                                                           |
| ------------- | ------------- | --------------------------------------------------------------------- |
| `certificate` | `Certificate` | The certificate information used for generating the root certificate. |

###### Returns

`Promise`\<\[`string`, `string`\]\>

An array containing the signed certificate and the private key.

##### getCertificateHash()

```ts
getCertificateHash(pemString): string;
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:442](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L442)

Generate a hash (fingerprint) from a certificate PEM string.

###### Parameters

| Parameter   | Type     | Description                 |
| ----------- | -------- | --------------------------- |
| `pemString` | `string` | The certificate PEM string. |

###### Returns

`string`

A SHA-256 hash of the certificate's DER encoding.

##### handleUploadExistingCertificate()

```ts
handleUploadExistingCertificate(
   tenantId,
   identifier,
   uploadExistingCertificate,
filePath?): Promise<InstalledCertificate>;
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:211](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L211)

###### Parameters

| Parameter                   | Type                        |
| --------------------------- | --------------------------- |
| `tenantId`                  | `number`                    |
| `identifier`                | `string`                    |
| `uploadExistingCertificate` | `UploadExistingCertificate` |
| `filePath?`                 | `string`                    |

###### Returns

`Promise`\<`InstalledCertificate`\>

##### prepareToInstallCertificate()

```ts
prepareToInstallCertificate(
   tenantId,
   stationId,
   certificate,
certificateType): Promise<void>;
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L68)

###### Parameters

| Parameter         | Type                            |
| ----------------- | ------------------------------- |
| `tenantId`        | `number`                        |
| `stationId`       | `string`                        |
| `certificate`     | `string`                        |
| `certificateType` | `InstallCertificateUseEnumType` |

###### Returns

`Promise`\<`void`\>

##### replaceFile()

```ts
private replaceFile(
   targetFilePath,
   newContent,
   rollbackFiles): RollBackFile[];
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:420](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L420)

###### Parameters

| Parameter        | Type             |
| ---------------- | ---------------- |
| `targetFilePath` | `string`         |
| `newContent`     | `string`         |
| `rollbackFiles`  | `RollBackFile`[] |

###### Returns

`RollBackFile`[]

##### storeCertificateAndKey()

```ts
storeCertificateAndKey(
   tenantId,
   certificateEntity,
   certPem,
   keyPem,
   filePrefix,
filePath?): Promise<Certificate>;
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:330](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L330)

Store certificate in file storage and db.

###### Parameters

| Parameter           | Type                  | Description                                       |
| ------------------- | --------------------- | ------------------------------------------------- |
| `tenantId`          | `number`              | -                                                 |
| `certificateEntity` | `Certificate`         | certificate to be stored in db                    |
| `certPem`           | `string`              | certificate pem to be stored in file storage      |
| `keyPem`            | `string`              | private key pem to be stored in file storage      |
| `filePrefix`        | [`PemType`](#pemtype) | prefix for file name to be stored in file storage |
| `filePath?`         | `string`              | file path in file storage                         |

###### Returns

`Promise`\<`Certificate`\>

certificate stored in db

##### updateCertificates()

```ts
updateCertificates(
   serverConfig,
   serverId,
   tlsKey,
   tlsCertificateChain,
   subCAKey?,
   rootCA?): void;
```

Defined in: [03_Modules/Certificates/src/module/installCertificateHelperService.ts:359](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/installCertificateHelperService.ts#L359)

###### Parameters

| Parameter                                           | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `serverConfig`                                      | \{ `allowUnknownChargingStations`: `boolean`; `dynamicTenantResolution`: `boolean`; `host`: `string`; `id`: `string`; `ignoreAuthenticationHeaders?`: `boolean`; `maxConnectionsPerTenant?`: `number`; `mtlsCertificateAuthorityKeyFilePath?`: `string`; `pingInterval`: `number`; `port`: `number`; `protocols`: (`"ocpp1.6"` \| `"ocpp2.0.1"`)[]; `rootCACertificateFilePath?`: `string`; `securityProfile`: `number`; `tenantId`: `number`; `tenantPathMapping?`: `Record`\<`string`, `number`\>; `tlsCertificateChainFilePath?`: `string`; `tlsKeyFilePath?`: `string`; \} |
| `serverConfig.allowUnknownChargingStations`         | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `serverConfig.dynamicTenantResolution`              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `serverConfig.host`                                 | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverConfig.id`                                   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverConfig.ignoreAuthenticationHeaders?`         | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `serverConfig.maxConnectionsPerTenant?`             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverConfig.mtlsCertificateAuthorityKeyFilePath?` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverConfig.pingInterval?`                        | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverConfig.port?`                                | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverConfig.protocols?`                           | (`"ocpp1.6"` \| `"ocpp2.0.1"`)[]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `serverConfig.rootCACertificateFilePath?`           | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverConfig.securityProfile?`                     | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverConfig.tenantId?`                            | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverConfig.tenantPathMapping?`                   | `Record`\<`string`, `number`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `serverConfig.tlsCertificateChainFilePath?`         | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverConfig.tlsKeyFilePath?`                      | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `serverId?`                                         | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `tlsKey?`                                           | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `tlsCertificateChain?`                              | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `subCAKey?`                                         | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `rootCA?`                                           | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

###### Returns

`void`
