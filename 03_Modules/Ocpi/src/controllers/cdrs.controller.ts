import {Controller, Get, HeaderParams, Params, QueryParams} from 'routing-controllers';
import {HttpStatus, OcpiResponse} from '@citrineos/base';
import {Cdr, CdrListResponse, CdrResponse} from '../model/Cdr';
import {BaseController} from './base.controller';
import {UidVersionIdParam} from '../modules/temp/schema/uid.version.id.param.schema';
import {AuthorizationHeader} from '../modules/temp/schema/authorizationHeader';
import {VersionIdParam} from '../modules/temp/schema/version.id.param.schema';
import {FromToOffsetLimitQuery} from '../modules/temp/schema/from.to.offset.limit.query.schema';
import {ResponseSchema} from 'routing-controllers-openapi';

@Controller()
export class CdrsController extends BaseController {

  @Get('/sender/:versionId/cdrs/page/:uid')
  @ResponseSchema(CdrListResponse, {statusCode: HttpStatus.OK, description: 'Successful response'})
  async getCdrPageFromDataOwner(
    @HeaderParams() authorizationHeader: AuthorizationHeader,
    @Params() uid: UidVersionIdParam,
  ): Promise<OcpiResponse<Cdr[]>> {
    return this.generateMockResponse(OcpiResponse<Cdr[]>);
  }

  @Get('/sender/:versionId/cdrs')
  @ResponseSchema(CdrResponse, {statusCode: HttpStatus.OK, description: 'Successful response'})
  async getCdrsFromDataOwner(
    @HeaderParams() authorizationHeader: AuthorizationHeader,
    @Params() versionId: VersionIdParam,
    @QueryParams() query?: FromToOffsetLimitQuery,
  ): Promise<OcpiResponse<Cdr>> {
    return this.generateMockResponse(OcpiResponse<Cdr>);
  }
}
