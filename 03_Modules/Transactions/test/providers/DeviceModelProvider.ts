import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { ChargingStation, Component, Evse, Variable } from '@citrineos/data';

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

export function anEvse(updateFunction?: UpdateFunction<Evse>): Evse {
  const evse: Evse = {
    databaseId: MOCK_EVSE_ID,
    id: MOCK_CONNECTOR_ID,
    connectorId: MOCK_CONNECTOR_ID,
  } as Evse;

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
