/**
 * Login page is disabled for now.
 * Real auth (magic link / OAuth) will be wired up before launch.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-coral-50/30 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200/80 bg-white/80 p-8 shadow-soft backdrop-blur-sm">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500 to-coral-600 shadow-md">
            <span className="text-lg font-bold text-white">AF</span>
          </div>
        </div>

        <h1
          className="text-center text-2xl font-medium italic text-indigo-950"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          AboutFit
        </h1>
        <p className="mt-2 text-center text-sm text-stone-500">
          登录功能暂时关闭，请直接访问工作台
        </p>

        <div className="mt-6">
          <a
            href="/demo"
            className="block w-full rounded-xl bg-gradient-to-r from-coral-500 to-coral-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            进入演示工作台 →
          </a>
        </div>
      </div>
    </main>
  );
}