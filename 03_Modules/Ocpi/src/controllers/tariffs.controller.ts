import {Controller, Get, QueryParams} from 'routing-controllers';
import {HttpStatus} from '@citrineos/base';
import {BaseController} from './base.controller';
import {FromToOffsetLimitQuery} from '../modules/temp/schema/from.to.offset.limit.query.schema';
import {AsOcpiEndpoint} from '../util/decorators/as.ocpi.endpoint';
import {OcpiModules} from "../apis/BaseApi";
import {TariffListResponse} from "../model/Tariff";
import {ResponseSchema} from "../util/openapi";

@Controller(`/${OcpiModules.Tariffs}`)
export class TariffsController extends BaseController {

  // todo pg 101 https://evroaming.org/app/uploads/2021/11/OCPI-2.2.1.pdf
  // todo This request is paginated, it supports the pagination related URL parameters
  @Get()
  @AsOcpiEndpoint()
  @ResponseSchema(TariffListResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async getTariffs(
    @QueryParams() _query?: FromToOffsetLimitQuery,
  ): Promise<TariffListResponse> {
    console.log('getTariffs', _query);
    return this.generateMockOcpiResponse(TariffListResponse);
  }
}
