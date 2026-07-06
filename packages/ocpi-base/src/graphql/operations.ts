// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  bigint: { input: any; output: any };
  bpchar: { input: any; output: any };
  enum_InstalledCertificates_certificateType: { input: any; output: any };
  geography: { input: any; output: any };
  geometry: { input: any; output: any };
  json: { input: any; output: any };
  jsonb: { input: any; output: any };
  numeric: { input: any; output: any };
  timestamptz: { input: any; output: any };
};
export type Authorizations_Set_Input = {
  additionalInfo?: InputMaybe<Scalars['jsonb']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  language1?: InputMaybe<Scalars['String']['input']>;
  groupAuthorizationId?: InputMaybe<Scalars['Int']['input']>;
  realTimeAuth?: InputMaybe<Scalars['String']['input']>;
  updatedAt: Scalars['timestamptz']['input'];
};
export type Locations_Bool_Exp = {
  updatedAt?: InputMaybe<Timestamptz_Comparison_Exp>;
  Tenant?: InputMaybe<Tenants_Bool_Exp>;
};
export type Tariffs_Bool_Exp = {
  updatedAt?: InputMaybe<Timestamptz_Comparison_Exp>;
  Tenant?: InputMaybe<Tenants_Bool_Exp>;
};
export type Transactions_Bool_Exp = {
  updatedAt?: InputMaybe<Timestamptz_Comparison_Exp>;
  Authorization?: InputMaybe<Authorizations_Bool_Exp>;
  Tenant?: InputMaybe<Tenants_Bool_Exp>;
};
export type Authorizations_Bool_Exp = {
  TenantPartner?: InputMaybe<TenantPartners_Bool_Exp>;
};
export type Timestamptz_Comparison_Exp = {
  _gte?: InputMaybe<Scalars['timestamptz']['input']>;
  _lte?: InputMaybe<Scalars['timestamptz']['input']>;
};
export type Tenants_Bool_Exp = {
  countryCode?: InputMaybe<String_Comparison_Exp>;
  partyId?: InputMaybe<String_Comparison_Exp>;
};
export type TenantPartners_Bool_Exp = {
  countryCode?: InputMaybe<String_Comparison_Exp>;
  partyId?: InputMaybe<String_Comparison_Exp>;
};
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']['input']>;
};
export type GetChargingStationByPkQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetChargingStationByPkQueryResult = GetChargingStationByIdQueryResult;

export type GetChargingStationByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;

export type GetChargingStationByIdQueryResult = {
  ChargingStations: Array<{
    id: number;
    ocppConnectionName: string;
    tenantId: number;
    isOnline: boolean;
    protocol?: string | null;
    chargePointVendor?: string | null;
    chargePointModel?: string | null;
    chargePointSerialNumber?: string | null;
    chargeBoxSerialNumber?: string | null;
    firmwareVersion?: string | null;
    iccid?: string | null;
    imsi?: string | null;
    meterType?: string | null;
    meterSerialNumber?: string | null;
    locationId?: number | null;
    createdAt: any;
    updatedAt: any;
    evses: Array<{
      id: number;
      tenantId: number;
      ocppConnectionName: string;
      evseTypeId?: number | null;
      evseId: string;
      physicalReference?: string | null;
      removed?: boolean | null;
      createdAt: any;
      updatedAt: any;
    }>;
    connectors: Array<{
      id: number;
      tenantId: number;
      ocppConnectionName: string;
      evseId: number;
      connectorId: number;
      evseTypeConnectorId?: number | null;
      status?: any | null;
      errorCode?: any | null;
      timestamp: string;
      info?: string | null;
      vendorId?: string | null;
      vendorErrorCode?: string | null;
      createdAt: any;
      updatedAt: any;
    }>;
    tenant: {
      partyId: string;
      countryCode: string;
      name: string;
      isUserTenant: boolean;
    };
  }>;
};

export type GetSequenceQueryVariables = Exact<{
  tenantId: Scalars['Int']['input'];
  stationId: Scalars['Int']['input'];
  type: Scalars['String']['input'];
}>;

export type GetSequenceQueryResult = {
  ChargingStationSequences: Array<{
    value: any;
  }>;
};

export type UpsertSequenceMutationVariables = Exact<{
  tenantId: Scalars['Int']['input'];
  stationId: Scalars['Int']['input'];
  ocppConnectionName: Scalars['String']['input'];
  type: Scalars['String']['input'];
  value: Scalars['bigint']['input'];
  createdAt: Scalars['timestamptz']['input'];
}>;

export type UpsertSequenceMutationResult = {
  insert_ChargingStationSequences_one?: {
    value: any;
  } | null;
};

export type GetLocationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  where: Locations_Bool_Exp;
}>;

export type GetLocationsQueryResult = {
  Locations: Array<{
    id: number;
    name: string;
    address: string;
    city: string;
    coordinates: any;
    country: string;
    createdAt: any;
    facilities?: any | null;
    openingHours?: any | null;
    parkingType?: string | null;
    postalCode: string;
    publishUpstream: boolean;
    state: string;
    timeZone: string;
    updatedAt: any;
    tenant: {
      partyId: string;
      countryCode: string;
      name: string;
      isUserTenant: boolean;
    };
    chargingPool: Array<{
      id: number;
      ocppConnectionName: string;
      isOnline: boolean;
      protocol?: string | null;
      capabilities?: any | null;
      chargePointVendor?: string | null;
      chargePointModel?: string | null;
      chargePointSerialNumber?: string | null;
      chargeBoxSerialNumber?: string | null;
      coordinates?: any | null;
      firmwareVersion?: string | null;
      floorLevel?: string | null;
      iccid?: string | null;
      imsi?: string | null;
      meterType?: string | null;
      meterSerialNumber?: string | null;
      parkingRestrictions?: any | null;
      locationId?: number | null;
      createdAt: any;
      updatedAt: any;
      evses: Array<{
        id: number;
        ocppConnectionName: string;
        evseTypeId?: number | null;
        evseId: string;
        physicalReference?: string | null;
        removed?: boolean | null;
        createdAt: any;
        updatedAt: any;
        connectors: Array<{
          id: number;
          ocppConnectionName: string;
          evseId: number;
          connectorId: number;
          evseTypeConnectorId?: number | null;
          format?: string | null;
          maximumAmperage?: number | null;
          maximumPowerWatts?: number | null;
          maximumVoltage?: number | null;
          powerType?: string | null;
          termsAndConditionsUrl?: string | null;
          type?: string | null;
          status?: any | null;
          errorCode?: any | null;
          timestamp: string;
          info?: string | null;
          vendorId?: string | null;
          vendorErrorCode?: string | null;
          createdAt: any;
          updatedAt: any;
        }>;
      }>;
    }>;
  }>;
};

export type GetLocationByIdQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetLocationByIdQueryResult = {
  Locations: Array<{
    id: number;
    name: string;
    address: string;
    city: string;
    coordinates: any;
    country: string;
    createdAt: any;
    facilities?: any | null;
    openingHours?: any | null;
    parkingType?: string | null;
    postalCode: string;
    publishUpstream: boolean;
    state: string;
    timeZone: string;
    updatedAt: any;
    tenant: {
      partyId: string;
      countryCode: string;
      name: string;
      isUserTenant: boolean;
    };
    chargingPool: Array<{
      id: number;
      ocppConnectionName: string;
      isOnline: boolean;
      protocol?: string | null;
      capabilities?: any | null;
      chargePointVendor?: string | null;
      chargePointModel?: string | null;
      chargePointSerialNumber?: string | null;
      chargeBoxSerialNumber?: string | null;
      coordinates?: any | null;
      firmwareVersion?: string | null;
      floorLevel?: string | null;
      iccid?: string | null;
      imsi?: string | null;
      meterType?: string | null;
      meterSerialNumber?: string | null;
      parkingRestrictions?: any | null;
      locationId?: number | null;
      createdAt: any;
      updatedAt: any;
      evses: Array<{
        id: number;
        ocppConnectionName: string;
        evseTypeId?: number | null;
        evseId: string;
        physicalReference?: string | null;
        removed?: boolean | null;
        createdAt: any;
        updatedAt: any;
        connectors: Array<{
          id: number;
          ocppConnectionName: string;
          evseId: number;
          connectorId: number;
          evseTypeConnectorId?: number | null;
          format?: string | null;
          maximumAmperage?: number | null;
          maximumPowerWatts?: number | null;
          maximumVoltage?: number | null;
          powerType?: string | null;
          termsAndConditionsUrl?: string | null;
          type?: string | null;
          status?: any | null;
          errorCode?: any | null;
          timestamp: string;
          info?: string | null;
          vendorId?: string | null;
          vendorErrorCode?: string | null;
          createdAt: any;
          updatedAt: any;
        }>;
      }>;
    }>;
  }>;
};

export type GetEvseByIdQueryVariables = Exact<{
  locationId: Scalars['Int']['input'];
  stationId: Scalars['String']['input'];
  evseId: Scalars['Int']['input'];
}>;

export type GetEvseByIdQueryResult = {
  Locations: Array<{
    chargingPool: Array<{
      id: number;
      ocppConnectionName: string;
      isOnline: boolean;
      protocol?: string | null;
      capabilities?: any | null;
      chargePointVendor?: string | null;
      chargePointModel?: string | null;
      chargePointSerialNumber?: string | null;
      chargeBoxSerialNumber?: string | null;
      coordinates?: any | null;
      firmwareVersion?: string | null;
      floorLevel?: string | null;
      iccid?: string | null;
      imsi?: string | null;
      meterType?: string | null;
      meterSerialNumber?: string | null;
      parkingRestrictions?: any | null;
      locationId?: number | null;
      createdAt: any;
      updatedAt: any;
      evses: Array<{
        id: number;
        ocppConnectionName: string;
        evseTypeId?: number | null;
        evseId: string;
        physicalReference?: string | null;
        removed?: boolean | null;
        createdAt: any;
        updatedAt: any;
      }>;
    }>;
  }>;
};

export type GetConnectorByIdQueryVariables = Exact<{
  locationId: Scalars['Int']['input'];
  stationId: Scalars['String']['input'];
  evseId: Scalars['Int']['input'];
  connectorId: Scalars['Int']['input'];
}>;

export type GetConnectorByIdQueryResult = {
  Locations: Array<{
    chargingPool: Array<{
      evses: Array<{
        connectors: Array<{
          id: number;
          ocppConnectionName: string;
          evseId: number;
          connectorId: number;
          evseTypeConnectorId?: number | null;
          format?: string | null;
          maximumAmperage?: number | null;
          maximumPowerWatts?: number | null;
          maximumVoltage?: number | null;
          powerType?: string | null;
          termsAndConditionsUrl?: string | null;
          type?: string | null;
          status?: any | null;
          errorCode?: any | null;
          timestamp: string;
          info?: string | null;
          vendorId?: string | null;
          vendorErrorCode?: string | null;
          createdAt: any;
          updatedAt: any;
        }>;
      }>;
    }>;
  }>;
};

export type GetTariffByKeyQueryVariables = Exact<{
  id: Scalars['Int']['input'];
  countryCode: Scalars['String']['input'];
  partyId: Scalars['String']['input'];
}>;

export type GetTariffByKeyQueryResult = {
  Tariffs: Array<{
    authorizationAmount?: any | null;
    createdAt: any;
    currency: any;
    id: number;
    paymentFee?: any | null;
    pricePerKwh: any;
    pricePerMin?: any | null;
    pricePerSession?: any | null;
    taxRate?: any | null;
    tariffAltText?: string | null;
    updatedAt: any;
    tenant: {
      countryCode: string;
      partyId: string;
    };
  }>;
};

export type GetTariffsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  where: Tariffs_Bool_Exp;
}>;

export type GetTariffsQueryResult = {
  Tariffs: Array<{
    authorizationAmount?: any | null;
    createdAt: any;
    currency: any;
    id: number;
    paymentFee?: any | null;
    pricePerKwh: any;
    pricePerMin?: any | null;
    pricePerSession?: any | null;
    taxRate?: any | null;
    tariffAltText?: string | null;
    updatedAt: any;
    tenant: {
      countryCode: string;
      partyId: string;
    };
  }>;
};

export type UpdateTenantPartnerProfileMutationVariables = Exact<{
  partnerId: Scalars['Int']['input'];
  input: Scalars['jsonb']['input'];
}>;

export type UpdateTenantPartnerProfileMutationResult = {
  update_TenantPartners?: {
    affected_rows: number;
  } | null;
};

export type DeleteTenantPartnerByIdMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteTenantPartnerByIdMutationResult = {
  delete_TenantPartners?: {
    affected_rows: number;
  } | null;
};

export type GetTenantPartnerByServerTokenQueryVariables = Exact<{
  serverToken: Scalars['String']['input'];
}>;

export type GetTenantPartnerByServerTokenQueryResult = {
  TenantPartners: Array<{
    id: number;
    countryCode: string;
    partyId: string;
    partnerProfileOCPI?: any | null;
    tenantId: number;
    tenant: {
      id: number;
      countryCode: string;
      partyId: string;
      serverProfileOCPI?: any | null;
    };
  }>;
};

export type GetTenantPartnerByIdQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetTenantPartnerByIdQueryResult = {
  TenantPartners_by_pk?: {
    id: number;
    countryCode: string;
    partyId: string;
    partnerProfileOCPI?: any | null;
    tenantId: number;
    tenant: {
      id: number;
      countryCode: string;
      partyId: string;
      serverProfileOCPI?: any | null;
    };
  } | null;
};

export type DeleteTenantPartnerByServerTokenMutationVariables = Exact<{
  serverToken: Scalars['String']['input'];
}>;

export type DeleteTenantPartnerByServerTokenMutationResult = {
  delete_TenantPartners?: {
    affected_rows: number;
  } | null;
};

export type GetTenantPartnerByCpoClientAndModuleIdQueryVariables = Exact<{
  cpoCountryCode: Scalars['String']['input'];
  cpoPartyId: Scalars['String']['input'];
  clientCountryCode?: InputMaybe<Scalars['String']['input']>;
  clientPartyId?: InputMaybe<Scalars['String']['input']>;
}>;

export type GetTenantPartnerByCpoClientAndModuleIdQueryResult = {
  TenantPartners: Array<{
    id: number;
    countryCode: string;
    partyId: string;
    partnerProfileOCPI?: any | null;
    tenantId: number;
    tenant: {
      id: number;
      countryCode: string;
      partyId: string;
      serverProfileOCPI?: any | null;
    };
  }>;
};

export type TenantPartnersListQueryVariables = Exact<{
  cpoCountryCode: Scalars['String']['input'];
  cpoPartyId: Scalars['String']['input'];
  endpointIdentifier: Scalars['String']['input'];
}>;

export type TenantPartnersListQueryResult = {
  TenantPartners: Array<{
    id: number;
    countryCode: string;
    partyId: string;
    partnerProfileOCPI?: any | null;
    tenantId: number;
    tenant: {
      id: number;
      countryCode: string;
      partyId: string;
      serverProfileOCPI?: any | null;
    };
  }>;
};

export type GetTenantByIdQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetTenantByIdQueryResult = {
  Tenants: Array<{
    serverProfileOCPI?: any | null;
    countryCode: string;
    partyId: string;
  }>;
};

export type ReadAuthorizationsQueryVariables = Exact<{
  idToken?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  countryCode?: InputMaybe<Scalars['String']['input']>;
  partyId?: InputMaybe<Scalars['String']['input']>;
}>;

export type ReadAuthorizationsQueryResult = {
  Authorizations: Array<{
    id: number;
    createdAt: any;
    updatedAt: any;
    tenantId: number;
    idToken: string;
    idTokenType?: string | null;
    additionalInfo?: any | null;
    status: string;
    realTimeAuth: string;
    language1?: string | null;
    groupAuthorizationId?: number | null;
    tenantPartner?: {
      id: number;
      countryCode: string;
      partyId: string;
    } | null;
    groupAuthorization?: {
      idToken: string;
    } | null;
  }>;
};

export type UpdateAuthorizationMutationVariables = Exact<{
  idToken: Scalars['String']['input'];
  type: Scalars['String']['input'];
  tenantPartnerId: Scalars['Int']['input'];
  set?: InputMaybe<Authorizations_Set_Input>;
}>;

export type UpdateAuthorizationMutationResult = {
  update_Authorizations?: {
    returning: Array<{
      id: number;
      createdAt: any;
      updatedAt: any;
      tenantId: number;
      idToken: string;
      idTokenType?: string | null;
      additionalInfo?: any | null;
      status: string;
      realTimeAuth: string;
      language1?: string | null;
      groupAuthorizationId?: number | null;
      tenantPartner?: {
        id: number;
        countryCode: string;
        partyId: string;
      } | null;
      groupAuthorization?: {
        idToken: string;
      } | null;
    }>;
  } | null;
};

export type GetAuthorizationByTokenQueryVariables = Exact<{
  idToken: Scalars['String']['input'];
  idTokenType: Scalars['String']['input'];
  tenantPartnerId: Scalars['Int']['input'];
}>;

export type GetAuthorizationByTokenQueryResult = {
  Authorizations: Array<{
    id: number;
    idToken: string;
    idTokenType?: string | null;
    tenantId: number;
    additionalInfo?: any | null;
    groupAuthorizationId?: number | null;
    status: string;
    realTimeAuth: string;
    language1?: string | null;
    createdAt: any;
    updatedAt: any;
    tenantPartner?: {
      id: number;
      countryCode: string;
      partyId: string;
    } | null;
    groupAuthorization?: {
      idToken: string;
    } | null;
  }>;
};

export type GetAuthorizationByIdQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetAuthorizationByIdQueryResult = {
  Authorizations_by_pk?: {
    id: number;
    idToken: string;
    idTokenType?: string | null;
    tenantId: number;
    additionalInfo?: any | null;
    groupAuthorizationId?: number | null;
    status: string;
    realTimeAuth: string;
    language1?: string | null;
    createdAt: any;
    updatedAt: any;
    tenantPartner?: {
      id: number;
      countryCode: string;
      partyId: string;
    } | null;
    groupAuthorization?: {
      idToken: string;
    } | null;
  } | null;
};

export type CreateAuthorizationMutationVariables = Exact<{
  tenantId: Scalars['Int']['input'];
  tenantPartnerId: Scalars['Int']['input'];
  idToken: Scalars['String']['input'];
  idTokenType: Scalars['String']['input'];
  additionalInfo?: InputMaybe<Scalars['jsonb']['input']>;
  status: Scalars['String']['input'];
  language1?: InputMaybe<Scalars['String']['input']>;
  groupAuthorizationId?: InputMaybe<Scalars['Int']['input']>;
  realTimeAuth?: InputMaybe<Scalars['String']['input']>;
  createdAt: Scalars['timestamptz']['input'];
  updatedAt: Scalars['timestamptz']['input'];
}>;

export type CreateAuthorizationMutationResult = {
  insert_Authorizations_one?: {
    id: number;
    createdAt: any;
    updatedAt: any;
    tenantId: number;
    idToken: string;
    idTokenType?: string | null;
    additionalInfo?: any | null;
    status: string;
    realTimeAuth: string;
    language1?: string | null;
    groupAuthorizationId?: number | null;
    tenantPartner?: {
      id: number;
      countryCode: string;
      partyId: string;
    } | null;
    groupAuthorization?: {
      idToken: string;
    } | null;
  } | null;
};

export type GetGroupAuthorizationQueryVariables = Exact<{
  groupId: Scalars['String']['input'];
  tenantPartnerId: Scalars['Int']['input'];
}>;

export type GetGroupAuthorizationQueryResult = {
  Authorizations: Array<{
    id: number;
    idToken: string;
    idTokenType?: string | null;
  }>;
};

export type GetTransactionsQueryVariables = Exact<{
  offset?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  where: Transactions_Bool_Exp;
}>;

export type GetTransactionsQueryResult = {
  Transactions: Array<{
    id: number;
    stationId: number;
    ocppConnectionName: string;
    transactionId: string;
    isActive: boolean;
    station: {
      ocppConnectionName: string;
      isOnline: boolean;
    };
    chargingState?: string | null;
    timeSpentCharging?: any | null;
    totalKwh?: any | null;
    stoppedReason?: string | null;
    remoteStartId?: number | null;
    totalCost?: any | null;
    startTime?: any | null;
    endTime?: any | null;
    createdAt: any;
    updatedAt: any;
    evseId?: number | null;
    connectorId?: number | null;
    locationId?: number | null;
    authorizationId?: number | null;
    tariffId?: number | null;
    tenant: {
      countryCode: string;
      partyId: string;
      name: string;
      isUserTenant: boolean;
    };
    transactionEvents: Array<{
      id: number;
      eventType?: string | null;
      transactionInfo?: any | null;
      EvseType?: {
        id?: number | null;
      } | null;
    }>;
    startTransaction?: {
      timestamp?: any | null;
    } | null;
    stopTransaction?: {
      timestamp?: any | null;
    } | null;
    meterValues: Array<{
      timestamp?: any | null;
      sampledValue?: any | null;
    }>;
  }>;
};

export type GetTransactionByTransactionIdQueryVariables = Exact<{
  transactionId: Scalars['String']['input'];
}>;

export type GetTransactionByTransactionIdQueryResult = {
  Transactions: Array<{
    id: number;
    stationId: number;
    ocppConnectionName: string;
    transactionId: string;
    isActive: boolean;
    chargingState?: string | null;
    timeSpentCharging?: any | null;
    totalKwh?: any | null;
    stoppedReason?: string | null;
    remoteStartId?: number | null;
    totalCost?: any | null;
    startTime?: any | null;
    endTime?: any | null;
    createdAt: any;
    updatedAt: any;
    evseId?: number | null;
    connectorId?: number | null;
    locationId?: number | null;
    authorizationId?: number | null;
    tariffId?: number | null;
    tenant: {
      countryCode: string;
      partyId: string;
      name: string;
      isUserTenant: boolean;
    };
    authorization?: {
      tenantPartner?: {
        id: number;
        countryCode: string;
        partyId: string;
        partnerProfileOCPI?: any | null;
        tenant: {
          id: number;
          countryCode: string;
          partyId: string;
        };
      } | null;
    } | null;
    station: {
      id: number;
      ocppConnectionName: string;
      isOnline: boolean;
    };
    transactionEvents: Array<{
      id: number;
      eventType?: string | null;
      transactionInfo?: any | null;
      EvseType?: {
        id?: number | null;
      } | null;
    }>;
    startTransaction?: {
      timestamp?: any | null;
    } | null;
    stopTransaction?: {
      timestamp?: any | null;
    } | null;
    meterValues: Array<{
      timestamp?: any | null;
      sampledValue?: any | null;
    }>;
  }>;
};
