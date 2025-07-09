/*
 * // Copyright Contributors to the CitrineOS Project
 *
 */

import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import fp from 'fastify-plugin';
import { HttpStatus, IApiAuthProvider, UserInfo } from '@citrineos/base';

/**
 * Options for the authentication plugin
 */
export interface AuthPluginOptions {
  /**
   * Routes that don't require authentication
   */
  excludedRoutes?: string[];

  /**
   * Enable verbose debug logging
   */
  debug?: boolean;
}

/**
 * Extend the FastifyRequest interface to include user information
 */
declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Authenticated user information
     */
    user?: UserInfo;
  }
}

/**
 * Extend FastifyInstance to include our auth functions and provider
 */
declare module 'fastify' {
  interface FastifyInstance {
    /**
     * The authentication provider instance
     */
    authProvider: IApiAuthProvider;

    /**
     * Authenticates a request by validating the token in Authorization header
     */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    /**
     * Authorizes a request for a specific resource
     */
    authorize: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    // /**
    //  * Checks if a request requires specific roles to access
    //  */
    // requireRoles: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Authentication plugin for Fastify
 * This plugin adds authentication and authorization capabilities to Fastify
 * using the provided auth provider
 *
 * @param fastify Fastify instance
 * @param provider Auth provider instance
 * @param options Plugin options
 */
const apiAuthPlugin: FastifyPluginAsync<{
  provider: IApiAuthProvider;
  options?: AuthPluginOptions;
  logger?: Logger<ILogObj>;
}> = async (fastify, { provider, options = {}, logger }) => {
  //TODO add logger instance ?
  const _logger = logger
    ? logger.getSubLogger({ name: 'AuthPlugin' })
    : new Logger<ILogObj>({ name: 'AuthPlugin' });
  // Register the auth provider
  fastify.decorate('authProvider', provider);

  // Helper to check if a route is excluded from authentication
  function isExcludedRoute(url: string): boolean {
    // Always exclude health check
    if (url === '/health') {
      return true;
    }
    const isExcluded = !!options.excludedRoutes?.some(
      (route) => url === route || url.startsWith(`${route}/`),
    );
    if (isExcluded && options.debug) {
      _logger.debug(`Skipping authentication for excluded route: ${url}`);
    }
    return isExcluded;
  }

  // Authentication decorator - validates token from Authorization header
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Extract token
      const token = await provider.extractToken(request);
      if (!token) {
        reply.code(HttpStatus.UNAUTHORIZED).send({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header',
        });
        return;
      }

      // Authenticate token
      const authResult = await provider.authenticateToken(token);

      if (!authResult.isAuthenticated || !authResult.user) {
        reply.code(HttpStatus.UNAUTHORIZED).send({
          error: 'Unauthorized',
          message: authResult.error || 'Invalid token',
        });
        return;
      }

      // Store user info in request
      request.user = authResult.user;

      if (options.debug) {
        _logger.debug(`Authenticated user: ${authResult.user.id} (${authResult.user.name})`);
        _logger.debug(`Roles: ${authResult.user.roles.join(', ')}`);
      }
    } catch (error) {
      _logger.error('Authentication error:', error);
      reply.code(HttpStatus.UNAUTHORIZED).send({
        error: 'Unauthorized',
        message: 'Authentication failed',
      });
    }
  });

  // Authorization decorator - authorizes user for the requested resource
  fastify.decorate('authorize', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Check if user is authenticated
      if (!request.user) {
        reply.code(HttpStatus.UNAUTHORIZED).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      // Authorize user for this request
      const authzResult = await provider.authorizeUser(request.user, request);

      if (!authzResult.isAuthorized) {
        reply.code(HttpStatus.FORBIDDEN).send({
          error: 'Forbidden',
          message: authzResult.error || 'Insufficient permissions',
        });
        return;
      }

      if (options.debug) {
        _logger.debug(`Authorized user ${request.user.id} for ${request.method} ${request.url}`);
      }
    } catch (error) {
      _logger.error('Authorization error:', error);
      reply.code(HttpStatus.FORBIDDEN).send({
        error: 'Forbidden',
        message: 'Authorization failed',
      });
    }
  });

  // Add global authentication hook for all routes
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip authentication for excluded routes
    if (isExcludedRoute(request.url)) {
      if (options.debug) {
        _logger.trace(`Skipping authentication for excluded route: ${request.url}`);
      }
      return;
    }

    // Authenticate and authorize the request
    await fastify.authenticate(request, reply);
    await fastify.authorize(request, reply);
  });

  _logger.info('Authentication plugin registered');
};

export default fp(apiAuthPlugin, {
  name: 'apiAuth',
  fastify: '5.x',
});
