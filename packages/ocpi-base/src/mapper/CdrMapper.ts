// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Service } from 'typedi';
import type { Cdr } from '../model/Cdr.js';
import type { Session } from '../model/Session.js';
import { SessionMapper } from './SessionMapper.js';
import type { CdrLocation } from '../model/CdrLocation.js';
import type { Price } from '../model/Price.js';
import type { Tariff as OcpiTariff } from '../model/Tariff.js';
import type { SignedData } from '../model/SignedData.js';
import type { LocationDTO } from '../model/DTO/LocationDTO.js';
import { BaseTransactionMapper } from './BaseTransactionMapper.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { OcpiGraphqlClient } from '../graphql/index.js';
import { LocationsService } from '../services/LocationsService.js';
import type { TariffDto, TransactionDto } from '@citrineos/base';

@Service()
export class CdrMapper extends BaseTransactionMapper {
  constructor(
    protected logger: Logger<ILogObj>,
    protected locationsService: LocationsService,
    protected ocpiGraphqlClient: OcpiGraphqlClient,
    readonly sessionMapper: SessionMapper,
  ) {
    super(logger, locationsService, ocpiGraphqlClient);
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
      return await this.mapSessionsToCDRs(
        sessions,
        transactionIdToLocationMap,
        transactionIdToTariffMap,
        transactionIdToOcpiTariffMap,
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
  ): Promise<Cdr[]> {
    return Promise.all(
      sessions
        .filter((session) => transactionIdToTariffMap.has(session.id))
        .map((session) =>
          this.mapSessionToCDR(
            session,
            transactionIdToLocationMap.get(session.id)!,
            transactionIdToTariffMap.get(session.id)!,
            transactionIdToOcpiTariffMap.get(session.id)!,
          ),
        ),
    );
  }

  private async mapSessionToCDR(
    session: Session,
    location: LocationDTO,
    tariff: TariffDto,
    ocpiTariff: OcpiTariff,
  ): Promise<Cdr> {
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
      tariffs: [ocpiTariff],
      charging_periods: session.charging_periods || [],
      signed_data: await this.getSignedData(session),
      // TODO: Map based on OCPI Tariff
      total_cost: this.calculateTotalCost(session.kwh, tariff.pricePerKwh),
      total_fixed_cost: await this.calculateTotalFixedCost(tariff),
      total_energy: session.kwh,
      total_energy_cost: await this.calculateTotalEnergyCost(session, tariff),
      total_time: this.calculateTotalTime(session),
      total_time_cost: await this.calculateTotalTimeCost(session, tariff),
      total_parking_time: await this.calculateTotalParkingTime(session),
      total_parking_cost: await this.calculateTotalParkingCost(session, tariff),
      total_reservation_cost: await this.calculateTotalReservationCost(session, tariff),
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

  private async calculateTotalFixedCost(_tariff: any): Promise<Price | undefined> {
    // TODO: Return total fixed cost if needed
    return undefined;
  }

  private async calculateTotalEnergyCost(
    _session: Session,
    _tariff: TariffDto,
  ): Promise<Price | undefined> {
    // TODO: Return total energy cost if needed
    return undefined;
  }

  private calculateTotalTime(session: Session): number {
    if (session.end_date_time) {
      return (session.end_date_time.getTime() - session.start_date_time.getTime()) / 3600000; // Convert ms to hours
    }
    return 0;
  }

  private async calculateTotalTimeCost(
    _session: Session,
    _tariff: TariffDto,
  ): Promise<Price | undefined> {
    // TODO: Return total time cost if needed
    return undefined;
  }

  private async calculateTotalParkingTime(_session: Session): Promise<number> {
    // TODO: Return total parking time if needed
    return 0;
  }

  private async calculateTotalParkingCost(
    _session: Session,
    _tariff: TariffDto,
  ): Promise<Price | undefined> {
    // TODO: Return total parking cost if needed
    return undefined;
  }

  private async calculateTotalReservationCost(
    _session: Session,
    _tariff: TariffDto,
  ): Promise<Price | undefined> {
    // TODO: Return total reservation cost if needed
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
    return transactions.filter((transaction) => !transaction.isActive);
  }
}
