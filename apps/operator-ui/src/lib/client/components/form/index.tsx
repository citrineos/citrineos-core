// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { FormButton, type FormButtonProps } from '@lib/client/components/buttons/form-button';
import { Button } from '@lib/client/components/ui/button';
import {
  useBack,
  useParsed,
  useTranslation,
  type BaseRecord,
  type HttpError,
  useTranslate,
} from '@refinedev/core';
import type { UseFormReturnType } from '@refinedev/react-hook-form';
import {
  useId,
  type DetailedHTMLProps,
  type FormHTMLAttributes,
  type PropsWithChildren,
} from 'react';
import { type FieldValues, FormProvider, type UseFormReturn } from 'react-hook-form';
import { LoadingIcon } from '@lib/client/components/ui/loading';

type NativeFormProps = Omit<
  DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>,
  'onSubmit'
>;

export type FormProps<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TVariables extends FieldValues = FieldValues,
  TContext extends object = {},
  TData extends BaseRecord = TQueryFnData,
  TResponse extends BaseRecord = TData,
  TResponseError extends HttpError = TError,
> = PropsWithChildren &
  UseFormReturnType<TQueryFnData, TError, TVariables, TContext, TData, TResponse, TResponseError> &
  FormButtonProps & {
    formProps?: NativeFormProps;
    loading?: boolean;
    submitHandler?: (data: any) => void;
    cancelHandler?: () => void;
    hideCancel?: boolean;
    showFormErrors?: boolean; // for debugging form issues
  };

export const Form = <
  TQueryFnData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
  TFieldValues extends FieldValues = FieldValues,
  TContext extends object = {},
  TData extends BaseRecord = TQueryFnData,
  TResponse extends BaseRecord = TData,
  TResponseError extends HttpError = TError,
>({
  formProps,
  loading,
  submitHandler,
  cancelHandler,
  showFormErrors,
  ...props
}: FormProps<TQueryFnData, TError, TFieldValues, TContext, TData, TResponse, TResponseError>) => {
  const formId = useId();
  const translate = useTranslate();
  const { action } = useParsed();
  const back = useBack();

  const onBack = action !== 'list' || typeof action !== 'undefined' ? back : undefined;

  const onSubmit = (data: TFieldValues) => {
    if (submitHandler) {
      submitHandler(data);
    } else {
      props.refineCore.onFinish(data).then();
    }
  };

  return (
    <FormProvider {...(props as unknown as UseFormReturn<TFieldValues, TContext, TFieldValues>)}>
      <form {...formProps} onSubmit={props.handleSubmit(onSubmit)} id={formId}>
        <div className="flex flex-col gap-6 w-full">
          {props.children}
          {showFormErrors && Object.keys(props.formState.errors).length > 0 && (
            <div className="text-destructive">{JSON.stringify(props.formState.errors)}</div>
          )}
          <div className="flex items-center justify-end gap-4">
            {loading && <LoadingIcon className="size-6" />}
            {!props.hideCancel && (
              <Button
                type="button"
                onClick={() => {
                  if (cancelHandler) {
                    cancelHandler();
                  } else if (onBack) {
                    onBack();
                  }
                }}
                disabled={props.refineCore.formLoading || loading}
                variant="outline"
              >
                {translate('buttons.cancel')}
              </Button>
            )}

            <FormButton
              submitButtonVariant={props.submitButtonVariant}
              submitButtonLabel={props.submitButtonLabel}
              type="submit"
              loading={props.refineCore.formLoading || loading}
              disabled={props.refineCore.formLoading || loading}
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
