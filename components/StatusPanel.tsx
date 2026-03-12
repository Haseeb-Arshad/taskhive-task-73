"use client";

import * as React from "react";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "error";

type ActionVariant = "primary" | "secondary";

export interface StatusAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: ActionVariant;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface StatusPanelProps {
  tone?: StatusTone;
  title: string;
  message?: string;
  details?: string;
  actions?: StatusAction[];
  className?: string;
  compact?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const toneStyles: Record<StatusTone, { wrapper: string; icon: string; ring: string }> = {
  neutral: {
    wrapper: "border-slate-700/60 bg-slate-900/50 text-slate-200",
    icon: "text-slate-300",
    ring: "ring-slate-400/20",
  },
  info: {
    wrapper: "border-sky-600/40 bg-sky-950/40 text-sky-100",
    icon: "text-sky-300",
    ring: "ring-sky-400/20",
  },
  success: {
    wrapper: "border-emerald-600/40 bg-emerald-950/40 text-emerald-100",
    icon: "text-emerald-300",
    ring: "ring-emerald-400/20",
  },
  warning: {
    wrapper: "border-amber-600/40 bg-amber-950/40 text-amber-100",
    icon: "text-amber-300",
    ring: "ring-amber-400/20",
  },
  error: {
    wrapper: "border-rose-600/40 bg-rose-950/40 text-rose-100",
    icon: "text-rose-300",
    ring: "ring-rose-400/20",
  },
};

function mergeClasses(...values: Array<string | undefined | false | null>): string {
  return values.filter(Boolean).join(" ");
}

function DefaultIcon({ tone }: { tone: StatusTone }): JSX.Element {
  const common = "h-5 w-5";

  if (tone === "success") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M20 7L10 17l-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tone === "warning") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M12 3l9 16H3l9-16z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (tone === "error") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (tone === "info") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="8" r="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ActionButton({ action }: { action: StatusAction }): JSX.Element {
  const variant = action.variant ?? "primary";
  const className =
    variant === "primary"
      ? "bg-white/90 text-slate-900 hover:bg-white focus-visible:ring-white"
      : "border border-white/30 bg-transparent text-white/90 hover:bg-white/10 focus-visible:ring-white/60";

  if (action.href) {
    return (
      <a
        href={action.href}
        aria-label={action.ariaLabel ?? action.label}
        className={mergeClasses(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          className,
          action.disabled && "pointer-events-none opacity-50"
        )}
      >
        {action.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={action.ariaLabel ?? action.label}
      onClick={action.onClick}
      disabled={Boolean(action.disabled)}
      className={mergeClasses(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        className,
        action.disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {action.label}
    </button>
  );
}

export function StatusPanel({
  tone = "neutral",
  title,
  message,
  details,
  actions,
  className,
  compact = false,
  icon,
  children,
}: StatusPanelProps): JSX.Element {
  const style = toneStyles[tone];

  return (
    <section
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={mergeClasses(
        "relative overflow-hidden rounded-2xl border shadow-lg shadow-black/20",
        "backdrop-blur-sm ring-1",
        style.wrapper,
        style.ring,
        compact ? "p-4" : "p-6 sm:p-7",
        className
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]" />

      <div className={mergeClasses("flex items-start gap-4", compact && "gap-3")}>
        <div
          className={mergeClasses(
            "inline-flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5",
            compact ? "h-9 w-9" : "h-11 w-11",
            style.icon
          )}
          aria-hidden="true"
        >
          {icon ?? <DefaultIcon tone={tone} />}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className={mergeClasses("font-semibold tracking-tight", compact ? "text-base" : "text-lg")}>{title}</h3>
          {message ? <p className="mt-1 text-sm text-white/85">{message}</p> : null}
          {details ? <p className="mt-2 text-xs text-white/65">{details}</p> : null}

          {children ? <div className="mt-4">{children}</div> : null}

          {actions && actions.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {actions.map((action) => (
                <ActionButton key={`${action.label}-${action.href ?? "button"}`} action={action} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default StatusPanel;
