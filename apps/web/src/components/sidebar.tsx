"use client";

import Link from "next/link";

const navItems = [
  { label: "首页", href: "", icon: "[Home]" },
  { label: "服装工作室", href: "/garments", icon: "[Shirt]" },
  { label: "模特", href: "/models", icon: "[User]" },
  { label: "文案", href: "/copy", icon: "[FileText]" },
  { label: "尺码表", href: "/sizes", icon: "[Ruler]" },
  { label: "Lookbooks", href: "/lookbooks", icon: "[Book]" },
  { label: "合集", href: "/collections", icon: "[Layers]" },
  { label: "模板", href: "/templates", icon: "[Layout]" },
];

const bottomItems = [
  { label: "设置", href: "/settings", icon: "[Settings]" },
];

export function Sidebar({ workspaceName }: { workspaceName: string }) {
  const basePath = `/${workspaceName}`;

  return (
    <div className="flex h-full flex-col px-3 py-4">
      {/* Mark + workspace name */}
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-4 w-4 items-center justify-center rounded bg-[var(--af-indigo-600)] text-[8px] font-bold text-white">
          AF
        </span>
        <span className="text-sm font-semibold text-[var(--af-indigo-950)] truncate">
          {decodeURIComponent(workspaceName)}
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={`${basePath}${item.href}`}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-[var(--af-stone-700)] hover:bg-[var(--af-stone-200)]/50 hover:text-[var(--af-indigo-950)] transition-colors"
          >
            <span className="w-5 text-center text-xs opacity-60">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-[var(--af-stone-200)] pt-3 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={`${basePath}${item.href}`}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-[var(--af-stone-700)] hover:bg-[var(--af-stone-200)]/50 hover:text-[var(--af-indigo-950)] transition-colors"
          >
            <span className="w-5 text-center text-xs opacity-60">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
        {/* Account placeholder */}
        <div className="mt-2 flex items-center gap-3 rounded-md px-2 py-2 text-sm text-[var(--af-stone-700)]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--af-coral-500)] text-[9px] font-bold text-white">
            U
          </span>
          <span className="truncate">账户</span>
        </div>
      </div>
    </div>
  );
}
