// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * NextAuth configuration for authentication
 *
 * Keycloak Token Refresh:
 * - Access tokens are automatically refreshed 60 seconds before expiration
 * - Refresh tokens are used to obtain new access tokens without re-authentication
 * - If token refresh fails, the user will be logged out and redirected to login
 *
 * Changing JWT Token TTL in Keycloak:
 * To change the access token lifespan, you need to configure it in the Keycloak Admin Console:
 *
 * 1. Log in to the Keycloak Admin Console
 * 2. Select your realm (e.g., CitrineOS realm)
 * 3. Navigate to: Realm Settings → Sessions tab
 * 4. Configure the following settings:
 *    - SSO Session Idle: How long a session can be idle before requiring re-authentication
 *      * Recommended: 30 minutes or more to keep users logged in while active
 *    - SSO Session Max: Maximum session lifespan regardless of activity
 *      * Recommended: 10-12 hours for full work day sessions
 * 3. Navigate to: Realm Settings → Tokens tab
 * 4. Configure the following settings:
 *    - Access Token Lifespan: How long access tokens are valid (default is often 5 minutes)
 *      * Recommended: 5-15 minutes for production
 *      * Longer lifespans reduce refresh calls but increase security risk
 *      * Should be short relative to SSO Session Idle
 * 5. Click "Save" at the bottom of the page
 *
 * Note: Client-specific token lifespans can also be configured:
 * 1. Go to: Clients → Select your client (e.g., citrineos-ui)
 * 2. Navigate to: Advanced Settings → Advanced tab
 * 3. Configure client-specific token lifespans if needed
 */

import type { AuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';
import config from '@lib/utils/config';
import { parseJwt } from '@lib/utils/jwt';
import { genericAdminUser } from '@lib/providers/auth-provider/generic-auth-provider';

const keycloakServerUrl = config.keycloakServerUrl || config.keycloakUrl;
const authProvider = config.authProvider;

/**
 * Refreshes an expired access token using the refresh token
 */
async function refreshAccessToken(token: any) {
  if (authProvider === 'generic') {
    return token;
  }

  try {
    const url = `${keycloakServerUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.keycloakClientId!,
        client_secret: config.keycloakClientSecret!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    // Parse the new access token to get updated roles and tenant info
    const accessTokenParsed = parseJwt(refreshedTokens.access_token);

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      idToken: refreshedTokens.id_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      roles: accessTokenParsed.resource_access?.[config.keycloakClientId!]?.roles || [],
      tenantId: accessTokenParsed.tenant_id,
      error: undefined,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

/**
 * Defaults to Generic Auth Provider if Keycloak is not configured.
 */
const getProvider = () => {
  if (authProvider === 'keycloak') {
    return KeycloakProvider({
      clientId: config.keycloakClientId!,
      clientSecret: config.keycloakClientSecret!,
      wellKnown: undefined,
      issuer: `${config.keycloakUrl}/realms/${config.keycloakRealm}`,
      authorization: {
        url: `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/auth`,
      },
      token: `${keycloakServerUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/token`,
      userinfo: `${keycloakServerUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/userinfo`,
      jwks_endpoint: `${keycloakServerUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/certs`,
    });
  } else {
    return CredentialsProvider({
      id: 'generic',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, _req) {
        if (
          credentials &&
          credentials.username === config.adminEmail &&
          credentials.password === config.adminPassword
        ) {
          return genericAdminUser;
        } else {
          return null;
        }
      },
    });
  }
};

const authOptions: AuthOptions = {
  providers: [getProvider()],
  events: {},
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirect to overview page after successful login
      // If the url is the callback from Keycloak or the signin page, redirect to overview
      if (url.startsWith(baseUrl)) {
        // Check if it's a callback or sign-in, redirect to overview
        if (url.includes('/api/auth/callback') || url.includes('/api/auth/signin')) {
          return `${baseUrl}/overview`;
        }
        return url;
      }
      // Allow relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Default to overview page for any other case
      return `${baseUrl}/overview`;
    },
    async jwt({ token, account }) {
      // Initial sign in - store Keycloak tokens in JWT
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 300000; // Default to 5 minutes if not provided

        // Store the Keycloak end-session URL so the client can perform a proper
        // browser-level logout (server has access to realm name, client does not)
        if (authProvider === 'keycloak') {
          token.keycloakLogoutUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/logout`;
        }

        // Parse access token to get roles
        if (account.access_token) {
          const accessTokenParsed = parseJwt(account.access_token as string);
          // Extract client roles from resource_access
          token.roles = accessTokenParsed.resource_access?.[config.keycloakClientId!]?.roles || [];
          // Extract tenant_id
          token.tenantId = accessTokenParsed.tenant_id;
        }
        return token;
      }

      // Return previous token if the access token has not expired yet
      // Add a 60 second buffer to refresh before actual expiration
      if (Date.now() < (token.accessTokenExpires as number) - 60000) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Pass JWT info to client session
      if (session.user) {
        // The subject claim is the only stable per-user identifier available to the
        // client. Without it every user collapses onto the same fallback id, which
        // makes anything keyed on identity (per-user modals, preferences) behave as
        // though it were deployment-wide.
        (session.user as any).sub = token.sub;
        (session.user as any).roles = token.roles;
        (session.user as any).tenantId = token.tenantId;
      }
      (session as any).accessToken = token.accessToken;
      (session as any).idToken = token.idToken;
      (session as any).keycloakLogoutUrl = token.keycloakLogoutUrl;
      (session as any).error = token.error;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
};

export default authOptions;
