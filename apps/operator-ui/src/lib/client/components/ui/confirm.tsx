import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@lib/client/components/ui/alert-dialog';
import type { buttonVariants } from '@lib/client/components/ui/button';
import { LoadingIcon } from '@lib/client/components/ui/loading';
import { type AlertDialogProps } from '@radix-ui/react-alert-dialog';
import { useTranslation } from '@refinedev/core';
import { type VariantProps } from 'class-variance-authority';
import { CheckIcon, XIcon } from 'lucide-react';
import type { FC, ReactElement } from 'react';
import { isValidElement, useMemo } from 'react';

export type ConfirmDialogProps = AlertDialogProps & {
  title?: string;
  description?: string;
  okIcon?: ReactElement<SVGSVGElement>;
  okIconSide?: 'left' | 'right';
  cancelIconSide?: 'left' | 'right';
  cancelIcon?: ReactElement<SVGSVGElement>;
  okText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  children?: ReactElement<SVGSVGElement>;
  okButtonVariant?: VariantProps<typeof buttonVariants>['variant'];
  cancelButtonVariant?: VariantProps<typeof buttonVariants>['variant'];
  okButtonSize?: VariantProps<typeof buttonVariants>['size'];
  cancelButtonSize?: VariantProps<typeof buttonVariants>['size'];
};

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  children,
  title,
  description,
  okText,
  cancelText,
  loading = false,
  okIconSide = 'left',
  cancelIconSide = 'left',
  onConfirm,
  okIcon,
  cancelIcon,
  open,
  onOpenChange,
  defaultOpen,
}) => {
  const { translate } = useTranslation();
  const CancelIcon = useMemo(() => {
    if (isValidElement(cancelIcon)) {
      return cancelIcon;
    }

    return <XIcon className="mr-2 h-4 w-4" />;
  }, [cancelIcon]);

  const OkIcon = useMemo(() => {
    if (loading) {
      return <LoadingIcon className="mr-2" />;
    }
    if (isValidElement(okIcon)) {
      return okIcon;
    }

    return <CheckIcon className="mr-2 h-4 w-4" />;
  }, [okIcon, loading]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? translate('confirmDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? translate('confirmDialog.description', 'This action cannot be undone.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelIconSide === 'left' && CancelIcon}
            {cancelText ?? translate('buttons.cancel')}
            {cancelIconSide === 'right' && CancelIcon}
          </AlertDialogCancel>
          <AlertDialogAction disabled={loading} onClick={onConfirm}>
            {okIconSide === 'left' && OkIcon}
            {okText ?? translate('buttons.ok')}
            {okIconSide === 'right' && OkIcon}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

ConfirmDialog.displayName = 'ConfirmDialog';
