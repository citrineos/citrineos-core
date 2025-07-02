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

  // OCPI/Protocol-agnostic partner details
  @Column(DataType.JSONB)
  declare businessDetails: object;

  @Column(DataType.JSONB)
  declare clientCredentialsRoles: object;

  @Column(DataType.JSONB)
  declare clientInformations: object;

  @Column(DataType.JSONB)
  declare clientVersions: object;

  @Column(DataType.JSONB)
  declare cpoTenants: object;

  @Column(DataType.JSONB)
  declare endpoints: object;

  @Column(DataType.JSONB)
  declare images: object;

  @Column(DataType.JSONB)
  declare versions: object;

  @Column(DataType.JSONB)
  declare versionEndpoints: object;
}
