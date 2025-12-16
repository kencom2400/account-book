'use client';

import React, { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> {
  options: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
}

/**
 * Selectコンポーネント
 * ドロップダウン選択用のコンポーネント
 */
export function Select({
  options,
  error,
  helperText,
  placeholder,
  className = '',
  id,
  ...props
}: SelectProps): React.JSX.Element {
  const reactId = useId();
  const selectId = id || reactId;
  const baseStyles =
    'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors appearance-none bg-white';
  const errorStyles = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  const disabledStyles = props.disabled ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : '';

  return (
    <div className="w-full relative">
      <select
        id={selectId}
        className={`${baseStyles} ${errorStyles} ${disabledStyles} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error || helperText ? `${selectId}-helper` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {/* カスタム矢印アイコン */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {(error || helperText) && (
        <p
          id={`${selectId}-helper`}
          className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
