[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 01_Data/src/interfaces/projections/AuthorizationRestrictions

# 01_Data/src/interfaces/projections/AuthorizationRestrictions

## Interfaces

### AuthorizationRestrictions

Defined in: [01_Data/src/interfaces/projections/AuthorizationRestrictions.ts:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/AuthorizationRestrictions.ts#L5)

#### Properties

| Property                                                          | Type       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Defined in                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="allowedconnectortypes"></a> `allowedConnectorTypes?`       | `string`[] | If present, connector types this authorization profile is permitted to charge at. SHALL use options in ConnectorEnumType if applicable, plus "cGBT, cChaoJi, OppCharge" as mentioned in information model, or a custom option if nothing else fits.                                                                                                                                                                                                                                                     | [01_Data/src/interfaces/projections/AuthorizationRestrictions.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/AuthorizationRestrictions.ts#L12) |
| <a id="disallowedevseidprefixes"></a> `disallowedEvseIdPrefixes?` | `string`[] | If present, this list will be used to prevent charging at evses which match one of its strings. EvseId is as defined in Part 2 - Appendices of OCPP 2.0.1, which references the ISO 15118/IEC 63119-2 format. Strings in this list are treated as prefixes for matching purposes to allow hierarchical id semantics to exclude entire stations with one entry, i.e. "US\*A23\*E00235" will match "US\*A23\*E00235\*1" and "US\*A23\*E00235\*2", which could represent Evse 1 and 2 at the same station. | [01_Data/src/interfaces/projections/AuthorizationRestrictions.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/projections/AuthorizationRestrictions.ts#L22) |
