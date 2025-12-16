'use client';

import React, { useId } from 'react';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'id'
> {
  options: RadioOption[];
  name: string;
  error?: string;
  helperText?: string;
}

/**
 * Radioコンポーネント
 * ラジオボタングループ用のコンポーネント
 */
export function Radio({
  options,
  name,
  error,
  helperText,
  className = '',
  ...props
}: RadioProps): React.JSX.Element {
  const reactId = useId();
  const groupId = reactId;

  return (
    <div className="w-full">
      <div
        role="radiogroup"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error || helperText ? `${groupId}-helper` : undefined}
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          return (
            <div key={option.value} className="flex items-center mb-2">
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                disabled={option.disabled || props.disabled}
                className={`h-4 w-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 ${className}`}
                {...props}
              />
              <label htmlFor={optionId} className="ml-2 text-sm font-medium text-gray-700">
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      {(error || helperText) && (
        <p
          id={`${groupId}-helper`}
          className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}
          role={error ? 'alert' : undefined}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
