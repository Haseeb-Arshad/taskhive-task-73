'use client';

import React from 'react';

type StatusVariant = 'empty' | 'error' | 'success' | 'loading';

type StatusPanelProps = {
  variant: StatusVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  compact?: boolean;
};

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

const variantStyles: Record<
  StatusVariant,
  {
    container: string;
    badge: string;
    role: 'status' | 'alert';
    ariaLive: 'polite' | 'assertive';
    defaultTitle: string;
    defaultDescription: string;
  }
> = {
  empty: {
    container:
      'border-slate-200/80 bg-gradient-to-br from-slate-50 to-white text-slate-700 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:text-slate-200',
    badge:
      'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
    role: 'status',
    ariaLive: 'polite',
    defaultTitle: 'No matches yet',
    defaultDescription: 'Start a game to build your history, improve your streak, and unlock achievements.'
  },
  error: {
    container:
      'border-rose-200/90 bg-gradient-to-br from-rose-50 to-white text-rose-800 dark:border-rose-900/70 dark:from-rose-950/50 dark:to-slate-950 dark:text-rose-200',
    badge:
      'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:ring-rose-800',
    role: 'alert',
    ariaLive: 'assertive',
    defaultTitle: 'Something went wrong',
    defaultDescription: 'We could not load this section. Please retry to continue your checkers session.'
  },
  success: {
    container:
      'border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white text-emerald-800 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:to-slate-950 dark:text-emerald-200',
    badge:
      'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800',
    role: 'status',
    ariaLive: 'polite',
    defaultTitle: 'Great game!',
    defaultDescription: 'Your move history and progress were saved successfully.'
  },
  loading: {
    container:
      'border-blue-200/90 bg-gradient-to-br from-blue-50 to-white text-blue-800 dark:border-blue-900/60 dark:from-blue-950/40 dark:to-slate-950 dark:text-blue-200',
    badge:
      'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-800',
    role: 'status',
    ariaLive: 'polite',
    defaultTitle: 'Preparing your match…',
    defaultDescription: 'Setting up the board, loading stats, and warming up the AI opponent.'
  }
};

function VariantIcon({ variant }: { variant: StatusVariant }) {
  if (variant === 'loading') {
    return (
      <svg
        className="h-6 w-6 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          className="stroke-current"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === 'error') {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2.75 2.75 21.25h18.5L12 2.75Z"
          className="stroke-current"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M12 8.25v6" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="17.25" r="1.1" className="fill-current" />
      </svg>
    );
  }

  if (variant === 'success') {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" className="stroke-current" strokeWidth="1.8" />
        <path
          d="m8.5 12.25 2.45 2.45 4.55-5.15"
          className="stroke-current"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" className="stroke-current" strokeWidth="1.8" />
      <path d="M8 12h8" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 8h5" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 16h6" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function StatusPanel({
  variant,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  compact = false
}: StatusPanelProps) {
  const variantConfig = variantStyles[variant];

  return (
    <section
      role={variantConfig.role}
      aria-live={variantConfig.ariaLive}
      className={cn(
        'rounded-2xl border p-4 shadow-sm transition-all duration-300 sm:p-5',
        variantConfig.container,
        className
      )}
    >
      <div className={cn('flex items-start gap-3', compact ? 'gap-2.5' : 'gap-3')}>
        <div
          className={cn(
            'mt-0.5 inline-flex shrink-0 items-center justify-center rounded-xl p-2',
            variantConfig.badge
          )}
        >
          <VariantIcon variant={variant} />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'font-semibold tracking-tight',
              compact ? 'text-base leading-tight' : 'text-lg leading-tight'
            )}
          >
            {title ?? variantConfig.defaultTitle}
          </h3>
          <p className={cn('mt-1 text-sm opacity-90', compact ? 'leading-snug' : 'leading-relaxed')}>
            {description ?? variantConfig.defaultDescription}
          </p>

          {(actionLabel || secondaryActionLabel) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {actionLabel && (
                <button
                  type="button"
                  onClick={onAction}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:scale-[1.01] hover:bg-slate-800 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  {actionLabel}
                </button>
              )}

              {secondaryActionLabel && (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="inline-flex items-center justify-center rounded-lg border border-current/30 bg-transparent px-3.5 py-2 text-sm font-medium transition hover:bg-current/10 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
                >
                  {secondaryActionLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
