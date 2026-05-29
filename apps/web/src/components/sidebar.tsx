"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Ruler,
  Settings,
  Shirt,
  ShoppingBag,
  Type,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string; // suffix appended to /{workspace}
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "首页", href: "", icon: Home },
  { label: "服装工作室", href: "/garments", icon: Shirt },
  { label: "模特", href: "/models", icon: Users },
  { label: "文案", href: "/copy", icon: Type },
  { label: "尺码表", href: "/sizes", icon: Ruler },
  { label: "Lookbooks", href: "/lookbooks", icon: ImageIcon },
  { label: "合集", href: "/collections", icon: LayoutGrid },
  { label: "模板", href: "/templates", icon: ShoppingBag },
];

const bottomItems: NavItem[] = [
  { label: "设置", href: "/settings", icon: Settings },
];

export function Sidebar({ workspace }: { workspace: string }) {
  const basePath = `/${workspace}`;
  const pathname = usePathname() || "";

  const isActive = (suffix: string) => {
    const full = `${basePath}${suffix}`;
    if (suffix === "") {
      return pathname === basePath || pathname === `${basePath}/`;
    }
    return pathname === full || pathname.startsWith(`${full}/`);
  };

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href || "home"}
        href={`${basePath}${item.href}`}
        className={cn(
          "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
          active
            ? "bg-[var(--af-indigo-600)]/10 text-[var(--af-indigo-950)]"
            : "text-[var(--af-stone-700)] hover:bg-[var(--af-stone-200)]/50 hover:text-[var(--af-indigo-950)]"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active
              ? "text-[var(--af-indigo-600)]"
              : "text-[var(--af-stone-700)]/70"
          )}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col px-3 py-4">
      {/* Mark + workspace name */}
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--af-indigo-600)] text-[9px] font-bold text-white">
          AF
        </span>
        <span className="truncate text-sm font-semibold text-[var(--af-indigo-950)]">
          {decodeURIComponent(workspace)}
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1">{navItems.map(renderItem)}</nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-[var(--af-stone-200)] pt-3">
        {bottomItems.map(renderItem)}
        <div className="mt-2 flex items-center gap-3 rounded-md px-2 py-2 text-sm text-[var(--af-stone-700)]">
          <User className="h-4 w-4 text-[var(--af-stone-700)]/70" />
          <span className="truncate">账户</span>
        </div>
      </div>
    </div>
  );
}
