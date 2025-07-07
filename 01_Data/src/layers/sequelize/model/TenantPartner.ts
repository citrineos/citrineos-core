import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from './Tenant';
import { JSONB } from '../util';
import { CredentialRole, Credentials, Endpoint, Version } from '../../../interfaces/ocpi';

@Table
export class TenantPartner extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Tenant)
  @Column(DataType.INTEGER)
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;

  @Column(DataType.JSONB)
  declare partnerProfile: JSONB<{
    protocol: string;
    version: string;
    party_id: string;
    country_code: string;
    roles: CredentialRole[];
    credentials?: Credentials;
    endpoints?: Endpoint[];
    versionEndpoints?: Version[];
    relatedPartners?: Array<{
      partnerId: number;
      relationshipType?: string;
    }>;
  }>;
}
