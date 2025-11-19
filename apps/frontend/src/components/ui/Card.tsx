import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Cardコンポーネント
 * 汎用的なカードコンテナ
 */
export function Card({ children, className = '' }: CardProps): React.JSX.Element {
  return <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>{children}</div>;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps): React.JSX.Element {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps): React.JSX.Element {
  return <h2 className={`text-2xl font-bold text-gray-800 ${className}`}>{children}</h2>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps): React.JSX.Element {
  return <div className={className}>{children}</div>;
}
