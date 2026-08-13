"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, Rocket, User as UserIcon, Shield } from "lucide-react";
import { Avatar } from "@/components/avatar";

export function UserMenu({
  userId,
  name,
  avatarUrl,
  isAdmin,
}: {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink-700 transition hover:bg-paper-200 hover:text-ink-900";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxblood-500/40"
      >
        <Avatar src={avatarUrl} name={name} size={34} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-ink-900/10 bg-paper-100 py-1 shadow-lift"
        >
          <div className="border-b border-ink-900/8 px-3 py-2">
            <p className="truncate text-[13px] font-medium text-ink-900">{name || "Maker"}</p>
          </div>
          <Link href="/dashboard" className={item} onClick={() => setOpen(false)}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/launch" className={item} onClick={() => setOpen(false)}>
            <Rocket className="h-4 w-4" /> New launch
          </Link>
          <Link href={`/makers/${userId}`} className={item} onClick={() => setOpen(false)}>
            <UserIcon className="h-4 w-4" /> My maker page
          </Link>
          {isAdmin && (
            <Link href="/admin" className={item} onClick={() => setOpen(false)}>
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
          <form action="/logout" method="post" className="border-t border-ink-900/8">
            <button type="submit" className={`${item} w-full text-left`}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
