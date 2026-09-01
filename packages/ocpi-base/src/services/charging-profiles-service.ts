// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// import { CommandExecutor } from '../util/command-executor';
import type { ChargingProfileResponse } from '../model/charging-profile-response.js';
import { ChargingProfileResultType } from '../model/charging-profile-response.js';
import { NotFoundException } from '../exception/not-found-exception.js';
import type { SetChargingProfile } from '../model/set-charging-profile.js';
import { NotFoundError } from 'routing-controllers';
import { ResponseGenerator } from '../util/response-generator.js';

export class ChargingProfilesService {
  readonly TIMEOUT = 30;

  // constructor(private commandExecutor: CommandExecutor) {}

  async getActiveChargingProfile(
    sessionId: string,
    duration: number,
    responseUrl: string,
  ): Promise<ChargingProfileResponse> {
    try {
      // await this.commandExecutor.executeGetActiveChargingProfile(
      //   sessionId,
      //   duration,
      //   responseUrl,
      // );
      return ResponseGenerator.buildGenericSuccessResponse({
        result: ChargingProfileResultType.ACCEPTED,
        timeout: this.TIMEOUT,
      });
    } catch (e: any) {
      if (e instanceof NotFoundError) {
        return ResponseGenerator.buildUnknownSessionResponse(
          {
            result: ChargingProfileResultType.UNKNOWN_SESSION,
            timeout: this.TIMEOUT,
          },
          e as NotFoundException,
        );
      }
      return ResponseGenerator.buildGenericServerErrorResponse(
        {
          result: ChargingProfileResultType.REJECTED,
          timeout: this.TIMEOUT,
        },
        e.message,
        e,
      );
    }
  }

  async deleteChargingProfile(
    sessionId: string,
    responseUrl: string,
  ): Promise<ChargingProfileResponse> {
    try {
      // await this.commandExecutor.executeClearChargingProfile(
      //   sessionId,
      //   responseUrl,
      // );
      return ResponseGenerator.buildGenericSuccessResponse({
        result: ChargingProfileResultType.ACCEPTED,
        timeout: this.TIMEOUT,
      });
    } catch (e: any) {
      if (e instanceof NotFoundError) {
        return ResponseGenerator.buildUnknownSessionResponse(
          {
            result: ChargingProfileResultType.UNKNOWN_SESSION,
            timeout: this.TIMEOUT,
          },
          e as NotFoundException,
        );
      }
      return ResponseGenerator.buildGenericServerErrorResponse(
        {
          result: ChargingProfileResultType.REJECTED,
          timeout: this.TIMEOUT,
        },
        e.message,
        e,
      );
    }
  }

  async putChargingProfile(
    sessionId: string,
    setChargingProfile: SetChargingProfile,
  ): Promise<ChargingProfileResponse> {
    try {
      // await this.commandExecutor.executePutChargingProfile(
      //   sessionId,
      //   setChargingProfile,
      // );
      return ResponseGenerator.buildGenericSuccessResponse({
        result: ChargingProfileResultType.ACCEPTED,
        timeout: this.TIMEOUT,
      });
    } catch (e: any) {
      if (e instanceof NotFoundError) {
        return ResponseGenerator.buildUnknownSessionResponse(
          {
            result: ChargingProfileResultType.UNKNOWN_SESSION,
            timeout: this.TIMEOUT,
          },
          e as NotFoundException,
        );
      }
      return ResponseGenerator.buildGenericServerErrorResponse(
        {
          result: ChargingProfileResultType.REJECTED,
          timeout: this.TIMEOUT,
        },
        e.message,
        e,
      );
    }
  }
}
