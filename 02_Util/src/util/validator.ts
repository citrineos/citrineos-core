// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { getNumberOfFractionDigit } from './parser';
import {
  IChargingProfileRepository,
  IDeviceModelRepository,
  ITransactionEventRepository,
  VariableAttribute,
} from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';

/**
 * Validate a language tag is an RFC-5646 tag, see: {@link https://tools.ietf.org/html/rfc5646},
 * example: US English is: "en-US"
 *
 * @param languageTag
 * @returns {boolean} true if the languageTag is an RFC-5646 tag
 */
export function validateLanguageTag(languageTag: string): boolean {
  return /^((?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?:([A-Za-z]{2,3}(-(?:[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|[A-Za-z]{4}|[A-Za-z]{5,8})(-(?:[A-Za-z]{4}))?(-(?:[A-Za-z]{2}|[0-9]{3}))?(-(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-(?:[0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*(-(?:x(-[A-Za-z0-9]{1,8})+))?)|(?:x(-[A-Za-z0-9]{1,8})+))$/.test(
    languageTag,
  );
}

/**
 * Validate constraints of ChargingProfileType defined in OCPP 2.0.1
 *
 * @param chargingProfileType ChargingProfileType from the request
 * @param stationId station id
 * @param deviceModelRepository deviceModelRepository
 * @param chargingProfileRepository chargingProfileRepository
 * @param transactionEventRepository transactionEventRepository
 * @param logger logger
 * @param evseId evse id
 */
export async function validateChargingProfileType(
  chargingProfileType: OCPP2_0_1.ChargingProfileType,
  tenantId: number,
  stationId: string,
  deviceModelRepository: IDeviceModelRepository,
  chargingProfileRepository: IChargingProfileRepository,
  transactionEventRepository: ITransactionEventRepository,
  logger: Logger<ILogObj>,
  evseId?: number | null,
): Promise<void> {
  if (chargingProfileType.stackLevel < 0) {
    throw new Error('Lowest Stack level is 0');
  }

  if (
    chargingProfileType.chargingProfilePurpose ===
      OCPP2_0_1.ChargingProfilePurposeEnumType.ChargingStationMaxProfile &&
    evseId !== 0
  ) {
    throw new Error('When chargingProfilePurpose is ChargingStationMaxProfile, evseId SHALL be 0');
  }

  if (
    chargingProfileType.chargingProfilePurpose !==
      OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile &&
    chargingProfileType.transactionId
  ) {
    throw new Error(
      'transactionId SHALL only be included when ChargingProfilePurpose is set to TxProfile.',
    );
  }

  let receivedChargingNeeds;
  if (chargingProfileType.transactionId && evseId) {
    const transaction = await transactionEventRepository.readTransactionByStationIdAndTransactionId(
      tenantId,
      stationId,
      chargingProfileType.transactionId,
    );
    if (!transaction) {
      throw new Error(
        `Transaction ${chargingProfileType.transactionId} not found on station ${stationId}.`,
      );
    }
    const evse = await deviceModelRepository.findEvseByIdAndConnectorId(tenantId, evseId, null);
    if (!evse) {
      throw new Error(`Evse ${evseId} not found.`);
    }
    logger.info(`Found evse: ${JSON.stringify(evse)}`);
    receivedChargingNeeds =
      await chargingProfileRepository.findChargingNeedsByEvseDBIdAndTransactionDBId(
        tenantId,
        evse.databaseId,
        transaction.id,
      );
    logger.info(`Found ChargingNeeds: ${JSON.stringify(receivedChargingNeeds)}`);
  }

  const periodsPerSchedules: VariableAttribute[] = await deviceModelRepository.readAllByQuerystring(
    tenantId,
    {
      tenantId: tenantId,
      stationId: stationId,
      component_name: 'SmartChargingCtrlr',
      variable_name: 'PeriodsPerSchedule',
      type: OCPP2_0_1.AttributeEnumType.Actual,
    },
  );
  logger.info(`Found PeriodsPerSchedule: ${JSON.stringify(periodsPerSchedules)}`);
  let periodsPerSchedule;
  if (periodsPerSchedules.length > 0 && periodsPerSchedules[0].value) {
    periodsPerSchedule = Number(periodsPerSchedules[0].value);
  }
  for (const chargingSchedule of chargingProfileType.chargingSchedule) {
    if (
      chargingSchedule.minChargingRate &&
      getNumberOfFractionDigit(chargingSchedule.minChargingRate) > 1
    ) {
      throw new Error(
        `chargingSchedule ${chargingSchedule.id}: minChargingRate accepts at most one digit fraction (e.g. 8.1).`,
      );
    }
    if (periodsPerSchedule && chargingSchedule.chargingSchedulePeriod.length > periodsPerSchedule) {
      throw new Error(
        `ChargingSchedule ${chargingSchedule.id}: The number of chargingSchedulePeriod SHALL not exceed ${periodsPerSchedule}.`,
      );
    }

    for (const chargingSchedulePeriod of chargingSchedule.chargingSchedulePeriod) {
      if (getNumberOfFractionDigit(chargingSchedulePeriod.limit) > 1) {
        throw new Error(
          `ChargingSchedule ${chargingSchedule.id}: chargingSchedulePeriod limit accepts at most one digit fraction (e.g. 8.1).`,
        );
      }

      if (receivedChargingNeeds) {
        if (receivedChargingNeeds.acChargingParameters) {
          // EV AC charging
          if (!chargingSchedulePeriod.numberPhases) {
            chargingSchedulePeriod.numberPhases = 3;
          }
        } else if (receivedChargingNeeds.dcChargingParameters) {
          // EV DC charging
          chargingSchedulePeriod.numberPhases = undefined;
        }
      }
    }

    if (chargingSchedule.salesTariff) {
      if (
        receivedChargingNeeds &&
        receivedChargingNeeds.maxScheduleTuples &&
        chargingSchedule.salesTariff.salesTariffEntry.length >
          receivedChargingNeeds.maxScheduleTuples
      ) {
        throw new Error(
          `ChargingSchedule ${chargingSchedule.id}: The number of SalesTariffEntry elements (${chargingSchedule.salesTariff.salesTariffEntry.length}) SHALL not exceed maxScheduleTuples (${receivedChargingNeeds.maxScheduleTuples}).`,
        );
      }

      for (const salesTariffEntry of chargingSchedule.salesTariff.salesTariffEntry) {
        if (salesTariffEntry.consumptionCost) {
          for (const consumptionCost of salesTariffEntry.consumptionCost) {
            if (consumptionCost.cost) {
              for (const cost of consumptionCost.cost) {
                if (
                  cost.amountMultiplier &&
                  (cost.amountMultiplier > 3 || cost.amountMultiplier < -3)
                ) {
                  throw new Error(
                    `ChargingSchedule ${chargingSchedule.id}: amountMultiplier SHALL be in [-3, 3].`,
                  );
                }
              }
            }
          }
        }
      }
    }
  }
}
