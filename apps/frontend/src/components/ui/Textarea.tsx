'use client';

import React, { useId } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
}

/**
 * Textareaコンポーネント
 * 複数行テキスト入力用のコンポーネント
 */
export function Textarea({
  error,
  helperText,
  className = '',
  id,
  ...props
}: TextareaProps): React.JSX.Element {
  const reactId = useId();
  const textareaId = id || reactId;
  const baseStyles =
    'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors resize-y';
  const errorStyles = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  const disabledStyles = props.disabled
    ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
    : 'bg-white';

  return (
    <div className="w-full">
      <textarea
        id={textareaId}
        className={`${baseStyles} ${errorStyles} ${disabledStyles} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error || helperText ? `${textareaId}-helper` : undefined}
        {...props}
      />
      {(error || helperText) && (
        <p
          id={`${textareaId}-helper`}
          className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
