import {Controller, Get, Param, QueryParams} from "routing-controllers";
import {OcpiModules} from "../apis/BaseApi";
import {BaseController} from "./base.controller";
import {AsOcpiEndpoint} from "../util/decorators/as.ocpi.endpoint";
import {HttpStatus} from "@citrineos/base";
import {LocationListResponse, LocationResponse} from "../model/Location";
import {FromToOffsetLimitQuery} from "../modules/temp/schema/from.to.offset.limit.query.schema";
import {EvseResponse} from "../model/Evse";
import {ConnectorResponse} from "../model/Connector";
import {ResponseSchema} from "../util/openapi";

@Controller(`/${OcpiModules.Locations}`)
export class LocationsController extends BaseController {

  // todo pg 60 https://evroaming.org/app/uploads/2021/11/OCPI-2.2.1.pdf
  // todo This request is paginated, it supports the pagination related URL parameters
  @Get()
  @AsOcpiEndpoint()
  @ResponseSchema(LocationListResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async getLocations(
    @QueryParams() _query?: FromToOffsetLimitQuery,
  ): Promise<LocationListResponse> {
    console.log('getLocations', _query);
    return this.generateMockOcpiResponse(LocationListResponse);
  }

  @Get('/:locationId')
  @AsOcpiEndpoint()
  @ResponseSchema(LocationResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async getLocation(
    @Param('locationId') _locationId: string
  ): Promise<LocationResponse> {
    console.log('getLocation', _locationId);
    return this.generateMockOcpiResponse(LocationResponse);
  }

  @Get('/:id/:evseId')
  @AsOcpiEndpoint()
  @ResponseSchema(EvseResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async getEvse(
    @Param('locationId') _locationId: string,
    @Param('evseId') _evseId: string,
  ): Promise<EvseResponse> {
    console.log('getEvse', _locationId, _evseId);
    return this.generateMockOcpiResponse(EvseResponse);
  }

  @Get('/:id/:evseId/:connectorId')
  @AsOcpiEndpoint()
  @ResponseSchema(ConnectorResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async getConnector(
    @Param('locationId') _locationId: string,
    @Param('evseId') _evseId: string,
    @Param('connectorId') _connectorId: string
  ): Promise<ConnectorResponse> {
    console.log('getConnector', _locationId, _evseId, _connectorId);
    return this.generateMockOcpiResponse(ConnectorResponse);
  }
}
