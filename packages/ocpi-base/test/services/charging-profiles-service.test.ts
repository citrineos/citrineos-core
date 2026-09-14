// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from 'routing-controllers';

import { ChargingProfilesService } from '../../src/services/charging-profiles-service.js';
import { ChargingProfileResultType } from '../../src/model/charging-profile-response.js';
import type { SetChargingProfile } from '../../src/model/set-charging-profile.js';
import { ResponseGenerator } from '../../src/util/response-generator.js';

const SESSION_ID = 'SESSION-1';
const RESPONSE_URL = 'https://msp.example.com/charging_profiles/SESSION-1';

const A_PROFILE = {
  charging_profile: { charging_rate_unit: 'W' },
  response_url: RESPONSE_URL,
} as SetChargingProfile;

// The command executor is commented out of the service, so every method resolves to the same
// canned ACCEPTED body and the catch branches only run when the response builder itself throws.
// The spy below forces that, one call at a time.
function failNextBuildWith(error: Error) {
  return vi.spyOn(ResponseGenerator, 'buildGenericSuccessResponse').mockImplementationOnce(() => {
    throw error;
  });
}

describe('ChargingProfilesService canned responses', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getActiveChargingProfile resolves ACCEPTED with the 30s module timeout', async () => {
    const build = vi.spyOn(ResponseGenerator, 'buildGenericSuccessResponse');

    const response = await new ChargingProfilesService().getActiveChargingProfile(
      SESSION_ID,
      300,
      RESPONSE_URL,
    );

    expect(response.status_code).toBe(1000);
    expect(response.status_message).toBe('Success');
    expect(response.data).toEqual({ result: ChargingProfileResultType.ACCEPTED, timeout: 30 });
    expect(response.timestamp).toBeInstanceOf(Date);
    expect(build).toHaveBeenCalledExactlyOnceWith({
      result: ChargingProfileResultType.ACCEPTED,
      timeout: 30,
    });
  });

  it('deleteChargingProfile resolves ACCEPTED with the 30s module timeout', async () => {
    const build = vi.spyOn(ResponseGenerator, 'buildGenericSuccessResponse');

    const response = await new ChargingProfilesService().deleteChargingProfile(
      SESSION_ID,
      RESPONSE_URL,
    );

    expect(response.status_code).toBe(1000);
    expect(response.status_message).toBe('Success');
    expect(response.data).toEqual({ result: ChargingProfileResultType.ACCEPTED, timeout: 30 });
    expect(build).toHaveBeenCalledExactlyOnceWith({
      result: ChargingProfileResultType.ACCEPTED,
      timeout: 30,
    });
  });

  it('putChargingProfile resolves ACCEPTED with the 30s module timeout', async () => {
    const build = vi.spyOn(ResponseGenerator, 'buildGenericSuccessResponse');

    const response = await new ChargingProfilesService().putChargingProfile(SESSION_ID, A_PROFILE);

    expect(response.status_code).toBe(1000);
    expect(response.status_message).toBe('Success');
    expect(response.data).toEqual({ result: ChargingProfileResultType.ACCEPTED, timeout: 30 });
    expect(build).toHaveBeenCalledExactlyOnceWith({
      result: ChargingProfileResultType.ACCEPTED,
      timeout: 30,
    });
  });

  it('getActiveChargingProfile maps a NotFoundError to a 2000 UNKNOWN_SESSION body', async () => {
    failNextBuildWith(new NotFoundError('Session not found'));

    const response = await new ChargingProfilesService().getActiveChargingProfile(
      SESSION_ID,
      300,
      RESPONSE_URL,
    );

    expect(response.status_code).toBe(2000);
    expect(response.status_message).toBe('Session not found');
    expect(response.data).toEqual({
      result: ChargingProfileResultType.UNKNOWN_SESSION,
      timeout: 30,
    });
  });

  it('deleteChargingProfile maps a NotFoundError to a 2000 UNKNOWN_SESSION body', async () => {
    failNextBuildWith(new NotFoundError('Session not found'));

    const response = await new ChargingProfilesService().deleteChargingProfile(
      SESSION_ID,
      RESPONSE_URL,
    );

    expect(response.status_code).toBe(2000);
    expect(response.status_message).toBe('Session not found');
    expect(response.data).toEqual({
      result: ChargingProfileResultType.UNKNOWN_SESSION,
      timeout: 30,
    });
  });

  it('putChargingProfile maps a NotFoundError to a 2000 UNKNOWN_SESSION body', async () => {
    failNextBuildWith(new NotFoundError('Session not found'));

    const response = await new ChargingProfilesService().putChargingProfile(SESSION_ID, A_PROFILE);

    expect(response.status_code).toBe(2000);
    expect(response.status_message).toBe('Session not found');
    expect(response.data).toEqual({
      result: ChargingProfileResultType.UNKNOWN_SESSION,
      timeout: 30,
    });
  });

  it('getActiveChargingProfile maps any other error to a 3000 REJECTED body', async () => {
    failNextBuildWith(new Error('database down'));

    const response = await new ChargingProfilesService().getActiveChargingProfile(
      SESSION_ID,
      300,
      RESPONSE_URL,
    );

    expect(response.status_code).toBe(3000);
    expect(response.status_message).toBe('database down');
    expect(response.data).toEqual({ result: ChargingProfileResultType.REJECTED, timeout: 30 });
  });

  it('deleteChargingProfile maps any other error to a 3000 REJECTED body', async () => {
    failNextBuildWith(new Error('database down'));

    const response = await new ChargingProfilesService().deleteChargingProfile(
      SESSION_ID,
      RESPONSE_URL,
    );

    expect(response.status_code).toBe(3000);
    expect(response.status_message).toBe('database down');
    expect(response.data).toEqual({ result: ChargingProfileResultType.REJECTED, timeout: 30 });
  });

  it('putChargingProfile maps any other error to a 3000 REJECTED body', async () => {
    failNextBuildWith(new Error('database down'));

    const response = await new ChargingProfilesService().putChargingProfile(SESSION_ID, A_PROFILE);

    expect(response.status_code).toBe(3000);
    expect(response.status_message).toBe('database down');
    expect(response.data).toEqual({ result: ChargingProfileResultType.REJECTED, timeout: 30 });
  });
});
