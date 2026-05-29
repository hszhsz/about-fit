import { Sidebar } from "@/components/sidebar";

// Next.js 15: `params` (and `searchParams`) in server components/layouts
// are async and must be awaited before reading fields. See:
// https://nextjs.org/docs/messages/sync-dynamic-apis
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 border-r border-[var(--af-stone-200)] bg-white">
        <Sidebar workspace={workspace} />
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[var(--af-stone-50)] p-8">{children}</main>
    </div>
  );
}
