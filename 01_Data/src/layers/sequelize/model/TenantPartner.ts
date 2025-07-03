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
import { CredentialRole, Version, VersionEndpoint } from '../../../interfaces/ocpi';
import { JSONB } from '../util';

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
  declare clientCredentialsRoles: JSONB<CredentialRole[]>;

  @Column(DataType.JSONB)
  declare clientVersions: JSONB<Version[]>;

  @Column(DataType.JSONB)
  declare cpoTenants: JSONB;

  @Column(DataType.JSONB)
  declare endpoints: JSONB;

  @Column(DataType.JSONB)
  declare versions: JSONB<Version[]>;

  @Column(DataType.JSONB)
  declare versionEndpoints: JSONB<VersionEndpoint[]>;
}
