import { Column, DataType, HasMany, Table } from 'sequelize-typescript';
import { OCPIRegistration } from '@citrineos/base';
import { BaseModelWithTenant } from './BaseModelWithTenant';
import { ITenantPartnerDto } from '@citrineos/base/src/interfaces/dto/tenant.partner.dto';
import { Authorization } from './Authorization';

@Table
export class TenantPartner extends BaseModelWithTenant implements ITenantPartnerDto {
  static readonly MODEL_NAME: string = 'TenantPartner';

  @Column(DataType.STRING)
  declare partyId: string;

  @Column(DataType.STRING)
  declare countryCode: string;

  @Column(DataType.JSONB)
  declare partnerProfileOCPI: OCPIRegistration.PartnerProfile;

  @HasMany(() => Authorization)
  declare authorizations: Authorization[];
}
