// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import {
  Controller,
  type ControllerFieldState,
  type ControllerProps,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@lib/client/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lib/client/components/ui/select';
import { Checkbox } from '@lib/client/components/ui/checkbox';
import { Combobox, type ComboboxProps } from '@lib/client/components/combobox';
import { MultiSelect, type MultiSelectProps } from '@lib/client/components/multi-select';
import { useTranslate } from '@refinedev/core';

type Props<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  control: ControllerProps<TFieldValues, TName>['control'];
  name: ControllerProps<TFieldValues, TName>['name'];
  label: string | React.ReactElement;
  description?: string;
  className?: string;
  required?: boolean;
};

type PropsWithChildren<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Props<TFieldValues, TName> & {
  children: React.ReactElement;
};

export const formLabelWrapperStyle = 'flex items-center gap-2';
export const formLabelStyle = 'text-base font-semibold';
export const formRequiredAsterisk = <span className="text-destructive">*</span>;
export const formCheckboxStyle = 'w-4!';
export const nestedFormRowFlex = 'flex items-center gap-6';

const FieldWrapper = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: PropsWithChildren<TFieldValues, TName> & {
    field: ControllerRenderProps<TFieldValues, TName>;
    fieldState: ControllerFieldState;
  },
) => {
  return (
    <Field data-invalid={props.fieldState.invalid}>
      <FieldLabel htmlFor={props.field.name} className={formLabelWrapperStyle}>
        <span className={formLabelStyle}>{props.label}</span>
        {props.required && formRequiredAsterisk}
      </FieldLabel>
      {props.children}
      {props.description && <FieldDescription>{props.description}</FieldDescription>}
      {props.fieldState.invalid && <FieldError errors={[props.fieldState.error]} />}
    </Field>
  );
};

/**
 * A generic FormField property that can be used within the custom <Form> wrapper.
 * Usable for simple input components such as <Input>, <Textarea>, and <Checkbox>.
 * For more complicated form components, they will have their own dedicated component below.
 *
 * @param props
 * @constructor
 */
export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: PropsWithChildren<TFieldValues, TName>,
) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      render={({ field, fieldState }) => (
        <FieldWrapper {...{ ...props, field, fieldState }}>
          {props.children && React.cloneElement(props.children, field)}
        </FieldWrapper>
      )}
    />
  );
};

export const SelectFormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Props<TFieldValues, TName> & {
    options: any[];
    placeholder?: string;
  },
) => {
  const translate = useTranslate();
  return (
    <Controller
      name={props.name}
      control={props.control}
      render={({ field, fieldState }) => (
        <FieldWrapper {...{ ...props, field, fieldState }}>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={props.placeholder ?? translate('Common.selectItem')} />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      )}
    />
  );
};

export const ComboboxFormField = <
  T,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Props<TFieldValues, TName> & ComboboxProps<T>,
) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      render={({ field, fieldState }) => (
        <FieldWrapper {...{ ...props, field, fieldState }}>
          <Combobox<T> onSelect={field.onChange} value={field.value} {...props} />
        </FieldWrapper>
      )}
    />
  );
};

type PartialMultiSelectProps<T> = Partial<MultiSelectProps<T>> & {
  options: T[];
  setSelectedValues?: (values: T[]) => void;
};

export const MultiSelectFormField = <
  T extends string,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Props<TFieldValues, TName> & PartialMultiSelectProps<T>,
) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      render={({ field, fieldState }) => (
        <FieldWrapper {...{ ...props, field, fieldState }}>
          <MultiSelect<T>
            selectedValues={field.value || []}
            setSelectedValues={field.onChange}
            {...props}
          />
        </FieldWrapper>
      )}
    />
  );
};

/**
 * A dedicated FormField for Radix UI Checkbox components.
 * Radix Checkbox uses `checked` + `onCheckedChange` instead of the standard
 * `value` + `onChange` that react-hook-form provides, so a generic cloneElement
 * spread does not work for booleans. This component wires them correctly.
 */
export const CheckboxFormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Props<TFieldValues, TName>,
) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      render={({ field, fieldState }) => (
        <FieldWrapper {...{ ...props, field, fieldState }}>
          <Checkbox
            id={field.name}
            checked={!!field.value}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            className={formCheckboxStyle}
          />
        </FieldWrapper>
      )}
    />
  );
};

FormField.displayName = 'FormField';
SelectFormField.displayName = 'SelectFormField';
ComboboxFormField.displayName = 'ComboboxFormField';
MultiSelectFormField.displayName = 'MultiSelectFormField';
CheckboxFormField.displayName = 'CheckboxFormField';
