// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';
import config from './config';

export const DEV_API_PATH = '/dev';

/**
 * The server registers these only when auth.mode is localDev, and excludes them from API auth —
 * minting a token cannot require one. They deliberately bypass BaseRestClient for that reason.
 */
const dev = axios.create({
  baseURL: `${config.citrineCoreUrl}${DEV_API_PATH}`,
  headers: { 'Content-Type': 'application/json' },
});

export const fetchDevRoles = async (): Promise<string[]> => {
  try {
    const { data } = await dev.get<{ roles: string[] }>('/roles');
    return data.roles;
  } catch {
    return [];
  }
};

export const fetchDevToken = async (roles: string[]): Promise<string | undefined> => {
  try {
    const { data } = await dev.post<{ accessToken: string }>('/token', { roles });
    return data.accessToken;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return undefined;
    }
    throw error;
  }
};

const core = axios.create({ baseURL: config.citrineCoreUrl });

export const isStaleDevSession = async (token: string): Promise<boolean> => {
  try {
    await dev.get('/roles');
  } catch {
    return false;
  }
  try {
    await core.get('/permissions/user', { headers: { Authorization: `Bearer ${token}` } });
    return false;
  } catch (error) {
    return axios.isAxiosError(error) && error.response?.status === 401;
  }
};
