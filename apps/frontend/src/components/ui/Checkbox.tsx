'use client';

import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

/**
 * Checkboxコンポーネント
 * チェックボックス用のコンポーネント
 */
export function Checkbox({
  label,
  error,
  className = '',
  id,
  ...props
}: CheckboxProps): React.JSX.Element {
  const reactId = useId();
  const checkboxId = id || reactId;

  return (
    <div className="w-full">
      <div className="flex items-center">
        <input
          type="checkbox"
          id={checkboxId}
          className={cn(
            'h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="ml-2 text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
