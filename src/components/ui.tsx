import Link from "next/link";
import { cn } from "@/lib/utils";

// The register's furniture. Small, sharp corners, hairline rules, one ink.
// Nothing here floats or glows — this is meant to read as printed matter.

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 active:translate-y-px disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50";

const variants = {
  primary: "bg-ember-500 text-paper-100 hover:bg-ember-600 shadow-page",
  ink: "bg-ink-900 text-paper-100 hover:bg-ink-700 shadow-page",
  outline:
    "border border-ink-900/18 bg-paper-100 text-ink-900 hover:border-ink-900/40 hover:bg-paper-200",
  quiet: "text-ink-500 hover:text-ink-900 hover:bg-paper-200",
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

const tones = {
  neutral: "border-ink-900/14 bg-paper-200 text-ink-500",
  ink: "border-ink-900/20 bg-ink-900 text-paper-100",
  orange: "border-ember-500/25 bg-ember-500/8 text-ember-600",
  brass: "border-brass-500/35 bg-brass-500/10 text-brass-600",
  moss: "border-moss-500/30 bg-moss-500/10 text-moss-600",
};

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** A sheet of stock. Square-ish corners, a hairline, almost no shadow. */
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
    <As className={cn("rounded-2xl border border-ink-900/10 bg-paper-100 shadow-card", className)}>
      {children}
    </As>
  );
}

/** The section label with a rule running off to the right. */
export function Rubric({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("rubric", className)}>{children}</p>;
}

export function SectionHeading({
  rubric,
  title,
  sub,
  action,
  className,
}: {
  rubric?: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      {rubric && <Rubric className="mb-3">{rubric}</Rubric>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-section font-semibold text-ink-900">{title}</h2>
          {sub && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">{sub}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

/** A figure and its caption — the register's unit of data. */
export function Stat({
  value,
  label,
  hint,
}: {
  value: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="figure text-2xl font-semibold text-ink-900">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
        {label}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-ink-400">{hint}</div>}
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
      <span className="mb-1.5 flex items-baseline gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
        {label}
        {required && <span className="text-ember-500">*</span>}
        {hint && <span className="tracking-normal text-ink-400 normal-case">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-ink-900/20 bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400/80 focus:border-ember-500/60 focus:ring-2 focus:ring-ember-500/12";

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
    <div className="rounded-xl border border-dashed border-ink-900/25 bg-paper-100/50 px-6 py-16 text-center">
      <p className="font-serif text-lg font-semibold text-ink-900">{title}</p>
      {sub && <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{sub}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/** A horizontal rule with a bit of weight — used between register sections. */
export function Rule({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-ink-900/12", className)} />;
}
