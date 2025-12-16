import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

/**
 * Labelコンポーネント
 * フォームラベル用のコンポーネント
 */
export function Label({
  required = false,
  className = '',
  children,
  ...props
}: LabelProps): React.JSX.Element {
  return (
    <label className={`block text-sm font-medium text-gray-700 mb-2 ${className}`} {...props}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}
