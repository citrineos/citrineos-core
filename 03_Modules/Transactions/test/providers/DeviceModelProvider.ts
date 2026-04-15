// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil.js';
import { ChargingStation, Component, Connector, Evse, EvseType, Variable } from '@citrineos/data';

export const MOCK_STATION_ID = 'Station01';
export const MOCK_EVSE_ID = 1;
export const MOCK_CONNECTOR_ID = 1;

export function aChargingStation(
  updateFunction?: UpdateFunction<ChargingStation>,
): ChargingStation {
  const chargingStation: ChargingStation = {
    id: MOCK_STATION_ID,
  } as ChargingStation;

  return applyUpdateFunction(chargingStation, updateFunction);
}

export function anEvse(updateFunction?: UpdateFunction<EvseType>): EvseType {
  const evse: EvseType = {
    databaseId: MOCK_EVSE_ID,
    id: MOCK_CONNECTOR_ID,
    connectorId: MOCK_CONNECTOR_ID,
  } as EvseType;

  return applyUpdateFunction(evse, updateFunction);
}

export function aConnector(updateFunction?: UpdateFunction<Connector>): Connector {
  const connector: Connector = {
    id: MOCK_CONNECTOR_ID,
    stationId: MOCK_STATION_ID,
    evseId: MOCK_EVSE_ID,
    connectorId: MOCK_CONNECTOR_ID,
    evseTypeConnectorId: MOCK_CONNECTOR_ID,
    status: 'Available',
  } as unknown as Connector;

  return applyUpdateFunction(connector, updateFunction);
}

export function aEvse(updateFunction?: UpdateFunction<Evse>): Evse {
  const evse: Evse = {
    id: MOCK_EVSE_ID,
    stationId: MOCK_STATION_ID,
    evseTypeId: MOCK_EVSE_ID,
    evseId: MOCK_EVSE_ID,
    connectors: [aConnector()],
  } as unknown as Evse;

  return applyUpdateFunction(evse, updateFunction);
}

export function aComponent(updateFunction?: UpdateFunction<Component>): Component {
  const component: Component = {
    name: 'Any',
  } as Component;

  return applyUpdateFunction(component, updateFunction);
}

export function aVariable(updateFunction?: UpdateFunction<Variable>): Variable {
  const variable: Variable = {
    name: 'Any',
  } as Variable;

  return applyUpdateFunction(variable, updateFunction);
}
