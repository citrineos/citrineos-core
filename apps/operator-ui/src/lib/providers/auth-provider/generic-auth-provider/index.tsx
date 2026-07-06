// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Alert, AlertDescription } from '@lib/client/components/ui/alert';
import { Button } from '@lib/client/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { Label } from '@lib/client/components/ui/label';
import { type AuthenticationContextProvider, type User } from '@lib/utils/access.types';
import config from '@lib/utils/config';
import { HasuraHeader, HasuraRole } from '@lib/utils/hasura.types';
import { useLogin, useTranslate, type AuthProvider } from '@refinedev/core';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';

/**
 * Configuration for the auth provider
 */
export interface GenericAuthProviderConfig {
  tokenKey?: string;
  userKey?: string;
}

/**
 * Default auth provider implementation
 */
const ADMIN_EMAIL = config.adminEmail;
const TENANT_ID = config.tenantId;

export const genericAdminUser: User = {
  id: '1',
  name: 'Admin User',
  email: ADMIN_EMAIL,
  roles: ['admin'],
};

/**
 * Custom Login Page Component using shadcn/ui
 */
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutate: login, isPending: isLoading } = useLogin();
  const translate = useTranslate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    login(
      { email, password },
      {
        onError: () => {
          setError(translate('pages.login.invalidCredentials'));
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {translate('pages.login.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {translate('pages.login.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{translate('pages.login.fields.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={translate('pages.login.placeholders.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{translate('pages.login.fields.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={translate('pages.login.placeholders.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? translate('pages.login.signingIn') : translate('pages.login.signin')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Creates a default permissive auth provider that uses localStorage
 * for persistence and always grants permissions
 */
export const createGenericAuthProvider = (
  config: GenericAuthProviderConfig = {},
): AuthProvider & AuthenticationContextProvider => {
  const { tokenKey = 'auth_token', userKey = 'auth_user' } = config;
  /**
   * Save token to storage
   */
  const saveToken = (token: string): void => {
    localStorage.setItem(tokenKey, token);
  };

  /**
   * Get token from storage
   */
  const getToken = async (): Promise<string | undefined> => {
    return localStorage.getItem(tokenKey) || undefined;
  };

  /**
   * Save user to storage
   */
  const saveUser = (user: User): void => {
    localStorage.setItem(userKey, JSON.stringify(user));
  };

  /**
   * Get user from storage
   */
  const getUser = (): User | null => {
    const userStr = localStorage.getItem(userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch (e) {
      return null;
    }
  };

  /**
   * Get permissions
   */
  const getPermissions = async () => {
    const user = getUser();
    return {
      roles: user?.roles || [],
    };
  };

  const getUserRole = async (): Promise<string | undefined> => {
    const roles = (await getPermissions()).roles;
    if (roles && roles.length > 0) {
      if (roles.includes(HasuraRole.ADMIN)) {
        return HasuraRole.ADMIN;
      }
      return HasuraRole.USER;
    }
    return undefined;
  };

  /**
   * Get the Hasura role from the identity
   */
  const getHasuraHeaders = async (): Promise<Map<HasuraHeader, string>> => {
    const hasuraHeaders = new Map<HasuraHeader, string>();

    const roles = (await getPermissions()).roles;
    if (roles && roles.length > 0 && roles.includes(HasuraRole.ADMIN)) {
      hasuraHeaders.set(HasuraHeader.X_HASURA_ROLE, HasuraRole.ADMIN);
    } else {
      hasuraHeaders.set(HasuraHeader.X_HASURA_ROLE, HasuraRole.USER);
    }

    hasuraHeaders.set(HasuraHeader.X_HASURA_TENANT_ID, TENANT_ID);

    return hasuraHeaders;
  };

  // Return the auth provider implementation
  return {
    login: async ({ email, password }) => {
      const result = await signIn('generic', {
        username: email,
        password,
        redirect: false,
      });

      if (!result || result.error || !result.ok) {
        return {
          success: false,
          error: {
            message: 'Login failed',
            name: 'Invalid email or password',
          },
        };
      }

      const mockToken = 'mock_token_' + Math.random().toString(36).slice(2);
      saveToken(mockToken);
      saveUser({ ...genericAdminUser, email });

      window.location.href = '/overview';
      return {
        success: true,
        redirectTo: '/overview',
      };
    },

    logout: async () => {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);

      return {
        success: true,
        redirectTo: '/login',
      };
    },

    check: async () => {
      const token = await getToken();

      console.log('🔐 Auth check - token exists:', !!token);

      if (token) {
        return {
          authenticated: true,
        };
      }

      console.warn('❌ Not authenticated, should redirect to /login');
      return {
        authenticated: false,
        redirectTo: '/login',
        logout: true,
        error: {
          message: 'Not authenticated',
          name: 'Authentication Error',
        },
      };
    },

    onError: async (error) => {
      console.log(`Authprovider: onError triggered, error: ${error}`);
      // Only logout for auth errors, not schema validation errors
      if (error.statusCode === 401) {
        return {
          logout: true,
        };
      }

      // For other errors, just return an error without logging out
      return {
        error: {
          message: error.message,
          name: error.name,
        },
      };
    },

    getIdentity: async () => {
      const user = getUser();
      if (!user) return null;
      return user;
    },

    getPermissions,

    // AuthenticationContextProvider methods

    getToken,
    getUserRole,
    getHasuraHeaders,
    getInitialized: async (): Promise<boolean> => true,
    getLoginPage: () => LoginPage,
  };
};
