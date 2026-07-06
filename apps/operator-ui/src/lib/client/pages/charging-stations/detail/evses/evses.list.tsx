// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ChevronDown } from 'lucide-react';
import type { ChargingStationDto, ConnectorDto, EvseDto } from '@citrineos/base';
import { Button } from '@lib/client/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@lib/client/components/ui/dialog';
import { ConnectorsTable } from '@lib/client/pages/charging-stations/detail/connectors/connectors.table';
import { ConnectorsUpsert } from '@lib/client/pages/charging-stations/detail/connectors/connectors.upsert';
import { EvseUpsert } from '@lib/client/pages/charging-stations/detail/evses/evses.upsert';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import type { ConnectorClass } from '@lib/cls/connector.dto';
import type { EvseClass } from '@lib/cls/evse.dto';
import { CHARGING_STATIONS_GET_QUERY } from '@lib/queries/charging.stations';
import { ResourceType } from '@lib/utils/access.types';
import { setSelectedChargingStation } from '@lib/utils/store/selected.charging.station.slice';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { useOne, useTranslate } from '@refinedev/core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

interface EVSESListProps {
  id: number;
}

export const evsesFormUpsertGrid = 'grid grid-cols-2 xs:grid-cols-1 gap-6';

export const EVSESList: React.FC<EVSESListProps> = ({ id }) => {
  const translate = useTranslate();
  const dispatch = useDispatch();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'evse' | 'connector' | null>(null);
  const [selectedItem, setSelectedItem] = useState<EvseClass | ConnectorClass | null>(null);
  const [evseId, setEvseId] = useState<number | null>(null);

  const {
    query: { data, isLoading, refetch },
  } = useOne<ChargingStationDto>({
    resource: ResourceType.CHARGING_STATIONS,
    id,
    meta: {
      gqlQuery: CHARGING_STATIONS_GET_QUERY,
    },
    queryOptions: getPlainToInstanceOptions(ChargingStationClass, true),
  });

  const station = React.useMemo(() => {
    const station = { ...data?.data } as ChargingStationDto;
    return station;
  }, [data?.data]);

  const openModal = useCallback(
    (
      type: 'evse' | 'connector',
      item: EvseClass | ConnectorClass | null = null,
      evseId: number | null = null,
    ) => {
      setModalType(type);
      setSelectedItem(item);
      setEvseId(evseId);
      setIsModalVisible(true);
    },
    [],
  );

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setModalType(null);
    setSelectedItem(null);
    setEvseId(null);
  }, []);

  const handleFormSubmit = useCallback(async () => {
    await refetch();
    closeModal();
  }, [closeModal, refetch]);

  useEffect(() => {
    dispatch(
      setSelectedChargingStation({
        selectedChargingStation: station,
      }),
    );
  }, [dispatch, station]);

  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const handleExpandToggle = (record: EvseClass) => {
    const evseId = record.id;
    if (evseId === undefined) return;
    const isExpanded = expandedRowKeys.includes(evseId);
    if (isExpanded) {
      setExpandedRowKeys((prev) => prev.filter((key) => key !== evseId));
    } else {
      setExpandedRowKeys((prev) => [...prev, evseId]);
    }
  };

  const getCurrentEvse = useCallback(
    (item: EvseClass | ConnectorClass | null): EvseDto | null => {
      if (!item || !station?.evses || modalType !== 'evse') return item as EvseDto | null;

      const currentEvse = station.evses.find((evse) => evse.id === item.id);
      return currentEvse || (item as EvseDto);
    },
    [station?.evses, modalType],
  );

  const getCurrentConnector = useCallback(
    (item: EvseClass | ConnectorClass | null): ConnectorDto | null => {
      if (!item || !station?.evses || modalType !== 'connector') return item as ConnectorDto | null;

      for (const evse of station.evses) {
        const currentConnector = evse.connectors?.find((connector) => connector.id === item.id);
        if (currentConnector) {
          return currentConnector;
        }
      }
      return item as ConnectorDto;
    },
    [station?.evses, modalType],
  );

  const renderModalContent = () => {
    if (modalType === 'evse' && station.id) {
      const currentEvse = getCurrentEvse(selectedItem);
      return (
        <EvseUpsert
          onSubmit={handleFormSubmit}
          stationId={station.id}
          ocppConnectionName={station.ocppConnectionName}
          evse={currentEvse}
        />
      );
    }
    if (modalType === 'connector') {
      const currentConnector = getCurrentConnector(selectedItem);
      return (
        <ConnectorsUpsert
          onSubmit={handleFormSubmit}
          connector={currentConnector}
          evseId={evseId}
        />
      );
    }
    return null;
  };

  const modalTitle = useMemo(() => {
    if (modalType === 'evse') {
      return selectedItem
        ? translate('ChargingStations.evses.editEvse')
        : translate('ChargingStations.evses.addNewEvse');
    }
    if (modalType === 'connector') {
      return selectedItem
        ? translate('ChargingStations.connectors.editConnector')
        : translate('ChargingStations.connectors.addNewConnector');
    }
    return '';
  }, [modalType, selectedItem, translate]);

  const handleConnectorEdit = (connector: ConnectorDto, evseId: number | undefined) => {
    if (evseId === undefined) return;
    openModal('connector', connector, evseId);
  };

  const handleConnectorAdd = (evseId: number | undefined) => {
    if (evseId === undefined) return;
    openModal('connector', null, evseId);
  };

  if (isLoading) return <p>{translate('Common.loadingEllipsis')}</p>;
  if (!station) return <p>{translate('Common.noDataFound')}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openModal('evse')}>
          {translate('ChargingStations.evses.addNewEvse')}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left font-medium">
                {translate('ChargingStations.evses.evseTypeId')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {translate('ChargingStations.evses.evseId')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {translate('ChargingStations.evses.physicalReference')}
              </th>
              <th className="px-4 py-2 text-left font-medium">{translate('Common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {!station.evses || station.evses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {translate('ChargingStations.evses.noEvses')}
                </td>
              </tr>
            ) : (
              station.evses.map((evse) => {
                const evseId = evse.id;
                if (evseId === undefined) return null;
                const isExpanded = expandedRowKeys.includes(evseId);

                return (
                  <React.Fragment key={evseId}>
                    <tr className="border-t hover:bg-muted/50">
                      <td className="px-4 py-2">{evse.evseTypeId}</td>
                      <td className="px-4 py-2">{evse.evseId}</td>
                      <td className="px-4 py-2">{evse.physicalReference}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExpandToggle(evse)}
                            className="flex items-center gap-1"
                          >
                            <span>{translate('ChargingStations.evses.viewConnectors')}</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal('evse', evse)}
                          >
                            {translate('Common.edit')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal('connector', null, evseId)}
                          >
                            {translate('ChargingStations.connectors.addConnector')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 bg-muted/30">
                          <ConnectorsTable
                            connectors={evse.connectors || []}
                            onEdit={(connector) => handleConnectorEdit(connector, evseId)}
                            onAdd={() => handleConnectorAdd(evseId)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
        <DialogContent className="max-w-300! max-h-200!">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          {renderModalContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
