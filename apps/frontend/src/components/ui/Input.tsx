'use client';

import React, { useId } from 'react';

export type InputType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'date'
  | 'month'
  | 'time';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: InputType;
  error?: string;
  helperText?: string;
}

/**
 * Inputコンポーネント
 * 汎用的な入力フィールドコンポーネント
 */
export function Input({
  type = 'text',
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps): React.JSX.Element {
  const reactId = useId();
  const inputId = id || reactId;
  const baseStyles =
    'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors';
  const errorStyles = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  const disabledStyles = props.disabled
    ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
    : 'bg-white';

  return (
    <div className="w-full">
      <input
        type={type}
        id={inputId}
        className={`${baseStyles} ${errorStyles} ${disabledStyles} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error || helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {(error || helperText) && (
        <p
          id={`${inputId}-helper`}
          className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
