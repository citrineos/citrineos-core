import {Controller, Get, Param, QueryParams} from 'routing-controllers';
import {HttpStatus, OcpiResponse, VersionNumber} from '@citrineos/base';
import {Cdr, CdrListResponse, CdrResponse} from '../model/Cdr';
import {BaseController} from './base.controller';
import {FromToOffsetLimitQuery} from '../modules/temp/schema/from.to.offset.limit.query.schema';
import {ResponseSchema} from 'routing-controllers-openapi';
import {AsOcpiEndpoint} from '../util/decorators/as.ocpi.endpoint';
import {VersionNumberParam} from "../util/decorators/version.number.param";
import {EnumParam} from "../util/decorators/enum.param";
import {VersionNumberEnumName} from "../model/VersionNumber";

@Controller()
export class CdrsController extends BaseController {
  @Get('/sender/:versionId/cdrs/page/:uid')
  @AsOcpiEndpoint()
  @ResponseSchema(CdrListResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async getCdrPageFromDataOwner(
    @VersionNumberParam() _versionId: VersionNumber,
    @Param('uid') _uid: string,
  ): Promise<OcpiResponse<Cdr[]>> {
    console.log('getCdrPageFromDataOwner', _versionId, _uid);
    return this.generateMockOcpiResponse(CdrListResponse);
  }

  @Get('/sender/:versionId/cdrs')
  @AsOcpiEndpoint()
  @ResponseSchema(CdrResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async getCdrsFromDataOwner(
    @VersionNumberParam() _versionId: VersionNumber,
    @QueryParams() _query?: FromToOffsetLimitQuery,
  ): Promise<OcpiResponse<Cdr>> {
    console.log('getCdrsFromDataOwner', _versionId, _query);
    return this.generateMockOcpiResponse(CdrResponse);
  }
}
