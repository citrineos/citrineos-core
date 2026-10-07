// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Button } from '@lib/client/components/ui/button';
import { Input } from '@lib/client/components/ui/input';
import { buttonIconSize } from '@lib/client/styles/icon';
import debounce from 'lodash.debounce';
import { Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo } from 'react';

const defaultDebounceInMillis = 300;
const maxInputLength = 100;

export interface DebounceSearchProps {
  onSearch: any;
  placeholder: string;
  debounceInMillis?: number;
  className?: string;
}

export const DebounceSearch = ({
  onSearch,
  placeholder,
  debounceInMillis,
  className,
}: DebounceSearchProps) => {
  const [value, setValue] = React.useState('');

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setValue(newValue);
      onSearch(newValue);
    },
    [onSearch],
  );

  const onChangeDebounce = useMemo(
    () => debounce(onChange, debounceInMillis ?? defaultDebounceInMillis),
    [debounceInMillis, onChange],
  );

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  const handleSearch = () => {
    onSearch(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // to cancel debounce when component unmounts
  useEffect(() => {
    return () => {
      onChangeDebounce.cancel();
    };
  }, [onChangeDebounce]);

  return (
    <div className={className ?? 'relative w-full sm:w-[300px]'}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChangeDebounce(e);
        }}
        onKeyDown={handleKeyDown}
        maxLength={maxInputLength}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-0.5">
        {value && (
          <Button type="button" variant="ghost" size="xs" onClick={handleClear}>
            <X className={`${buttonIconSize} text-destructive`} />
          </Button>
        )}
        <Button type="button" variant="ghost" size="xs" onClick={handleSearch}>
          <Search className={buttonIconSize} />
        </Button>
      </div>
    </div>
  );
};
