// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useState } from 'react';
import { ListFilter, X } from 'lucide-react';
import { Button } from '@lib/client/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@lib/client/components/ui/popover';
import { Input } from '@lib/client/components/ui/input';
import type { ColumnConfiguration } from '@lib/utils/column.configuration';
import type { FilterItem } from '@lib/client/components/table/fields/table-query-state';
import { buttonIconSize } from '@lib/client/styles/icon';
import { cn } from '@lib/utils/cn';
import { useTranslate } from '@refinedev/core';

type TranslateFn = ReturnType<typeof useTranslate>;

const DATE_PRESETS = [
  { labelKey: 'filterPresets.today', days: 0 },
  { labelKey: 'filterPresets.last7Days', days: 7 },
  { labelKey: 'filterPresets.last30Days', days: 30 },
  { labelKey: 'filterPresets.last3Months', days: 90 },
  { labelKey: 'filterPresets.thisYear', days: 365 },
];

function getPresetDate(days: number): string {
  const d = new Date();
  if (days > 0) d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Returns human-readable field label and value summary for a chip or active-filter row. */
export function getFilterLabel(
  filter: FilterItem,
  columns: ColumnConfiguration[],
  translate: TranslateFn,
): { field: string; value: string } {
  const col = columns.find((c) => (c.filterConfig?.field ?? c.key) === filter.field);
  const fieldLabel = col?.filterConfig?.label ?? col?.header ?? filter.field;
  const unit = col?.filterConfig?.unit ?? '';

  const val = filter.value;
  switch (filter.op) {
    case 'eq':
      if (val === 'true') return { field: fieldLabel, value: translate('Common.yes') };
      if (val === 'false') return { field: fieldLabel, value: translate('Common.no') };
      return { field: fieldLabel, value: String(val) };
    case 'lte':
      return {
        field: fieldLabel,
        value: translate('Common.atMost', { value: `${val}${unit ? ' ' + unit : ''}` }),
      };
    case 'gte': {
      try {
        const d = new Date(String(val));
        return {
          field: fieldLabel,
          value: translate('Common.after', { value: d.toLocaleDateString() }),
        };
      } catch {
        return { field: fieldLabel, value: translate('Common.after', { value: String(val) }) };
      }
    }
    case 'in':
      return {
        field: fieldLabel,
        value: Array.isArray(val) ? (val as string[]).join(', ') : String(val),
      };
    case 'contains':
      return { field: fieldLabel, value: `"${val}"` };
    default:
      return { field: fieldLabel, value: String(val) };
  }
}

// ---------------------------------------------------------------------------
// ValueInput – renders the appropriate input control for the selected column
// ---------------------------------------------------------------------------

interface ValueInputProps {
  col: ColumnConfiguration;
  textValue: string;
  onTextChange: (v: string) => void;
  sliderValue: number;
  onSliderChange: (v: number) => void;
  selectedDatePreset: number;
  onDatePresetChange: (i: number) => void;
  selectedEnumValues: string[];
  onEnumToggle: (v: string) => void;
  yesNoValue: 'true' | 'false' | null;
  onYesNoChange: (v: 'true' | 'false') => void;
}

function ValueInput({
  col,
  textValue,
  onTextChange,
  sliderValue,
  onSliderChange,
  selectedDatePreset,
  onDatePresetChange,
  selectedEnumValues,
  onEnumToggle,
  yesNoValue,
  onYesNoChange,
}: ValueInputProps) {
  const translate = useTranslate();
  const cfg = col.filterConfig!;

  if (cfg.type === 'text') {
    return (
      <Input
        placeholder={translate('Common.searchField', { field: cfg.label ?? col.header })}
        value={textValue}
        onChange={(e) => onTextChange(e.target.value)}
        className="h-8 text-sm"
      />
    );
  }

  if (cfg.type === 'number') {
    const min = cfg.min ?? 0;
    const max = cfg.max ?? 100;
    return (
      <div className="px-1 py-1">
        <p className="mb-2 text-center text-lg font-medium">
          {sliderValue}
          {cfg.unit && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {translate('filters.valueOrLess', { unit: cfg.unit })}
            </span>
          )}
        </p>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={sliderValue}
          onChange={(e) => onSliderChange(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: 'hsl(var(--primary))' }}
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>
            {min}
            {cfg.unit ? ' ' + cfg.unit : ''}
          </span>
          <span>
            {max}
            {cfg.unit ? ' ' + cfg.unit : ''}
          </span>
        </div>
      </div>
    );
  }

  if (cfg.type === 'date') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {DATE_PRESETS.map((preset, i) => (
          <button
            key={preset.labelKey}
            onClick={() => onDatePresetChange(i)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              selectedDatePreset === i
                ? 'border-primary bg-primary/10 font-medium text-primary'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
            )}
          >
            {translate(preset.labelKey)}
          </button>
        ))}
      </div>
    );
  }

  if (cfg.type === 'enum') {
    return (
      <div className="flex flex-col gap-0.5">
        {(cfg.enumOptions ?? []).map((opt: any) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-primary"
              checked={selectedEnumValues.includes(opt.value)}
              onChange={() => onEnumToggle(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  if (cfg.type === 'yesno') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => onYesNoChange('true')}
          className={cn(
            'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
            yesNoValue === 'true'
              ? 'border-success bg-success/10 text-success'
              : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          {translate('Common.yes')}
        </button>
        <button
          onClick={() => onYesNoChange('false')}
          className={cn(
            'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
            yesNoValue === 'false'
              ? 'border-destructive bg-destructive/10 text-destructive'
              : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          {translate('Common.no')}
        </button>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// FilterPopover – trigger button + popover panel
// ---------------------------------------------------------------------------

interface FilterPopoverProps {
  filterableColumns: ColumnConfiguration[];
  activeFilters: FilterItem[];
  onAdd: (item: FilterItem) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}

export function FilterPopover({
  filterableColumns,
  activeFilters,
  onAdd,
  onRemove,
  onClear,
}: FilterPopoverProps) {
  const translate = useTranslate();
  const [open, setOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<ColumnConfiguration | null>(
    filterableColumns[0] ?? null,
  );
  const [textValue, setTextValue] = useState('');
  const [sliderValue, setSliderValue] = useState<number>(
    filterableColumns[0]?.filterConfig?.min ?? 0,
  );
  const [selectedDatePreset, setSelectedDatePreset] = useState(0);
  const [selectedEnumValues, setSelectedEnumValues] = useState<string[]>([]);
  const [yesNoValue, setYesNoValue] = useState<'true' | 'false' | null>(null);

  const resetForm = (col: ColumnConfiguration | null) => {
    setSelectedField(col);
    setTextValue('');
    setSliderValue(col?.filterConfig?.min ?? 0);
    setSelectedDatePreset(0);
    setSelectedEnumValues([]);
    setYesNoValue(null);
  };

  const canAdd: boolean = (() => {
    if (!selectedField?.filterConfig) return false;
    const { type } = selectedField.filterConfig;
    if (type === 'text') return textValue.trim().length > 0;
    if (type === 'number') return true;
    if (type === 'date') return true;
    if (type === 'enum') return selectedEnumValues.length > 0;
    if (type === 'yesno') return yesNoValue !== null;
    return false;
  })();

  const buildFilterItem = (): FilterItem | null => {
    if (!selectedField?.filterConfig) return null;
    const cfg = selectedField.filterConfig;
    const field = cfg.field ?? selectedField.key;
    if (cfg.type === 'text') return { field, op: 'contains', value: textValue.trim() };
    if (cfg.type === 'number') return { field, op: 'lte', value: String(sliderValue) };
    if (cfg.type === 'date') {
      const preset = DATE_PRESETS[selectedDatePreset];
      return { field, op: 'gte', value: getPresetDate(preset.days) };
    }
    if (cfg.type === 'enum') return { field, op: 'in', value: selectedEnumValues };
    if (cfg.type === 'yesno' && yesNoValue !== null) return { field, op: 'eq', value: yesNoValue };
    return null;
  };

  const handleAdd = () => {
    const item = buildFilterItem();
    if (!item) return;
    onAdd(item);
    resetForm(filterableColumns[0] ?? null);
  };

  const getPreviewText = (): string => {
    if (!selectedField?.filterConfig) return '';
    const cfg = selectedField.filterConfig;
    const label = cfg.label ?? selectedField.header;
    if (cfg.type === 'text')
      return textValue ? translate('filters.previewText', { label, value: textValue }) : '';
    if (cfg.type === 'number')
      return translate('filters.previewNumber', {
        label,
        value: `${sliderValue}${cfg.unit ? ' ' + cfg.unit : ''}`,
      });
    if (cfg.type === 'date')
      return translate('filters.previewDate', {
        label,
        preset: translate(DATE_PRESETS[selectedDatePreset].labelKey).toLowerCase(),
      });
    if (cfg.type === 'enum')
      return selectedEnumValues.length
        ? translate('filters.previewEnum', { label, value: selectedEnumValues.join(', ') })
        : '';
    if (cfg.type === 'yesno') {
      if (yesNoValue === 'true') return translate('filters.previewYes', { label });
      if (yesNoValue === 'false') return translate('filters.previewNo', { label });
    }
    return '';
  };

  if (filterableColumns.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <ListFilter className={buttonIconSize} />
          {translate('Common.filters')}
          {activeFilters.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        {/* Active filters list */}
        {activeFilters.length > 0 && (
          <div className="border-b p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {translate('Common.activeFilters')}
            </p>
            <div className="flex flex-col gap-1">
              {activeFilters.map((f, i) => {
                const { field: fl, value: vl } = getFilterLabel(f, filterableColumns, translate);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                  >
                    <span className="font-medium">{fl}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {vl}
                    </span>
                    <button
                      className="ml-auto rounded p-0.5 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onRemove(i)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add filter form */}
        <div className="p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {translate('Common.addFilter')}
          </p>

          {/* Field picker */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {filterableColumns.map((col) => (
              <button
                key={col.key}
                onClick={() => resetForm(col)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  selectedField?.key === col.key
                    ? 'border-primary bg-primary/10 font-medium text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                )}
              >
                {col.filterConfig?.label ?? col.header}
              </button>
            ))}
          </div>

          {/* Value input */}
          {selectedField?.filterConfig && (
            <ValueInput
              col={selectedField}
              textValue={textValue}
              onTextChange={setTextValue}
              sliderValue={sliderValue}
              onSliderChange={setSliderValue}
              selectedDatePreset={selectedDatePreset}
              onDatePresetChange={setSelectedDatePreset}
              selectedEnumValues={selectedEnumValues}
              onEnumToggle={(v) =>
                setSelectedEnumValues((prev) =>
                  prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
                )
              }
              yesNoValue={yesNoValue}
              onYesNoChange={setYesNoValue}
            />
          )}

          {/* Live preview sentence */}
          {getPreviewText() && (
            <p className="mt-2 text-xs italic text-muted-foreground">{getPreviewText()}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-3 py-2">
          {activeFilters.length > 0 ? (
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={onClear}
            >
              {translate('Common.clearAll')}
            </button>
          ) : (
            <div />
          )}
          <Button size="sm" onClick={handleAdd} disabled={!canAdd}>
            {translate('Common.addFilterButton')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
