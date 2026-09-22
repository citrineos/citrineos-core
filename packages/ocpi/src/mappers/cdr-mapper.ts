// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Cdr } from '../types/cdr.js';
import type { Session } from '../types/session.js';
import type { SessionMapper } from './session-mapper.js';
import type { CdrLocation } from '../types/cdr-location.js';
import type { Price } from '@citrineos/base';
import type { Tariff as OcpiTariff } from '../types/tariff.js';
import type { SignedData } from '../types/signed-data.js';
import type { LocationDTO } from '../types/dto/location-dto.js';
import type { ChargingPeriod } from '../types/charging-period.js';
import type { OcpiTransactionMapperDependencies } from './base-transaction-mapper.js';
import { BaseTransactionMapper } from './base-transaction-mapper.js';
import type { TariffDto, TransactionDto } from '@citrineos/types';
import type { PricedSession } from './cdr-cost.js';
import {
  calculateEnergyCost,
  calculateFixedCost,
  calculateTimeCost,
  calculateTotalCdrCost,
  calculateTotalParkingTimeHours,
  calculateTotalTimeHours,
} from './cdr-cost.js';

export interface CdrMapperDependencies extends OcpiTransactionMapperDependencies {
  sessionMapper: SessionMapper;
}

export class CdrMapper extends BaseTransactionMapper {
  readonly sessionMapper: SessionMapper;

  constructor(dependencies: CdrMapperDependencies) {
    super(dependencies);
    this.sessionMapper = dependencies.sessionMapper;
  }

  public async mapTransactionsToCdrs(transactions: TransactionDto[]): Promise<Cdr[]> {
    try {
      const validTransactions = this.getCompletedTransactions(transactions);

      const sessions = await this.mapTransactionsToSessions(validTransactions);

      const [transactionIdToTariffMap, transactionIdToLocationMap] = await Promise.all([
        this.getTariffsForTransactions(validTransactions),
        this.getLocationDTOsForTransactions(transactions),
      ]);
      const transactionIdToOcpiTariffMap: Map<string, OcpiTariff> =
        await this.getOcpiTariffsForTransactions(sessions, transactionIdToTariffMap);
      const transactionIdToTimeSpentCharging = new Map(
        validTransactions.map((transaction) => [
          transaction.transactionId,
          transaction.timeSpentCharging,
        ]),
      );
      return await this.mapSessionsToCDRs(
        sessions,
        transactionIdToLocationMap,
        transactionIdToTariffMap,
        transactionIdToOcpiTariffMap,
        transactionIdToTimeSpentCharging,
      );
    } catch (error) {
      // Log the original error for debugging
      this.logger.error('Error mapping transactions to CDRs', { error });

      // Preserve the original error context while providing a clear message
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to map transactions to CDRs: ${errorMessage}`);
    }
  }

  private async mapTransactionsToSessions(transactions: TransactionDto[]): Promise<Session[]> {
    return this.sessionMapper.mapTransactionsToSessions(transactions);
  }

  private async mapSessionsToCDRs(
    sessions: Session[],
    transactionIdToLocationMap: Map<string, LocationDTO>,
    transactionIdToTariffMap: Map<string, TariffDto>,
    transactionIdToOcpiTariffMap: Map<string, OcpiTariff>,
    transactionIdToTimeSpentCharging: Map<string | undefined, number | null | undefined>,
  ): Promise<Cdr[]> {
    return Promise.all(
      sessions
        .filter(
          (session): session is Session & { charging_periods: ChargingPeriod[] } =>
            transactionIdToTariffMap.has(session.id) && !!session.charging_periods?.length,
        )
        .map((session) =>
          this.mapSessionToCDR(
            session,
            transactionIdToLocationMap.get(session.id)!,
            transactionIdToTariffMap.get(session.id)!,
            transactionIdToOcpiTariffMap.get(session.id)!,
            transactionIdToTimeSpentCharging.get(session.id),
          ),
        ),
    );
  }

  private async mapSessionToCDR(
    session: Session & { charging_periods: ChargingPeriod[] },
    location: LocationDTO,
    tariff: TariffDto,
    ocpiTariff: OcpiTariff,
    timeSpentChargingSeconds?: number | null,
  ): Promise<Cdr> {
    const priced: PricedSession = { ...session, timeSpentChargingSeconds };
    return {
      country_code: session.country_code,
      party_id: session.party_id,
      id: this.generateCdrId(session),
      start_date_time: session.start_date_time,
      end_date_time: session.end_date_time!,
      session_id: session.id,
      cdr_token: session.cdr_token,
      auth_method: session.auth_method,
      authorization_reference: session.authorization_reference,
      cdr_location: await this.createCdrLocation(location, session),
      meter_id: session.meter_id,
      currency: session.currency,
      tariffs: ocpiTariff ? [ocpiTariff] : undefined,
      charging_periods: session.charging_periods,
      signed_data: await this.getSignedData(session),
      total_cost: calculateTotalCdrCost(priced, tariff),
      total_fixed_cost: calculateFixedCost(tariff),
      total_energy: session.kwh,
      total_energy_cost: calculateEnergyCost(session, tariff),
      total_time: calculateTotalTimeHours(session),
      total_time_cost: calculateTimeCost(priced, tariff),
      total_parking_time: calculateTotalParkingTimeHours(priced),
      total_parking_cost: this.calculateTotalParkingCost(),
      total_reservation_cost: this.calculateTotalReservationCost(),
      remark: this.generateRemark(session),
      invoice_reference_id: await this.generateInvoiceReferenceId(session),
      credit: this.isCredit(session, tariff),
      credit_reference_id: this.generateCreditReferenceId(session, tariff),
      last_updated: session.last_updated,
    };
  }

  private generateCdrId(session: Session): string {
    return session.id;
  }

  private async createCdrLocation(location: LocationDTO, session: Session): Promise<CdrLocation> {
    return {
      id: location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      postal_code: location.postal_code,
      country: location.country,
      coordinates: location.coordinates,
      evse_uid: session.evse_uid,
      evse_id: this.getEvseId(session.evse_uid, location),
      connector_id: session.connector_id,
      connector_standard: this.getConnectorStandard(location, session),
      connector_format: this.getConnectorFormat(location, session),
      connector_power_type: this.getConnectorPowerType(location, session),
    };
  }

  private getEvseId(evseUid: string, location: LocationDTO): string {
    return location.evses?.find((evse) => evse.uid === evseUid)?.evse_id ?? '';
  }

  private getConnectorStandard(location: LocationDTO, session: Session): string {
    const evseDto = location.evses?.find((evse) => evse.uid === session.evse_uid);
    const connectorDto = evseDto?.connectors.find(
      (connector) => connector.id === session.connector_id,
    );
    return connectorDto?.standard || '';
  }

  private getConnectorFormat(location: LocationDTO, session: Session): string {
    const evseDto = location.evses?.find((evse) => evse.uid === session.evse_uid);
    const connectorDto = evseDto?.connectors.find(
      (connector) => connector.id === session.connector_id,
    );
    return connectorDto?.format || '';
  }

  private getConnectorPowerType(location: LocationDTO, session: Session): string {
    const evseDto = location.evses?.find((evse) => evse.uid === session.evse_uid);
    const connectorDto = evseDto?.connectors.find(
      (connector) => connector.id === session.connector_id,
    );
    return connectorDto?.power_type || '';
  }

  private async getSignedData(_session: Session): Promise<SignedData | undefined> {
    // TODO: Implement signed data logic if required
    return undefined;
  }

  // TODO: Implement writes idleTime and calculate the cost
  private calculateTotalParkingCost(): Price | undefined {
    return undefined;
  }

  // TODO: Implement price reservations once a duration is reachable. A CDR carries
  //  no reservation time and Transaction has only reservationId.
  private calculateTotalReservationCost(): Price | undefined {
    return undefined;
  }

  private generateRemark(_session: Session): string | undefined {
    // TODO: Generate remark based on session details if needed
    return undefined;
  }

  private async generateInvoiceReferenceId(_session: Session): Promise<string | undefined> {
    // TODO: Generate invoice reference ID if needed
    return undefined;
  }

  private isCredit(_session: Session, _tariff: TariffDto): boolean | undefined {
    // TODO: Return whether CDR is a Credit CDR if needed
    return undefined;
  }

  private generateCreditReferenceId(_session: Session, _tariff: TariffDto): string | undefined {
    // TODO: Return Credit Reference ID for Credit CDR if needed
    return undefined;
  }

  private getCompletedTransactions(transactions: TransactionDto[]): TransactionDto[] {
    return transactions.filter((transaction) => !transaction.isActive && !!transaction.endTime);
  }
}
