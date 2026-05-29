export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--af-stone-50)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--af-stone-200)] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--af-indigo-950)]">
          登录 AboutFit
        </h1>

        <div className="mt-6">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--af-stone-700)]"
          >
            邮箱地址
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="mt-1 block w-full rounded-md border border-[var(--af-stone-200)] px-3 py-2 text-sm placeholder:text-[var(--af-stone-700)]/50 focus:border-[var(--af-indigo-600)] focus:outline-none focus:ring-1 focus:ring-[var(--af-indigo-600)]"
          />
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-lg bg-[var(--af-indigo-600)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          发送登录链接
        </button>

        <p className="mt-4 text-center text-xs text-[var(--af-stone-700)]">
          我们会发送一个魔法链接到您的邮箱
        </p>
      </div>
    </main>
  );
}
