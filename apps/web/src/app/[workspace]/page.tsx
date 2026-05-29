import Link from "next/link";
import {
  ArrowRight,
  Shirt,
  Sparkles,
  Users,
  Type,
  Image as ImageIcon,
  LayoutGrid,
  Ruler,
  ShoppingBag,
} from "lucide-react";

const quickActions = [
  {
    label: "服装工作室",
    description: "上传平铺图，生成上身效果",
    href: "/garments",
    icon: Shirt,
    color: "coral",
  },
  {
    label: "创建虚拟模特",
    description: "建立品牌视觉一致性",
    href: "/models",
    icon: Users,
    color: "violet",
  },
  {
    label: "生成文案",
    description: "AI 一键多平台营销文案",
    href: "/copy",
    icon: Type,
    color: "emerald",
  },
  {
    label: "Lookbooks",
    description: "策划并生成 Lookbook",
    href: "/lookbooks",
    icon: ImageIcon,
    color: "amber",
  },
];

const stats = [
  { label: "服装数量", value: "—", color: "coral" },
  { label: "渲染数量", value: "—", color: "violet" },
  { label: "合集数量", value: "—", color: "emerald" },
  { label: "模特数量", value: "—", color: "amber" },
];

export default function WorkspaceDashboardPage() {
  return (
    <div className="relative">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-gradient-to-br from-coral-200/30 to-violet-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-gradient-to-tr from-violet-200/20 to-coral-200/10 blur-3xl" />

      {/* Welcome section */}
      <div className="relative mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-coral-100/60 px-3 py-1 text-xs font-medium text-coral-600">
          <Sparkles className="h-3 w-3" />
          AI 驱动的服装智能化平台
        </div>
        <h1 className="mt-4 text-5xl font-medium italic text-indigo-950" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          欢迎回来
        </h1>
        <p className="mt-3 text-base text-stone-600">
          选择一个模块开始，或探索我们的 AI 功能
        </p>
      </div>

      {/* Quick actions grid */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5"
            >
              {/* Color accent bar */}
              <div
                className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-${action.color}-400 to-${action.color}-500`}
              />

              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${action.color}-100/60`}
                >
                  <Icon className={`h-6 w-6 text-${action.color}-500`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-stone-900">
                      {action.label}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-coral-500" />
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-card-hover"
          >
            <div
              className={`absolute -right-2 -top-2 h-16 w-16 rounded-full bg-${stat.color}-100/40 blur-xl transition-all duration-300 group-hover:bg-${stat.color}-200/50`}
            />
            <p className="relative text-sm font-medium text-stone-500">
              {stat.label}
            </p>
            <p className="relative mt-2 text-3xl font-semibold text-indigo-950">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent activity placeholder */}
      <div className="mt-8 rounded-2xl border border-stone-200/80 bg-white/60 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-stone-400">
          最近活动
        </h2>
        <div className="mt-4 flex items-center justify-center py-8 text-sm text-stone-400">
          暂无最近活动
        </div>
      </div>
    </div>
  );
}