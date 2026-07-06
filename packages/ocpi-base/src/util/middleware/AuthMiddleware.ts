// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import { HttpHeader, HttpStatus, UnauthorizedException } from '@citrineos/base';
import { Container, Service } from 'typedi';
import { Logger } from 'tslog';
import { extractToken } from '../decorators/AuthToken.js';
import { OcpiHttpHeader } from '../OcpiHttpHeader.js';
import { BaseMiddleware } from './BaseMiddleware.js';
import { ContentType } from '../ContentType.js';
import { buildOcpiErrorResponse } from '../../model/OcpiErrorResponse.js';
import { OcpiResponseStatusCode } from '../../model/OcpiResponse.js';
import type {
  GetTenantPartnerByServerTokenQueryResult,
  GetTenantPartnerByServerTokenQueryVariables,
} from '../../graphql/index.js';
import { GET_TENANT_PARTNER_BY_SERVER_TOKEN, OcpiGraphqlClient } from '../../graphql/index.js';

const permittedRoutes: string[] = ['/docs', '/docs/spec', '/favicon.png'];
const registrationModules: string[] = ['versions', 'credentials'];

/**
 * AuthMiddleware is applied via the {@link AsOcpiEndpoint} and {@link AsOcpiOpenRoutingEndpoint} decorators. Endpoints
 * that are annotated with these decorators will have this middleware running. The middleware will check for presense
 * of the auth header, and try and call {@link CredentialsService#authorizeToken} with token, countryCode and partyId.
 * If authentication fails, {@link OcpiErrorResponse} will be thrown with HttpStatus.UNAUTHORIZED which should be handled
 * by global exception handler.
 */
@Service()
export class AuthMiddleware extends BaseMiddleware implements KoaMiddlewareInterface {
  constructor(readonly ocpiGraphqlClient: OcpiGraphqlClient) {
    super();
  }

  throwError(ctx: any) {
    ctx.type = ContentType.JSON;
    ctx.status = HttpStatus.UNAUTHORIZED;
    ctx.body = JSON.stringify(
      buildOcpiErrorResponse(OcpiResponseStatusCode.ClientNotEnoughInformation, 'Not Authorized'),
    );
  }

  async use(context: any, next: (err?: any) => Promise<any>): Promise<any> {
    const logger = Container.get(Logger);

    const authHeader = context.request.headers[HttpHeader.Authorization.toLowerCase()];

    if (!permittedRoutes.includes(context.request.originalUrl)) {
      if (!authHeader) {
        logger.debug(
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
          logger.debug(`Authorization failed - tenant partner not found for token`);
          throw new UnauthorizedException('Credentials not found for given token');
        }

        if (
          !registrationModules.some((value) =>
            (context.request.originalUrl as string).includes(value),
          )
        ) {
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
            logger.debug(
              `String token matched tenantPartner with incorrect routing headers - ${tenantPartner.countryCode}:${fromCountryCode}, ${tenantPartner.partyId}:${fromPartyId}, ${tenantPartner.tenant.countryCode}:${toCountryCode}, ${tenantPartner.tenant.partyId}:${toPartyId}`,
            );
            throw new UnauthorizedException('Credentials not found for given token');
          }
        }

        context.state.tenantPartner = tenantPartner;
      } catch (error: any) {
        logger.debug(`Authorization error: ${error.message}`);
        return this.throwError(context);
      }
    } else {
      logger.debug('Route is permitted, skipping authentication');
    }
    return await next();
  }
}
