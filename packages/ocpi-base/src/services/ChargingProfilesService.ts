// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Service } from 'typedi';
// import { CommandExecutor } from '../util/CommandExecutor';
import type { ChargingProfileResponse } from '../model/ChargingProfileResponse.js';
import { ChargingProfileResultType } from '../model/ChargingProfileResponse.js';
import { NotFoundException } from '../exception/NotFoundException.js';
import type { SetChargingProfile } from '../model/SetChargingProfile.js';
import { NotFoundError } from 'routing-controllers';
import { ResponseGenerator } from '../util/response.generator.js';

@Service()
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
