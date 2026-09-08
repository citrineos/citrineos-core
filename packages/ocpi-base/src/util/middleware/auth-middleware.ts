// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import { HttpHeader, HttpStatus, UnauthorizedException } from '@citrineos/base';
import type { ILogObj, Logger } from 'tslog';
import { extractToken } from '../decorators/auth-token.js';
import { OcpiHttpHeader } from '../ocpi-http-header.js';
import { BaseMiddleware } from './base-middleware.js';
import { ContentType } from '../content-type.js';
import { buildOcpiErrorResponse } from '../../model/ocpi-error-response.js';
import { OcpiResponseStatusCode } from '../../model/ocpi-response.js';
import type {
  GetTenantPartnerByServerTokenQueryResult,
  GetTenantPartnerByServerTokenQueryVariables,
} from '../../graphql/index.js';
import { GET_TENANT_PARTNER_BY_SERVER_TOKEN } from '../../graphql/index.js';
import type { IOcpiGraphqlClient } from '../../graphql/index.js';
import type { OcpiGraphqlDependencies } from '../../dependencies.js';

/**
 * Authentication middleware for OCPI functional endpoints (applied via {@link AsOcpiFunctionalEndpoint}).
 * It checks for the presence of the Authorization header and resolves the bearer token to a
 * {@link GetTenantPartnerByServerTokenQueryResult TenantPartner}, then enforces that the OCPI from/to routing
 * headers match that token's tenant.
 *
 * Whether the tenant/routing-header check is enforced is decided structurally by {@link enforceRoutingHeaders},
 * i.e. by which class the endpoint's decorator wires up (see {@link RegistrationAuthMiddleware}) — never by
 * inspecting the request URL or any other attacker-controlled input. If authentication fails, an
 * {@link OcpiErrorResponse} is written with HttpStatus.UNAUTHORIZED.
 */
export class AuthMiddleware extends BaseMiddleware implements KoaMiddlewareInterface {
  protected readonly logger: Logger<ILogObj>;
  readonly ocpiGraphqlClient: IOcpiGraphqlClient;

  constructor({ logger, ocpiGraphqlClient }: OcpiGraphqlDependencies) {
    super();
    this.logger = logger;
    this.ocpiGraphqlClient = ocpiGraphqlClient;
  }

  protected enforceRoutingHeaders(): boolean {
    return true;
  }

  throwError(ctx: any) {
    ctx.type = ContentType.JSON;
    ctx.status = HttpStatus.UNAUTHORIZED;
    ctx.body = JSON.stringify(
      buildOcpiErrorResponse(OcpiResponseStatusCode.ClientNotEnoughInformation, 'Not Authorized'),
    );
  }

  async use(context: any, next: (err?: any) => Promise<any>): Promise<any> {
    const authHeader = context.request.headers[HttpHeader.Authorization.toLowerCase()];

    if (!authHeader) {
      this.logger.debug(
        `No authorization header found for ${context.request.method} ${context.request.url}`,
      );
      return this.throwError(context);
    }

    try {
      const token = extractToken(authHeader);

      const response = await this.ocpiGraphqlClient.request<
        GetTenantPartnerByServerTokenQueryResult,
        GetTenantPartnerByServerTokenQueryVariables
      >(GET_TENANT_PARTNER_BY_SERVER_TOKEN, { serverToken: token });

      const tenantPartner = response.TenantPartners[0];
      if (!tenantPartner) {
        this.logger.debug(`Authorization failed - tenant partner not found for token`);
        throw new UnauthorizedException('Credentials not found for given token');
      }

      if (this.enforceRoutingHeaders()) {
        const fromCountryCode = this.getHeader(context, OcpiHttpHeader.OcpiFromCountryCode);
        const fromPartyId = this.getHeader(context, OcpiHttpHeader.OcpiFromPartyId);
        const toCountryCode = this.getHeader(context, OcpiHttpHeader.OcpiToCountryCode);
        const toPartyId = this.getHeader(context, OcpiHttpHeader.OcpiToPartyId);
        if (
          tenantPartner.countryCode !== fromCountryCode ||
          tenantPartner.partyId !== fromPartyId ||
          tenantPartner.tenant.countryCode !== toCountryCode ||
          tenantPartner.tenant.partyId !== toPartyId
        ) {
          this.logger.debug(
            `String token matched tenantPartner with incorrect routing headers - ${tenantPartner.countryCode}:${fromCountryCode}, ${tenantPartner.partyId}:${fromPartyId}, ${tenantPartner.tenant.countryCode}:${toCountryCode}, ${tenantPartner.tenant.partyId}:${toPartyId}`,
          );
          throw new UnauthorizedException('Credentials not found for given token');
        }
      }

      context.state.tenantPartner = tenantPartner;
    } catch (error: any) {
      this.logger.debug(`Authorization error: ${error.message}`);
      return this.throwError(context);
    }
    return await next();
  }
}

export class RegistrationAuthMiddleware extends AuthMiddleware {
  constructor(dependencies: OcpiGraphqlDependencies) {
    super(dependencies);
  }

  protected override enforceRoutingHeaders(): boolean {
    return false;
  }
}
