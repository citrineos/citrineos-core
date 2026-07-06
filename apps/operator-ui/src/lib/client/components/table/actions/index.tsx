// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Button } from '@lib/client/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@lib/client/components/ui/dropdown-menu';
import { useTranslate } from '@refinedev/core';
import { Ellipsis } from 'lucide-react';
import Link from 'next/link';
import type { FC, PropsWithChildren, ReactNode } from 'react';

interface RowActionsProps {
  children?: ReactNode;
}

export type RowActionProps = PropsWithChildren & {
  to?: string;
  title?: string;
  asChild?: boolean;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  onClick?: (event: any) => void;
};

export const RowAction: FC<RowActionProps> = (props) => {
  return (
    <DropdownMenuItem
      disabled={props.disabled}
      asChild={!(!props.to || (!props.to && !props.children))}
      onClick={props.onClick}
    >
      {props.asChild ? (
        props.children
      ) : props.to ? (
        <Link href={props.to} title={props.title}>
          {props.icon ? <span className="mr-2">{props.icon}</span> : null}
          {props.title}
        </Link>
      ) : (
        <>
          {props.icon ? <span className="mr-2">{props.icon}</span> : null}
          {props.title}
        </>
      )}
    </DropdownMenuItem>
  );
};

RowAction.displayName = 'RowAction';

export function RowActions({ children }: RowActionsProps) {
  const translate = useTranslate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Ellipsis className="h-4 w-4" />
          <span className="sr-only">{translate('Common.openMenu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
