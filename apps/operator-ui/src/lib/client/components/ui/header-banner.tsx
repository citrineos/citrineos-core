// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useEffect, useRef } from 'react';
import config from '@lib/utils/config';

const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

function renderMessage(text: string): React.ReactNode {
  return text.split('\n').map((line, lineIdx, lines) => {
    const parts = line.split(EMAIL_RE);
    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, i) =>
          EMAIL_RE.test(part) ? (
            <a
              key={i}
              href={`mailto:${part}`}
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              {part}
            </a>
          ) : (
            part
          ),
        )}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

const BANNER_HEIGHT_VAR = '--banner-h';

const useBannerHeightVar = (ref: React.RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty(BANNER_HEIGHT_VAR, `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty(BANNER_HEIGHT_VAR);
    };
  }, [ref]);
};

export const HeaderBanner: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  useBannerHeightVar(ref);

  return (
    <>
      {config.bannerMessage && (
        <div
          ref={ref}
          className="relative isolate flex items-center gap-x-6 overflow-hidden bg-gray-50 px-6 py-2.5 sm:px-3.5 sm:before:flex-1 dark:bg-gray-800/50 dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:bottom-0 dark:after:h-px dark:after:bg-white/10"
        >
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-[max(-7rem,calc(50%-52rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl"
          >
            <div className="aspect-577/310 w-144.25 bg-linear-to-r from-[#ffae0b] to-[#9089fc] opacity-30 dark:opacity-40"></div>
          </div>
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-[max(45rem,calc(50%+8rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl"
          >
            <div className="aspect-577/310 w-144.25 bg-linear-to-r from-[#ffae0b] to-[#9089fc] opacity-30 dark:opacity-40"></div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm/6 text-gray-900 dark:text-gray-100">
              <strong className="font-semibold">{renderMessage(config.bannerMessage)}</strong>
            </p>
          </div>
          <div className="flex flex-1 justify-end" />
        </div>
      )}
    </>
  );
};
