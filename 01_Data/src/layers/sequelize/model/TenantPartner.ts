import { Column, DataType, Table } from 'sequelize-typescript';
import { OCPIRegistration } from '@citrineos/base';
import { BaseModelWithTenant } from './BaseModelWithTenant';
import { ITenantPartnerDto } from '@citrineos/base/src/interfaces/dto/tenant.partner.dto';

@Table
export class TenantPartner extends BaseModelWithTenant implements ITenantPartnerDto {
  static readonly MODEL_NAME: string = 'TenantPartner';

  @Column(DataType.STRING)
  declare partyId: string;

  @Column(DataType.STRING)
  declare countryCode: string;

  @Column(DataType.JSONB)
  declare partnerProfileOCPI: OCPIRegistration.PartnerProfile;
}
