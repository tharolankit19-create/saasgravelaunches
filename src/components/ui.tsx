import Link from "next/link";
import { cn } from "@/lib/utils";

// A small, purpose-built primitive set — the handful of shapes this product
// repeats. Not a design system; there's no second app to share it with.

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50";

const variants = {
  primary:
    "bg-violet-500 text-white shadow-glow hover:bg-violet-600 hover:shadow-lift",
  dark: "bg-ink-900 text-white hover:bg-ink-700 shadow-card",
  outline:
    "border border-ink-900/12 bg-paper-100 text-ink-900 hover:border-ink-900/25 hover:bg-paper-200 hover:shadow-card",
  ghost: "text-ink-500 hover:text-ink-900 hover:bg-paper-200",
  signal: "bg-signal-500 text-white hover:bg-signal-600 shadow-card",
};

const sizes = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  external,
  ...rest
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (external) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "violet" | "signal" | "medal";
}) {
  const tones = {
    neutral: "border-ink-900/10 bg-paper-200 text-ink-500",
    violet: "border-violet-500/20 bg-violet-500/8 text-violet-600",
    signal: "border-signal-500/25 bg-signal-500/10 text-signal-600",
    medal: "border-medal-500/30 bg-medal-500/10 text-medal-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: any;
}) {
  return (
    <As className={cn("rounded-2xl border border-ink-900/8 bg-paper-100 shadow-card", className)}>
      {children}
    </As>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-violet-600",
        className
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h2 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">{title}</h2>
        {sub && <p className="mt-1.5 max-w-xl text-sm text-ink-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="font-mono text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-400">{label}</div>
    </div>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-medium text-ink-700">
        {label}
        {required && <span className="text-violet-500">*</span>}
        {hint && <span className="text-[11px] font-normal text-ink-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-ink-900/10 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400/70 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15";

export function Empty({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-900/12 bg-paper-100/60 px-6 py-14 text-center">
      <p className="text-sm font-medium text-ink-900">{title}</p>
      {sub && <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">{sub}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
