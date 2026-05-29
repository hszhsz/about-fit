import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--af-stone-50)] px-6 text-center">
      {/* Logo */}
      <Image
        src="/brand/logo.png"
        alt="AboutFit"
        width={64}
        height={64}
        className="mb-8"
        priority
      />

      {/* Headline */}
      <h1 className="text-4xl font-bold tracking-tight text-[var(--af-indigo-950)] sm:text-5xl"
          style={{ fontFamily: "Fraunces, serif" }}>
        AI 驱动的服装营销内容工作台
      </h1>

      {/* Subtitle */}
      <p className="mt-4 max-w-2xl text-lg text-[var(--af-stone-700)]">
        一个人完成整季拍摄 — 虚拟模特、Lookbook、文案、尺码表、多平台导出
      </p>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/login"
          className="rounded-lg bg-[var(--af-indigo-600)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          开始使用
        </Link>
        <a
          href="https://github.com/aboutfit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[var(--af-indigo-600)] hover:underline"
        >
          查看文档
        </a>
      </div>
    </main>
  );
}
