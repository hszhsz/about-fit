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
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
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
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
          active
            ? "bg-gradient-to-r from-coral-500 to-coral-400 text-white shadow-md"
            : "text-stone-700 hover:bg-stone-200/50 hover:text-stone-900"
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            active
              ? "bg-white/20"
              : "bg-stone-200/60 group-hover:bg-stone-300/60"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              active ? "text-white" : "text-stone-600"
            )}
          />
        </span>
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <div
      className="flex h-full flex-col px-4 py-6"
      style={{
        background: "linear-gradient(180deg, #FDFCFA 0%, #FFF5F6 100%)",
      }}
    >
      {/* Brand + workspace */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-coral-500 to-coral-600 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-indigo-950">AboutFit</span>
          <span className="text-xs text-stone-500">
            {decodeURIComponent(workspace)}
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {navItems.map(renderItem)}
      </nav>

      {/* Bottom section */}
      <div className="space-y-1 border-t border-stone-200/80 pt-4">
        {bottomItems.map(renderItem)}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-200/60">
            <User className="h-4 w-4" />
          </span>
          <span className="font-medium">账户</span>
        </div>
      </div>

      {/* Decorative blob */}
      <div className="pointer-events-none fixed bottom-0 right-0 h-48 w-48 rounded-full bg-gradient-to-br from-coral-200/30 to-violet-200/20 blur-3xl" />
    </div>
  );
}