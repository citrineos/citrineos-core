// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import config from '@lib/utils/config';
import { motion } from 'motion/react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import React from 'react';

export interface LogoProps {
  collapsed?: boolean;
}

const LOGO_URL = config.logoUrl;

export const Logo: React.FC<LogoProps> = (props: LogoProps) => {
  const { collapsed = false } = props;
  const { theme } = useTheme();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <motion.img
        src={LOGO_URL}
        alt="Collapsed Logo"
        initial={{ scale: 0.2, opacity: 0, x: -10, left: 0 }}
        animate={{
          scale: collapsed ? 0.5 : 0.2,
          opacity: collapsed ? 1 : 0,
          x: collapsed ? '-50%' : -10,
          left: collapsed ? '50%' : 0,
        }}
        style={{
          position: 'absolute',
          height: '100%',
        }}
      />
      {!collapsed && (
        <div
          style={{
            position: 'relative',
            width: '80%',
            height: '60%',
            margin: '0 auto',
          }}
        >
          <Image
            src={theme === 'light' ? '/logo-black.svg' : '/logo-white.svg'}
            alt={`${config.appName} Logo`}
            fill
            style={{
              objectFit: 'contain',
            }}
          />
        </div>
      )}
    </div>
  );
};
