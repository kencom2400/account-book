import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Cardコンポーネント
 * 汎用的なカードコンテナ
 */
export function Card({ children, className = '' }: CardProps): React.JSX.Element {
  return <div className={cn('bg-white rounded-lg shadow-md p-6', className)}>{children}</div>;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps): React.JSX.Element {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps): React.JSX.Element {
  return <h2 className={cn('text-2xl font-bold text-gray-800', className)}>{children}</h2>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps): React.JSX.Element {
  return <div className={className}>{children}</div>;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({
  children,
  className = '',
}: CardDescriptionProps): React.JSX.Element {
  return <p className={cn('text-sm text-gray-600', className)}>{children}</p>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps): React.JSX.Element {
  return <div className={cn('mt-4 pt-4 border-t border-gray-200', className)}>{children}</div>;
}
