// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AdminCredentialsRequestDTO,
  CredentialsDTO,
  CredentialsResponse,
  OcpiEmptyResponse,
  UnregisterClientRequestDTO,
} from '../../../index.js';
import {
  AdminCredentialsRequestDTOSchema,
  AdminCredentialsRequestDTOSchemaName,
  AsAdminEndpoint,
  AsOcpiRegistrationEndpoint,
  AuthToken,
  BaseController,
  BodyWithSchema,
  buildCredentialsResponse,
  buildOcpiEmptyResponse,
  CredentialsDTOSchema,
  CredentialsDTOSchemaName,
  CredentialsResponseSchema,
  CredentialsResponseSchemaName,
  CredentialsService,
  generateMockForSchema,
  ModuleId,
  OcpiEmptyResponseSchema,
  OcpiEmptyResponseSchemaName,
  OcpiLogger,
  OcpiResponseStatusCode,
  ResponseSchema,
  UnregisterClientRequestDTOSchema,
  UnregisterClientRequestDTOSchemaName,
  versionIdParam,
  VersionNumber,
  VersionNumberParam,
} from '../../../index.js';
import type { TenantPartnerDto } from '@citrineos/base';
import { HttpStatus } from '@citrineos/base';
import { Service } from 'typedi';
import type { ICredentialsModuleApi } from './ICredentialsModuleApi.js';
import {
  Ctx,
  Delete,
  Get,
  JsonController,
  OnUndefined,
  Param,
  Post,
  Put,
} from 'routing-controllers';

const MOCK_CREDENTIALS_RESPONSE = await generateMockForSchema(
  CredentialsResponseSchema,
  CredentialsResponseSchemaName,
);
const MOCK_EMPTY = await generateMockForSchema(
  OcpiEmptyResponseSchema,
  OcpiEmptyResponseSchemaName,
);

@JsonController(`/:${versionIdParam}/${ModuleId.Credentials}`)
@Service()
export class CredentialsModuleApi extends BaseController implements ICredentialsModuleApi {
  constructor(
    readonly logger: OcpiLogger,
    readonly credentialsService: CredentialsService,
  ) {
    super();
  }

  @Get()
  @AsOcpiRegistrationEndpoint()
  @ResponseSchema(CredentialsResponseSchema, CredentialsResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: {
        summary: 'A successful response',
        value: MOCK_CREDENTIALS_RESPONSE,
      },
    },
  })
  async getCredentials(
    @VersionNumberParam() _version: VersionNumber,
    @Ctx() ctx: any,
  ): Promise<CredentialsResponse> {
    this.logger.info('getCredentials', _version);
    const tenantPartner = ctx!.state!.tenantPartner as TenantPartnerDto;
    const credentialsDto = await this.credentialsService.getCredentials(tenantPartner);
    return buildCredentialsResponse(credentialsDto);
  }

  @Post()
  @AsOcpiRegistrationEndpoint()
  @ResponseSchema(CredentialsResponseSchema, CredentialsResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: {
        summary: 'A successful response',
        value: MOCK_CREDENTIALS_RESPONSE,
      },
    },
  })
  async postCredentials(
    @VersionNumberParam() version: VersionNumber,
    @Ctx() ctx: any,
    @BodyWithSchema(CredentialsDTOSchema, CredentialsDTOSchemaName)
    credentials: CredentialsDTO,
  ): Promise<CredentialsResponse> {
    this.logger.info('postCredentials', version, credentials);
    const tenantPartner = ctx!.state!.tenantPartner as TenantPartnerDto;
    const serverCredentials = await this.credentialsService?.postCredentials(
      tenantPartner,
      credentials,
      version,
    );
    return buildCredentialsResponse(serverCredentials);
  }

  @Put()
  @AsOcpiRegistrationEndpoint()
  @ResponseSchema(CredentialsResponseSchema, CredentialsResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: {
        summary: 'A successful response',
        value: MOCK_CREDENTIALS_RESPONSE,
      },
    },
  })
  async putCredentials(
    @VersionNumberParam() version: VersionNumber,
    @Ctx() ctx: any,
    @BodyWithSchema(CredentialsDTOSchema, CredentialsDTOSchemaName)
    credentials: CredentialsDTO,
  ): Promise<CredentialsResponse> {
    this.logger.info('putCredentials', version, credentials);
    const tenantPartner = ctx!.state!.tenantPartner as TenantPartnerDto;
    const serverCredentials = await this.credentialsService?.putCredentials(
      tenantPartner,
      credentials,
    );
    return buildCredentialsResponse(serverCredentials);
  }

  @Delete()
  @AsOcpiRegistrationEndpoint()
  @ResponseSchema(OcpiEmptyResponseSchema, OcpiEmptyResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: {
        summary: 'A successful response',
        value: MOCK_EMPTY,
      },
    },
  })
  async deleteCredentials(
    @VersionNumberParam() _version: VersionNumber,
    @AuthToken() token: string,
  ): Promise<OcpiEmptyResponse> {
    this.logger.info('deleteCredentials', _version);
    await this.credentialsService?.deleteCredentials(token);
    return buildOcpiEmptyResponse(OcpiResponseStatusCode.GenericSuccessCode);
  }

  /**
   * Admin Endpoints
   */

  /**
   * This endpoint uses client side CredentialsTokenA to get version and endpoints from client
   * then post server side CredentialsTokenB to client and get client side CredentialsTokenC in response
   * and register token B and C.
   */
  @Post('/register-credentials-token-a')
  @AsAdminEndpoint()
  @ResponseSchema(CredentialsResponseSchema, CredentialsResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: {
        summary: 'A successful response',
        value: MOCK_EMPTY,
      },
    },
  })
  async registerCredentialsTokenA(
    @VersionNumberParam() versionNumber: VersionNumber,
    @Param('versionUrl') versionUrl: string, // CPO version url
    @Param('cpoCountryCode') cpoCountryCode: string,
    @Param('cpoPartyId') cpoPartyId: string,
    @BodyWithSchema(CredentialsDTOSchema, CredentialsDTOSchemaName)
    credentials: CredentialsDTO, // Partner credentials
  ): Promise<CredentialsResponse> {
    this.logger.info('registerCredentialsTokenA', credentials);
    const serverCredentials: CredentialsDTO =
      await this.credentialsService?.registerCredentialsTokenA(
        cpoCountryCode,
        cpoPartyId,
        versionUrl,
        credentials,
        versionNumber,
      );
    return buildCredentialsResponse(serverCredentials);
  }

  @Delete('/delete-tenant/:tenantId')
  @AsAdminEndpoint()
  @ResponseSchema(OcpiEmptyResponseSchema, OcpiEmptyResponseSchemaName, {
    description: 'Successful response',
    examples: {
      success: {
        summary: 'A successful response',
        value: MOCK_EMPTY,
      },
    },
  })
  async deleteTenant(
    @VersionNumberParam() versionNumber: VersionNumber,
    @Param('tenantId') tenantId: string,
  ): Promise<OcpiEmptyResponse> {
    this.logger.info('deleteTenant', tenantId);
    this.logger.warn('delete tenant not implemented');
    // await this.credentialsService?.deleteTenant(tenantId);
    return buildOcpiEmptyResponse(OcpiResponseStatusCode.GenericSuccessCode);
  }

  @Delete('/unregister-client')
  @OnUndefined(HttpStatus.NO_CONTENT)
  @AsAdminEndpoint()
  async unregisterClient(
    @VersionNumberParam() versionNumber: VersionNumber,
    @BodyWithSchema(UnregisterClientRequestDTOSchema, UnregisterClientRequestDTOSchemaName)
    request: UnregisterClientRequestDTO,
  ): Promise<void> {
    this.logger.info('unregisterClient', request);
    return this.credentialsService?.unregisterClient(request);
  }

  /**
   * This endpoint generate a temp server side credentials token A and store it in a new client information.
   * This token A is used by client to get versions, endpoints and posting client side credentials token B.
   * Based on the registration process, this token A will be replaced by the formal credentials token C later.
   *
   * @param versionNumber VersionNumber enum
   * @param credentialsRequest AdminCredentialsRequestDTO including version url and server credentials roles
   */
  @Post('/generate-credentials-token-a')
  @AsAdminEndpoint()
  @ResponseSchema(CredentialsResponseSchema, CredentialsResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: {
        summary: 'A successful response',
        value: MOCK_EMPTY,
      },
    },
  })
  async generateCredentialsTokenA(
    @VersionNumberParam() versionNumber: VersionNumber,
    @BodyWithSchema(AdminCredentialsRequestDTOSchema, AdminCredentialsRequestDTOSchemaName)
    credentialsRequest: AdminCredentialsRequestDTO,
  ): Promise<CredentialsResponse> {
    this.logger.info('generateCredentialsTokenA', credentialsRequest);

    const createdCredentials: CredentialsDTO =
      await this.credentialsService?.generateCredentialsTokenA(credentialsRequest, versionNumber);

    return buildCredentialsResponse(createdCredentials);
  }

  @Put('/regenerate-credentials-token')
  @AsAdminEndpoint()
  @ResponseSchema(CredentialsResponseSchema, CredentialsResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: {
        summary: 'A successful response',
        value: MOCK_EMPTY,
      },
    },
  })
  async regenerateCredentialsToken(
    @VersionNumberParam() versionNumber: VersionNumber,
    @BodyWithSchema(AdminCredentialsRequestDTOSchema, AdminCredentialsRequestDTOSchemaName)
    credentialsRequest: AdminCredentialsRequestDTO,
  ): Promise<CredentialsResponse> {
    this.logger.info('regenerateCredentialsToken', credentialsRequest);

    const createdCredentials: CredentialsDTO =
      await this.credentialsService?.regenerateCredentialsToken(credentialsRequest, versionNumber);

    return buildCredentialsResponse(createdCredentials);
  }
}
