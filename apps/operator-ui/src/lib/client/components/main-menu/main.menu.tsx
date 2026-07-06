// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Logo } from '@lib/client/components/title';
import { cn } from '@lib/utils/cn';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  EvCharger,
  HelpCircle,
  Home,
  MapPin,
  Receipt,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { sidebarIconSize } from '@lib/client/styles/icon';
import { ThemeToggle } from '@lib/client/components/theme-toggle';
import { LocaleSwitcher } from '@lib/client/components/locale-switcher';
import { ConnectionModal } from '@lib/client/components/modals/shared/connection-modal/connection.modal';
import { LogoutButton } from '@lib/client/components/logout-button';
import { useTranslate } from '@refinedev/core';

export enum MenuSection {
  OVERVIEW = 'overview',
  LOCATIONS = 'locations',
  CHARGING_STATIONS = 'charging-stations',
  AUTHORIZATIONS = 'authorizations',
  TRANSACTIONS = 'transactions',
  TARIFFS = 'tariffs',
  PARTNERS = 'partners',
}

export interface MainMenuProps {
  activeSection: MenuSection;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

export const MainMenu = ({ activeSection }: MainMenuProps) => {
  const [collapsed, setCollapsed] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const translate = useTranslate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mainMenuItems: MenuItem[] = [
    {
      key: `/${MenuSection.OVERVIEW}`,
      label: translate('menu.overview'),
      icon: <Home className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.LOCATIONS}`,
      label: translate('Locations.Locations'),
      icon: <MapPin className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.CHARGING_STATIONS}`,
      label: translate('ChargingStations.ChargingStations'),
      icon: <EvCharger className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.AUTHORIZATIONS}`,
      label: translate('Authorizations.Authorizations'),
      icon: <Clipboard className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.TRANSACTIONS}`,
      label: translate('Transactions.Transactions'),
      icon: <ArrowLeftRight className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.TARIFFS}`,
      label: translate('Tariffs.Tariffs'),
      icon: <Receipt className={sidebarIconSize} />,
    },
    {
      key: `/${MenuSection.PARTNERS}`,
      label: translate('TenantPartners.TenantPartners'),
      icon: <Users className={sidebarIconSize} />,
    },
  ];

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-card transition-all duration-300 z-40 flex flex-col shadow-md',
          collapsed ? 'w-20' : 'w-[272px]',
        )}
        ref={menuRef}
      >
        {/* Logo Section */}
        <div className="min-h-[130px] flex items-center justify-center px-4">
          <Logo collapsed={collapsed} />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-1 px-3">
            {mainMenuItems.map((item) => {
              const isActive = `/${activeSection}` === item.key;
              return (
                <li key={item.key}>
                  <Link
                    href={item.key}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-md transition-colors text-sm',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground',
                      collapsed && 'justify-center px-2',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Menu - Help Link */}
        <div className="border-t border-border p-3 flex flex-col gap-2 items-center">
          <ThemeToggle expanded={!collapsed} />
          <LocaleSwitcher expanded={!collapsed} />
          <Button
            variant="ghost"
            onClick={() => setIsHelpOpen(true)}
            title={translate('menu.help')}
          >
            <HelpCircle className={sidebarIconSize} />
            {!collapsed && <span>{translate('menu.help')}</span>}
          </Button>
          <LogoutButton expanded={!collapsed} />
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="link"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-0 right-0 transform translate-x-1/2 translate-y-[110px] size-8 bg-card text-accent-foreground border-transparent rounded-full shadow-md"
          aria-label={
            collapsed ? translate('menu.expandSidebar') : translate('menu.collapseSidebar')
          }
        >
          {collapsed ? (
            <ChevronRight className={sidebarIconSize} />
          ) : (
            <ChevronLeft className={sidebarIconSize} />
          )}
        </Button>
      </aside>
      <ConnectionModal open={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};
