export default function WorkspaceDashboardPage() {
  const stats = [
    { label: "服装数量", value: "—" },
    { label: "渲染数量", value: "—" },
    { label: "合集数量", value: "—" },
    { label: "模特数量", value: "—" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--af-indigo-950)]">
        欢迎回来
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[var(--af-stone-200)] bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-[var(--af-stone-700)]">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--af-indigo-950)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
