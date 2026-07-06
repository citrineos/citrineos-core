// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPVersion } from '@citrineos/base';
import { ChangeConfigurationModal } from '@lib/client/components/modals/1.6/change-configuration/change.configuration.modal';
import { Button } from '@lib/client/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@lib/client/components/ui/dialog';
import { Input } from '@lib/client/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lib/client/components/ui/select';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import {
  CHANGE_CONFIGURATION_DOWNLOAD_QUERY,
  CHANGE_CONFIGURATION_LIST_QUERY,
} from '@lib/queries/change.configurations';
import { CHARGING_STATION_ONLINE_STATUS_QUERY } from '@lib/queries/charging.stations';
import {
  VARIABLE_ATTRIBUTE_DOWNLOAD_QUERY,
  VARIABLE_ATTRIBUTE_LIST_QUERY,
} from '@lib/queries/variable.attributes';
import { ResourceType } from '@lib/utils/access.types';
import { downloadCSV } from '@lib/utils/download';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { type CrudFilter, useList, useOne, useTranslate } from '@refinedev/core';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Plus } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface VariableAttribute {
  id: string;
  type: string;
  value: string;
  Variable: {
    name: string;
    instance: string;
  };
  Component: {
    name: string;
    instance: string;
  };
  evseDatabaseId: number | null;
  Evse: {
    id: string;
    connectorId: string;
  };
}

interface ChangeConfiguration {
  ocppConnectionName: string;
  key: string;
  value?: string | null;
  readonly?: boolean | null;
}

interface ChargingStationConfigurationProps {
  id: number;
}

const CONFIG_1_6_COLUMNS = [
  { key: 'key', headerKey: 'ChargingStations.configuration.key', accessor: 'key' },
  {
    key: 'value',
    headerKey: 'ChargingStations.configuration.value',
    accessor: 'value',
  },
];

const CONFIG_2_0_1_COLUMNS = [
  {
    key: 'type',
    headerKey: 'ChargingStations.configuration.type',
    accessor: 'type',
  },
  {
    key: 'value',
    headerKey: 'ChargingStations.configuration.value',
    accessor: 'value',
  },
  {
    key: 'component',
    headerKey: 'ChargingStations.configuration.componentNameInstance',
    accessor: 'component',
  },
  {
    key: 'variable',
    headerKey: 'ChargingStations.configuration.variableNameInstance',
    accessor: 'variable',
  },
  {
    key: 'evse',
    headerKey: 'ChargingStations.configuration.evseConnectorId',
    accessor: 'evse',
  },
];

export const ChargingStationConfiguration: React.FC<ChargingStationConfigurationProps> = ({
  id,
}) => {
  const translate = useTranslate();
  const [version, setVersion] = useState<'1.6' | '2.0.1'>('1.6');
  const [searchTerm, setSearchTerm] = useState('');
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [currentVariableAttributes, setCurrentVariableAttributes] = useState(1);
  const [pageSizeVariableAttributes, setPageSizeVariableAttributes] = useState(20);
  const [currentChangeConfigurations, setCurrentChangeConfigurations] = useState(1);
  const [pageSizeChangeConfigurations, setPageSizeChangeConfigurations] = useState(20);
  const [isChangeConfigModalOpen, setIsChangeConfigModalOpen] = useState(false);
  const [changeConfigMode, setChangeConfigMode] = useState<'add' | 'edit'>('add');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string | null>(null);
  const versionInitialized = useRef(false);

  const {
    query: { data },
  } = useOne<ChargingStationClass>({
    resource: ResourceType.CHARGING_STATIONS,
    id,
    meta: {
      gqlQuery: CHARGING_STATION_ONLINE_STATUS_QUERY,
    },
    queryOptions: getPlainToInstanceOptions(ChargingStationClass, true),
  });
  const station = data?.data;
  const isConnected = !!station?.isOnline;

  const attributeFilters = useMemo<CrudFilter[]>(
    () => [{ field: 'stationId', operator: 'eq', value: id }],
    [id],
  );

  const configFilters = useMemo<CrudFilter[]>(
    () => [
      {
        field: 'id',
        operator: 'eq',
        value: station?.id ?? -1,
      },
    ],
    [station?.id],
  );

  const {
    query: {
      data: variableAttributesResult,
      isLoading: isAttributesLoading,
      error: attributesError,
    },
  } = useList<VariableAttribute>({
    resource: 'VariableAttributes',
    meta: { gqlQuery: VARIABLE_ATTRIBUTE_LIST_QUERY },
    filters: attributeFilters,
    sorters: [{ field: 'createdAt', order: 'desc' }],
    pagination: {
      currentPage: currentVariableAttributes,
      pageSize: pageSizeVariableAttributes,
    },
  });

  const {
    query: {
      data: changeConfigurationsResult,
      isLoading: isConfigurationsLoading,
      error: configurationsError,
    },
  } = useList<ChangeConfiguration>({
    resource: 'ChangeConfigurations',
    meta: { gqlQuery: CHANGE_CONFIGURATION_LIST_QUERY },
    filters: configFilters,
    sorters: [{ field: 'key', order: 'asc' }],
    pagination: {
      currentPage: currentChangeConfigurations,
      pageSize: pageSizeChangeConfigurations,
    },
  });

  const {
    query: { data: variableAttributesForDownload, isLoading: isAttributesDownloadLoading },
  } = useList<VariableAttribute>({
    resource: 'VariableAttributes',
    meta: {
      gqlQuery: VARIABLE_ATTRIBUTE_DOWNLOAD_QUERY,
      gqlVariables: { id },
    },
    pagination: {
      mode: 'off',
    },
  });

  const {
    query: {
      data: changeConfigurationsForDownload,
      isLoading: isDownloadChangeConfigurationsLoading,
    },
  } = useList<ChangeConfiguration>({
    resource: 'ChangeConfigurations',
    meta: {
      gqlQuery: CHANGE_CONFIGURATION_DOWNLOAD_QUERY,
      gqlVariables: { ocppConnectionName: station?.ocppConnectionName ?? '' },
    },
    pagination: {
      mode: 'off',
    },
  });

  // Set initial version based on station protocol
  useEffect(() => {
    if (station?.protocol && !versionInitialized.current) {
      versionInitialized.current = true;
      if (station.protocol === OCPPVersion.OCPP2_0_1) {
        setVersion('2.0.1');
      } else {
        setVersion('1.6');
      }
    }
  }, [station?.protocol]);

  useEffect(() => {
    if (version === '2.0.1' && variableAttributesResult?.data) {
      setDataSource(
        variableAttributesResult.data.map((attribute) => ({
          key: attribute.id,
          type: attribute.type,
          value: attribute.value,
          component: `${attribute.Component?.name ?? '-'}:${attribute.Component?.instance ?? '-'}`,
          variable: `${attribute.Variable?.name ?? '-'}:${attribute.Variable?.instance ?? '-'}`,
          evse: `${attribute.Evse?.id ?? '-'}:${attribute.Evse?.connectorId ?? '-'}`,
        })),
      );
    } else if (version === '1.6' && changeConfigurationsResult?.data) {
      setDataSource(
        changeConfigurationsResult.data.map((config) => ({
          key: config.key,
          value: config.value,
        })),
      );
    }

    if (attributesError) {
      toast.error(translate('ChargingStations.configuration.loadAttributesError'));
    }
    if (configurationsError) {
      toast.error(translate('ChargingStations.configuration.loadConfigurationsError'));
    }
  }, [
    version,
    variableAttributesResult,
    changeConfigurationsResult,
    attributesError,
    configurationsError,
    translate,
  ]);

  const filteredDataSource = useMemo(() => {
    if (!searchTerm) return dataSource;
    const term = searchTerm.toLowerCase();
    return dataSource.filter((item) => {
      const valuesToCheck =
        version === '1.6'
          ? [item.key, item.value]
          : [item.type, item.value, item.component, item.variable, item.evse];
      return valuesToCheck.some((val) => val?.toString().toLowerCase().includes(term));
    });
  }, [dataSource, searchTerm, version]);

  const handleDownloadConfigurations = () => {
    if (version === '1.6') {
      if (!changeConfigurationsForDownload?.data) {
        toast.error(translate('ChargingStations.configuration.noDataForDownload'));
        return;
      }
      downloadCSV(
        `configurations_${station?.ocppConnectionName}_${version}_${new Date().toISOString()}`,
        [
          translate('ChargingStations.configuration.stationId'),
          ...CONFIG_1_6_COLUMNS.map((col) => translate(col.headerKey)),
        ],
        changeConfigurationsForDownload.data,
        (item) => [item.ocppConnectionName, item.key, item.value ?? ''],
      );
    } else {
      if (!variableAttributesForDownload?.data) {
        toast.error(translate('ChargingStations.configuration.noDataForDownload'));
        return;
      }
      downloadCSV(
        `configurations_${station?.ocppConnectionName}_${version}_${new Date().toISOString()}`,
        [
          translate('ChargingStations.configuration.stationId'),
          ...CONFIG_2_0_1_COLUMNS.map((col) => translate(col.headerKey)),
        ],
        variableAttributesForDownload.data,
        (item) => [
          String(id),
          item.type,
          item.value,
          `${item.Component?.name ?? '-'}:${item.Component?.instance ?? '-'}`,
          `${item.Variable?.name ?? '-'}:${item.Variable?.instance ?? '-'}`,
          `${item.Evse?.id ?? '-'}:${item.Evse?.connectorId ?? '-'}`,
        ],
      );
    }
  };

  // Add/Edit button handlers
  const handleAddConfig = () => {
    setChangeConfigMode('add');
    setEditKey(null);
    setEditValue(null);
    setIsChangeConfigModalOpen(true);
  };
  const handleEditConfig = (key: string, value: string) => {
    setChangeConfigMode('edit');
    setEditKey(key);
    setEditValue(value);
    setIsChangeConfigModalOpen(true);
  };
  const handleModalClose = () => {
    setIsChangeConfigModalOpen(false);
  };

  const currentPage = version === '1.6' ? currentChangeConfigurations : currentVariableAttributes;
  const pageSize = version === '1.6' ? pageSizeChangeConfigurations : pageSizeVariableAttributes;
  const totalRecords =
    version === '1.6'
      ? (changeConfigurationsResult?.total ?? 0)
      : (variableAttributesResult?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const setCurrentPage = (page: number) => {
    if (version === '1.6') {
      setCurrentChangeConfigurations(page);
    } else {
      setCurrentVariableAttributes(page);
    }
  };

  const setPageSize = (size: number) => {
    if (version === '1.6') {
      setPageSizeChangeConfigurations(size);
      setCurrentChangeConfigurations(1);
    } else {
      setPageSizeVariableAttributes(size);
      setCurrentVariableAttributes(1);
    }
  };

  const renderPagination = () => {
    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    return (
      <div className="flex flex-col sm:flex-row gap-y-4 sm:gap-y-0 items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">{totalRecords} total records</div>
        <div className="flex flex-col-reverse gap-y-4 sm:gap-y-0 sm:flex-row items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{translate('pagination.rowsPerPage')}</span>
            <Select value={`${pageSize}`} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            {translate('Common.pageOf', { page: currentPage, total: totalPages })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(1)}
              disabled={!canGoPrevious}
            >
              <span className="sr-only">{translate('pagination.buttons.goToFirstPage')}</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!canGoPrevious}
            >
              <span className="sr-only">{translate('pagination.buttons.goToPreviousPage')}</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!canGoNext}
            >
              <span className="sr-only">{translate('pagination.buttons.goToNextPage')}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(totalPages)}
              disabled={!canGoNext}
            >
              <span className="sr-only">{translate('pagination.buttons.goToLastPage')}</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    const columns = version === '1.6' ? CONFIG_1_6_COLUMNS : CONFIG_2_0_1_COLUMNS;
    const isLoading = version === '2.0.1' ? isAttributesLoading : isConfigurationsLoading;

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-2 text-left text-sm font-medium">
                    {translate(col.headerKey)}
                  </th>
                ))}
                {version === '1.6' && (
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    {translate('ChargingStations.configuration.action')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (version === '1.6' ? 1 : 0)}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {translate('Common.loadingEllipsis')}
                  </td>
                </tr>
              ) : filteredDataSource.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (version === '1.6' ? 1 : 0)}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {translate('ChargingStations.configuration.noData')}
                  </td>
                </tr>
              ) : (
                filteredDataSource.map((row, idx) => (
                  <tr key={row.key || idx} className="border-t hover:bg-muted/50">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-2 text-sm wrap-break-word">
                        {row[col.accessor]}
                      </td>
                    ))}
                    {version === '1.6' && (
                      <td className="px-4 py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditConfig(row.key, row.value)}
                          disabled={!isConnected}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {translate('Common.edit')}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {translate('ChargingStations.configuration.selectOcppVersion')}
          </label>
          <div className="flex gap-2">
            <Select value={version} onValueChange={(v: '1.6' | '2.0.1') => setVersion(v)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.6">OCPP 1.6</SelectItem>
                <SelectItem value="2.0.1">OCPP 2.0.1</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleDownloadConfigurations}
              disabled={isDownloadChangeConfigurationsLoading && isAttributesDownloadLoading}
            >
              {translate('ChargingStations.configuration.downloadCsv')}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{translate('Common.search')}</label>
          <Input
            placeholder={translate('ChargingStations.configuration.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {version === '1.6' && (
        <div className="flex justify-end">
          <Button onClick={handleAddConfig} disabled={!isConnected}>
            <Plus className="mr-2 h-4 w-4" />
            {translate('ChargingStations.configuration.addConfiguration')}
          </Button>
        </div>
      )}

      {renderTable()}

      {renderPagination()}

      <Dialog open={isChangeConfigModalOpen} onOpenChange={setIsChangeConfigModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {changeConfigMode === 'add'
                ? translate('ChargingStations.configuration.addConfiguration')
                : translate('ChargingStations.configuration.editConfiguration')}
            </DialogTitle>
          </DialogHeader>
          <ChangeConfigurationModal
            station={station as ChargingStationClass}
            defaultConfiguration={
              changeConfigMode === 'edit' && editKey != null
                ? { key: editKey, value: editValue ?? '' }
                : undefined
            }
            onFinish={handleModalClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChargingStationConfiguration;
