// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

export const PercentageCircle = ({ percentage, color }: { percentage: number; color: string }) => {
  const safePercentage = Number.isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage));
  const radius = 100;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePercentage / 100) * circumference;
  return (
    <div className="relative">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 256 256">
        <circle
          cx="128"
          cy="128"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />

        <circle
          cx="128"
          cy="128"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={`${color} transition-all duration-500 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl">{percentage}%</span>
      </div>
    </div>
  );
};
