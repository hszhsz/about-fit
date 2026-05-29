export default function GarmentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--af-indigo-950)]">
        服装工作室
      </h1>

      {/* Empty state */}
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--af-stone-200)] p-16">
        <p className="text-[var(--af-stone-700)]">上传您的第一张平铺图</p>
        <div className="mt-4 flex h-32 w-full max-w-xs items-center justify-center rounded-md border-2 border-dashed border-[var(--af-indigo-600)]/30 bg-[var(--af-indigo-600)]/5 text-sm text-[var(--af-indigo-600)]">
          点击或拖拽上传
        </div>
      </div>
    </div>
  );
}
