import {Controller, Get, QueryParams} from 'routing-controllers';
import {HttpStatus} from '@citrineos/base';
import {Cdr, CdrResponse} from '../model/Cdr';
import {BaseController} from './base.controller';
import {FromToOffsetLimitQuery} from '../modules/temp/schema/from.to.offset.limit.query.schema';
import {ResponseSchema} from 'routing-controllers-openapi';
import {AsOcpiEndpoint} from '../util/decorators/as.ocpi.endpoint';
import {OcpiResponse} from '../util/ocpi.response';

@Controller('/cdrs')
export class CdrsController extends BaseController {

  // todo pg 101 https://evroaming.org/app/uploads/2021/11/OCPI-2.2.1.pdf
  // todo This request is paginated, it supports the pagination related URL parameters
  @Get()
  @AsOcpiEndpoint()
  @ResponseSchema(CdrResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async getCdrsFromDataOwner(
    @QueryParams() _query?: FromToOffsetLimitQuery,
  ): Promise<OcpiResponse<Cdr>> {
    console.log('getCdrsFromDataOwner', _query);
    return this.generateMockOcpiResponse(CdrResponse);
  }
}
