[**CitrineOS Core**](../index.md)

---

[CitrineOS Core](../index.md) / 01_Data/src

# 01_Data/src

## Variables

### AuthorizationRestrictionsSchema

```ts
AuthorizationRestrictionsSchema: object;
```

Defined in: [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:1](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L1)

#### Type Declaration

| Name                                                              | Type      | Default value                       | Defined in                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | --------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-id"></a> `$id`                                    | `string`  | `"AuthorizationRestrictionsSchema"` | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:2](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L2)   |
| <a id="property-additionalproperties"></a> `additionalProperties` | `boolean` | `true`                              | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L19) |
| <a id="property-properties"></a> `properties`                     | `object`  | -                                   | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L4)   |
| `properties.allowedConnectorTypes`                                | `object`  | -                                   | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L5)   |
| `properties.allowedConnectorTypes.items`                          | `object`  | -                                   | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L7)   |
| `properties.allowedConnectorTypes.items.type`                     | `string`  | `"string"`                          | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L8)   |
| `properties.allowedConnectorTypes.type`                           | `string`  | `"array"`                           | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L6)   |
| `properties.disallowedEvseIdPrefixes`                             | `object`  | -                                   | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L11) |
| `properties.disallowedEvseIdPrefixes.items`                       | `object`  | -                                   | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L13) |
| `properties.disallowedEvseIdPrefixes.items.type`                  | `string`  | `"string"`                          | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L14) |
| `properties.disallowedEvseIdPrefixes.type`                        | `string`  | `"array"`                           | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L12) |
| <a id="property-required"></a> `required`                         | `never`[] | `[]`                                | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L18) |
| <a id="property-type"></a> `type`                                 | `string`  | `"object"`                          | [01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json:3](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/AuthorizationRestrictionsSchema.json#L3)   |

---

### TariffSchema

```ts
TariffSchema: object;
```

Defined in: [01_Data/src/interfaces/projections/schemas/TariffSchema.json:1](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L1)

#### Type Declaration

| Name                                            | Type       | Default value    | Defined in                                                                                                                                                                                                                    |
| ----------------------------------------------- | ---------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-id-1"></a> `$id`                | `string`   | `"TariffSchema"` | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:2](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L2)   |
| <a id="property-properties-1"></a> `properties` | `object`   | -                | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L4)   |
| `properties.authorizationAmount`                | `object`   | -                | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L25) |
| `properties.authorizationAmount.type`           | `string`   | `"number"`       | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L26) |
| `properties.currency`                           | `object`   | -                | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L8)   |
| `properties.currency.maxLength`                 | `number`   | `3`              | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L11) |
| `properties.currency.minLength`                 | `number`   | `3`              | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L10) |
| `properties.currency.type`                      | `string`   | `"string"`       | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L9)   |
| `properties.id`                                 | `object`   | -                | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L5)   |
| `properties.id.type`                            | `string`   | `"number"`       | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L6)   |
| `properties.paymentFee`                         | `object`   | -                | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L22) |
| `properties.paymentFee.type`                    | `string`   | `"number"`       | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L23) |
| `properties.pricePerKwh`                        | `object`   | -                | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L13) |
| `properties.pricePerKwh.type`                   | `string`   | `"number"`       | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L14) |
| `properties.pricePerMin`                        | `object`   | -                | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L16) |
| `properties.pricePerMin.type`                   | `string`   | `"number"`       | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L17) |
| `properties.pricePerSession`                    | `object`   | -                | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L19) |
| `properties.pricePerSession.type`               | `string`   | `"number"`       | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L20) |
| `properties.taxRate`                            | `object`   | -                | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L28) |
| `properties.taxRate.type`                       | `string`   | `"number"`       | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L29) |
| <a id="property-required-1"></a> `required`     | `string`[] | -                | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L32) |
| <a id="property-type-1"></a> `type`             | `string`   | `"object"`       | [01_Data/src/interfaces/projections/schemas/TariffSchema.json:3](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/schemas/TariffSchema.json#L3)   |

## References

### AsyncJobRequest

Re-exports [AsyncJobRequest](src/layers/sequelize/model/AsyncJob/AsyncJobStatus.md#asyncjobrequest)

---

### AsyncJobStatus

Re-exports [AsyncJobStatus](src/layers/sequelize/model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)

---

### AsyncJobStatusDTO

Re-exports [AsyncJobStatusDTO](src/layers/sequelize/model/AsyncJob/AsyncJobStatus.md#asyncjobstatusdto)

---

### Authorization

Re-exports [Authorization](src/layers/sequelize/model/Authorization/Authorization.md#authorization)

---

### AuthorizationQuerySchema

Re-exports [AuthorizationQuerySchema](src/interfaces/queries/Authorization.md#authorizationqueryschema)

---

### AuthorizationQuerystring

Re-exports [AuthorizationQuerystring](src/interfaces/queries/Authorization.md#authorizationquerystring)

---

### AuthorizationRestrictions

Re-exports [AuthorizationRestrictions](src/interfaces/projections/AuthorizationRestrictions.md#authorizationrestrictions)

---

### Boot

Re-exports [Boot](src/layers/sequelize/model/Boot.md#boot)

---

### Certificate

Re-exports [Certificate](src/layers/sequelize/model/Certificate/Certificate.md#certificate)

---

### ChangeConfiguration

Re-exports [ChangeConfiguration](src/layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)

---

### ChargingNeeds

Re-exports [ChargingNeeds](src/layers/sequelize/model/ChargingProfile/ChargingNeeds.md#chargingneeds)

---

### ChargingProfile

Re-exports [ChargingProfile](src/layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)

---

### ChargingSchedule

Re-exports [ChargingSchedule](src/layers/sequelize/model/ChargingProfile/ChargingSchedule.md#chargingschedule)

---

### ChargingStation

Re-exports [ChargingStation](src/layers/sequelize/model/Location/ChargingStation.md#chargingstation)

---

### ChargingStationKeyQuerySchema

Re-exports [ChargingStationKeyQuerySchema](src/interfaces/queries/ChargingStation.md#chargingstationkeyqueryschema)

---

### ChargingStationKeyQuerystring

Re-exports [ChargingStationKeyQuerystring](src/interfaces/queries/ChargingStation.md#chargingstationkeyquerystring)

---

### ChargingStationNetworkProfile

Re-exports [ChargingStationNetworkProfile](src/layers/sequelize/model/Location/ChargingStationNetworkProfile.md#chargingstationnetworkprofile)

---

### ChargingStationSecurityInfo

Re-exports [ChargingStationSecurityInfo](src/layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)

---

### ChargingStationSequence

Re-exports [ChargingStationSequence](src/layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)

---

### Component

Re-exports [Component](src/layers/sequelize/model/DeviceModel/Component.md#component)

---

### ConnectionDeleteQuerySchema

Re-exports [ConnectionDeleteQuerySchema](src/interfaces/queries/Connection.md#connectiondeletequeryschema)

---

### ConnectionDeleteQuerystring

Re-exports [ConnectionDeleteQuerystring](src/interfaces/queries/Connection.md#connectiondeletequerystring)

---

### Connector

Re-exports [Connector](src/layers/sequelize/model/Location/Connector.md#connector)

---

### CountryNameEnumType

Re-exports [CountryNameEnumType](src/layers/sequelize/model/Certificate.md#countrynameenumtype)

---

### CreateOrUpdateVariableAttributeQuerySchema

Re-exports [CreateOrUpdateVariableAttributeQuerySchema](src/interfaces/queries/VariableAttribute.md#createorupdatevariableattributequeryschema)

---

### CreateOrUpdateVariableAttributeQuerystring

Re-exports [CreateOrUpdateVariableAttributeQuerystring](src/interfaces/queries/VariableAttribute.md#createorupdatevariableattributequerystring)

---

### CreateSubscriptionSchema

Re-exports [CreateSubscriptionSchema](src/interfaces/queries/Subscription.md#createsubscriptionschema)

---

### CreateTenantQuerySchema

Re-exports [CreateTenantQuerySchema](src/interfaces/queries/Tenant.md#createtenantqueryschema)

---

### CryptoUtils

Re-exports [CryptoUtils](src/util/CryptoUtils.md#cryptoutils)

---

### DefaultSequelizeInstance

Re-exports [DefaultSequelizeInstance](src/layers/sequelize/util.md#defaultsequelizeinstance)

---

### DeleteCertificateAttempt

Re-exports [DeleteCertificateAttempt](src/layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)

---

### Evse

Re-exports [Evse](src/layers/sequelize/model/Location/Evse.md#evse)

---

### EvseType

Re-exports [EvseType](src/layers/sequelize/model/DeviceModel/EvseType.md#evsetype)

---

### GenerateCertificateChainRequest

Re-exports [GenerateCertificateChainRequest](src/interfaces/dtos/GenerateCertificateChainRequest.md#generatecertificatechainrequest)

---

### GenerateCertificateChainSchema

Re-exports [GenerateCertificateChainSchema](src/interfaces/queries/RootCertificate.md#generatecertificatechainschema)

---

### IAuthorizationRepository

Re-exports [IAuthorizationRepository](src/interfaces/repositories.md#iauthorizationrepository)

---

### IBootRepository

Re-exports [IBootRepository](src/interfaces/repositories.md#ibootrepository)

---

### ICertificateRepository

Re-exports [ICertificateRepository](src/interfaces/repositories.md#icertificaterepository)

---

### IChangeConfigurationRepository

Re-exports [IChangeConfigurationRepository](src/interfaces/repositories.md#ichangeconfigurationrepository)

---

### IChargingProfileRepository

Re-exports [IChargingProfileRepository](src/interfaces/repositories.md#ichargingprofilerepository)

---

### IChargingStationSecurityInfoRepository

Re-exports [IChargingStationSecurityInfoRepository](src/interfaces/repositories.md#ichargingstationsecurityinforepository)

---

### IChargingStationSequenceRepository

Re-exports [IChargingStationSequenceRepository](src/interfaces/repositories.md#ichargingstationsequencerepository)

---

### IDeleteCertificateAttemptRepository

Re-exports [IDeleteCertificateAttemptRepository](src/interfaces/repositories.md#ideletecertificateattemptrepository)

---

### IDeviceModelRepository

Re-exports [IDeviceModelRepository](src/interfaces/repositories.md#idevicemodelrepository)

---

### IInstallCertificateAttemptRepository

Re-exports [IInstallCertificateAttemptRepository](src/interfaces/repositories.md#iinstallcertificateattemptrepository)

---

### IInstalledCertificateRepository

Re-exports [IInstalledCertificateRepository](src/interfaces/repositories.md#iinstalledcertificaterepository)

---

### ILocalAuthListRepository

Re-exports [ILocalAuthListRepository](src/interfaces/repositories.md#ilocalauthlistrepository)

---

### ILocationRepository

Re-exports [ILocationRepository](src/interfaces/repositories.md#ilocationrepository)

---

### IMessageInfoRepository

Re-exports [IMessageInfoRepository](src/interfaces/repositories.md#imessageinforepository)

---

### InstallCertificateAttempt

Re-exports [InstallCertificateAttempt](src/layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)

---

### InstalledCertificate

Re-exports [InstalledCertificate](src/layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)

---

### InstallRootCertificateRequest

Re-exports [InstallRootCertificateRequest](src/interfaces/dtos/InstallRootCertificateRequest.md#installrootcertificaterequest)

---

### InstallRootCertificateSchema

Re-exports [InstallRootCertificateSchema](src/interfaces/queries/RootCertificate.md#installrootcertificateschema)

---

### IOCPPMessageRepository

Re-exports [IOCPPMessageRepository](src/interfaces/repositories.md#iocppmessagerepository)

---

### IReservationRepository

Re-exports [IReservationRepository](src/interfaces/repositories.md#ireservationrepository)

---

### ISecurityEventRepository

Re-exports [ISecurityEventRepository](src/interfaces/repositories.md#isecurityeventrepository)

---

### IServerNetworkProfileRepository

Re-exports [IServerNetworkProfileRepository](src/interfaces/repositories.md#iservernetworkprofilerepository)

---

### ISubscriptionRepository

Re-exports [ISubscriptionRepository](src/interfaces/repositories.md#isubscriptionrepository)

---

### ITariffRepository

Re-exports [ITariffRepository](src/interfaces/repositories.md#itariffrepository)

---

### ITenantRepository

Re-exports [ITenantRepository](src/interfaces/repositories.md#itenantrepository)

---

### ITransactionEventRepository

Re-exports [ITransactionEventRepository](src/interfaces/repositories.md#itransactioneventrepository)

---

### IVariableMonitoringRepository

Re-exports [IVariableMonitoringRepository](src/interfaces/repositories.md#ivariablemonitoringrepository)

---

### LocalListAuthorization

Re-exports [LocalListAuthorization](src/layers/sequelize/model/Authorization/LocalListAuthorization.md#locallistauthorization)

---

### LocalListVersion

Re-exports [LocalListVersion](src/layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)

---

### Location

Re-exports [Location](src/layers/sequelize/model/Location/Location.md#location)

---

### MeterValue

Re-exports [MeterValue](src/layers/sequelize/model/TransactionEvent/MeterValue.md#metervalue)

---

### ModelKeyQuerystring

Re-exports [ModelKeyQuerystring](src/interfaces/queries/Model.md#modelkeyquerystring)

---

### ModelKeyQuerystringSchema

Re-exports [ModelKeyQuerystringSchema](src/interfaces/queries/Model.md#modelkeyquerystringschema)

---

### NetworkProfileDeleteQuerySchema

Re-exports [NetworkProfileDeleteQuerySchema](src/interfaces/queries/NetworkProfile.md#networkprofiledeletequeryschema)

---

### NetworkProfileDeleteQuerystring

Re-exports [NetworkProfileDeleteQuerystring](src/interfaces/queries/NetworkProfile.md#networkprofiledeletequerystring)

---

### NetworkProfileQuerySchema

Re-exports [NetworkProfileQuerySchema](src/interfaces/queries/NetworkProfile.md#networkprofilequeryschema)

---

### NetworkProfileQuerystring

Re-exports [NetworkProfileQuerystring](src/interfaces/queries/NetworkProfile.md#networkprofilequerystring)

---

### OCPP1_6_Mapper

Renames and re-exports [01_Data/src/layers/sequelize/mapper/1.6](src/layers/sequelize/mapper/1.6.md)

---

### OCPP2_0_1_Mapper

Renames and re-exports [01_Data/src/layers/sequelize/mapper/2.0.1](src/layers/sequelize/mapper/2.0.1.md)

---

### OCPPMessage

Re-exports [OCPPMessage](src/layers/sequelize/model/OCPPMessage.md#ocppmessage)

---

### PaginatedParams

Re-exports [PaginatedParams](src/layers/sequelize/model/AsyncJob/AsyncJobStatus.md#paginatedparams-2)

---

### RegenerateExistingCertificate

Re-exports [RegenerateExistingCertificate](src/interfaces/dtos/RegenerateExistingCertificate.md#regenerateexistingcertificate)

---

### RegenerateInstalledCertificateSchema

Re-exports [RegenerateInstalledCertificateSchema](src/interfaces/queries/RootCertificate.md#regenerateinstalledcertificateschema)

---

### RepositoryStore

Re-exports [RepositoryStore](src/layers/sequelize/repository/RepositoryStore.md#repositorystore)

---

### Reservation

Re-exports [Reservation](src/layers/sequelize/model/Reservation.md#reservation)

---

### SendLocalList

Re-exports [SendLocalList](src/layers/sequelize/model/Authorization/SendLocalList.md#sendlocallist)

---

### sequelize

Renames and re-exports [01_Data/src/layers/sequelize](src/layers/sequelize.md)

---

### SequelizeAsyncJobStatusRepository

Re-exports [SequelizeAsyncJobStatusRepository](src/layers/sequelize/repository/AsyncJobStatus.md#sequelizeasyncjobstatusrepository)

---

### SequelizeAuthorizationRepository

Re-exports [SequelizeAuthorizationRepository](src/layers/sequelize/repository/Authorization.md#sequelizeauthorizationrepository)

---

### SequelizeBootRepository

Re-exports [SequelizeBootRepository](src/layers/sequelize/repository/Boot.md#sequelizebootrepository)

---

### SequelizeCertificateRepository

Re-exports [SequelizeCertificateRepository](src/layers/sequelize/repository/Certificate.md#sequelizecertificaterepository)

---

### SequelizeChangeConfigurationRepository

Re-exports [SequelizeChangeConfigurationRepository](src/layers/sequelize/repository/ChangeConfiguration.md#sequelizechangeconfigurationrepository)

---

### SequelizeChargingProfileRepository

Re-exports [SequelizeChargingProfileRepository](src/layers/sequelize/repository/ChargingProfile.md#sequelizechargingprofilerepository)

---

### SequelizeChargingStationSecurityInfoRepository

Re-exports [SequelizeChargingStationSecurityInfoRepository](src/layers/sequelize/repository/ChargingStationSecurityInfo.md#sequelizechargingstationsecurityinforepository)

---

### SequelizeChargingStationSequenceRepository

Re-exports [SequelizeChargingStationSequenceRepository](src/layers/sequelize/repository/ChargingStationSequence.md#sequelizechargingstationsequencerepository)

---

### SequelizeDeleteCertificateAttemptRepository

Re-exports [SequelizeDeleteCertificateAttemptRepository](src/layers/sequelize/repository/DeleteCertificateAttempt.md#sequelizedeletecertificateattemptrepository)

---

### SequelizeDeviceModelRepository

Re-exports [SequelizeDeviceModelRepository](src/layers/sequelize/repository/DeviceModel.md#sequelizedevicemodelrepository)

---

### SequelizeInstallCertificateAttemptRepository

Re-exports [SequelizeInstallCertificateAttemptRepository](src/layers/sequelize/repository/InstallCertificateAttempt.md#sequelizeinstallcertificateattemptrepository)

---

### SequelizeInstalledCertificateRepository

Re-exports [SequelizeInstalledCertificateRepository](src/layers/sequelize/repository/InstalledCertificate.md#sequelizeinstalledcertificaterepository)

---

### SequelizeLocationRepository

Re-exports [SequelizeLocationRepository](src/layers/sequelize/repository/Location.md#sequelizelocationrepository)

---

### SequelizeMessageInfoRepository

Re-exports [SequelizeMessageInfoRepository](src/layers/sequelize/repository/MessageInfo.md#sequelizemessageinforepository)

---

### SequelizeOCPPMessageRepository

Re-exports [SequelizeOCPPMessageRepository](src/layers/sequelize/repository/OCPPMessage.md#sequelizeocppmessagerepository)

---

### SequelizeRepository

Re-exports [SequelizeRepository](src/layers/sequelize/repository/Base.md#sequelizerepository)

---

### SequelizeReservationRepository

Re-exports [SequelizeReservationRepository](src/layers/sequelize/repository/Reservation.md#sequelizereservationrepository)

---

### SequelizeSecurityEventRepository

Re-exports [SequelizeSecurityEventRepository](src/layers/sequelize/repository/SecurityEvent.md#sequelizesecurityeventrepository)

---

### SequelizeServerNetworkProfileRepository

Re-exports [SequelizeServerNetworkProfileRepository](src/layers/sequelize/repository/ServerNetworkProfile.md#sequelizeservernetworkprofilerepository)

---

### SequelizeSubscriptionRepository

Re-exports [SequelizeSubscriptionRepository](src/layers/sequelize/repository/Subscription.md#sequelizesubscriptionrepository)

---

### SequelizeTariffRepository

Re-exports [SequelizeTariffRepository](src/layers/sequelize/repository/Tariff.md#sequelizetariffrepository)

---

### SequelizeTenantRepository

Re-exports [SequelizeTenantRepository](src/layers/sequelize/repository/Tenant.md#sequelizetenantrepository)

---

### SequelizeTransactionEventRepository

Re-exports [SequelizeTransactionEventRepository](src/layers/sequelize/repository/TransactionEvent.md#sequelizetransactioneventrepository)

---

### SequelizeVariableMonitoringRepository

Re-exports [SequelizeVariableMonitoringRepository](src/layers/sequelize/repository/VariableMonitoring.md#sequelizevariablemonitoringrepository)

---

### ServerNetworkProfile

Re-exports [ServerNetworkProfile](src/layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)

---

### SetNetworkProfile

Re-exports [SetNetworkProfile](src/layers/sequelize/model/Location/SetNetworkProfile.md#setnetworkprofile)

---

### SignatureAlgorithmEnumType

Re-exports [SignatureAlgorithmEnumType](src/layers/sequelize/model/Certificate.md#signaturealgorithmenumtype)

---

### StartTransaction

Re-exports [StartTransaction](src/layers/sequelize/model/TransactionEvent/StartTransaction.md#starttransaction)

---

### StatusNotification

Re-exports [StatusNotification](src/layers/sequelize/model/Location/StatusNotification.md#statusnotification)

---

### StopTransaction

Re-exports [StopTransaction](src/layers/sequelize/model/TransactionEvent/StopTransaction.md#stoptransaction)

---

### Subscription

Re-exports [Subscription](src/layers/sequelize/model/Subscription/Subscription.md#subscription)

---

### Tariff

Re-exports [Tariff](src/layers/sequelize/model/Tariff/Tariffs.md#tariff)

---

### TariffQuerySchema

Re-exports [TariffQuerySchema](src/interfaces/queries/Tariff.md#tariffqueryschema)

---

### TariffQueryString

Re-exports [TariffQueryString](src/interfaces/queries/Tariff.md#tariffquerystring)

---

### Tenant

Re-exports [Tenant](src/layers/sequelize/model/Tenant.md#tenant)

---

### TenantPartner

Re-exports [TenantPartner](src/layers/sequelize/model/TenantPartner.md#tenantpartner)

---

### TenantQuerySchema

Re-exports [TenantQuerySchema](src/interfaces/queries/Tenant.md#tenantqueryschema)

---

### TenantQueryString

Re-exports [TenantQueryString](src/interfaces/queries/Tenant.md#tenantquerystring)

---

### TlsCertificateSchema

Re-exports [TlsCertificateSchema](src/interfaces/queries/TlsCertificate.md#tlscertificateschema)

---

### TlsCertificatesRequest

Re-exports [TlsCertificatesRequest](src/interfaces/dtos/TlsCertificatesRequest.md#tlscertificatesrequest)

---

### Transaction

Re-exports [Transaction](src/layers/sequelize/model/TransactionEvent/Transaction.md#transaction)

---

### TransactionEvent

Re-exports [TransactionEvent](src/layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)

---

### TransactionEventQuerySchema

Re-exports [TransactionEventQuerySchema](src/interfaces/queries/TransactionEvent.md#transactioneventqueryschema)

---

### TransactionEventQuerystring

Re-exports [TransactionEventQuerystring](src/interfaces/queries/TransactionEvent.md#transactioneventquerystring)

---

### UpdateChargingStationPasswordQuerySchema

Re-exports [UpdateChargingStationPasswordQuerySchema](src/interfaces/queries/UpdateChargingStationPasswordQuery.md#updatechargingstationpasswordqueryschema)

---

### UpdateChargingStationPasswordQueryString

Re-exports [UpdateChargingStationPasswordQueryString](src/interfaces/queries/UpdateChargingStationPasswordQuery.md#updatechargingstationpasswordquerystring)

---

### UpdateTlsCertificateQuerySchema

Re-exports [UpdateTlsCertificateQuerySchema](src/interfaces/queries/TlsCertificate.md#updatetlscertificatequeryschema)

---

### UpdateTlsCertificateQueryString

Re-exports [UpdateTlsCertificateQueryString](src/interfaces/queries/TlsCertificate.md#updatetlscertificatequerystring)

---

### UploadExistingCertificate

Re-exports [UploadExistingCertificate](src/interfaces/dtos/UploadExistingCertificate.md#uploadexistingcertificate)

---

### UploadExistingCertificateSchema

Re-exports [UploadExistingCertificateSchema](src/interfaces/queries/RootCertificate.md#uploadexistingcertificateschema)

---

### Variable

Re-exports [Variable](src/layers/sequelize/model/DeviceModel/Variable.md#variable)

---

### VariableAttribute

Re-exports [VariableAttribute](src/layers/sequelize/model/DeviceModel/VariableAttribute.md#variableattribute)

---

### VariableAttributeQuerySchema

Re-exports [VariableAttributeQuerySchema](src/interfaces/queries/VariableAttribute.md#variableattributequeryschema)

---

### VariableAttributeQuerystring

Re-exports [VariableAttributeQuerystring](src/interfaces/queries/VariableAttribute.md#variableattributequerystring)

---

### VariableCharacteristics

Re-exports [VariableCharacteristics](src/layers/sequelize/model/DeviceModel/VariableCharacteristics.md#variablecharacteristics)

---

### VariableStatus

Re-exports [VariableStatus](src/layers/sequelize/model/DeviceModel/VariableStatus.md#variablestatus)

---

### WebsocketDeleteQuerySchema

Re-exports [WebsocketDeleteQuerySchema](src/interfaces/queries/Websocket.md#websocketdeletequeryschema)

---

### WebsocketDeleteQuerystring

Re-exports [WebsocketDeleteQuerystring](src/interfaces/queries/Websocket.md#websocketdeletequerystring)

---

### WebsocketGetQuerySchema

Re-exports [WebsocketGetQuerySchema](src/interfaces/queries/Websocket.md#websocketgetqueryschema)

---

### WebsocketGetQuerystring

Re-exports [WebsocketGetQuerystring](src/interfaces/queries/Websocket.md#websocketgetquerystring)

---

### WebsocketMappingQuerySchema

Re-exports [WebsocketMappingQuerySchema](src/interfaces/queries/Websocket.md#websocketmappingqueryschema)

---

### WebsocketMappingQuerystring

Re-exports [WebsocketMappingQuerystring](src/interfaces/queries/Websocket.md#websocketmappingquerystring)

---

### WebsocketMappingRequestSchema

Re-exports [WebsocketMappingRequestSchema](src/interfaces/queries/Websocket.md#websocketmappingrequestschema)

---

### WebsocketRequestSchema

Re-exports [WebsocketRequestSchema](src/interfaces/queries/Websocket.md#websocketrequestschema)
