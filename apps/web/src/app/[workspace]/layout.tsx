import { Sidebar } from "@/components/sidebar";

// Next.js 15: `params` (and `searchParams`) in server components/layouts
// are async and must be awaited before reading fields.
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
      <aside className="w-[260px] shrink-0 border-r border-stone-200/60">
        <Sidebar workspace={workspace} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-stone-50 to-coral-50/20 p-8">
        {children}
      </main>
    </div>
  );
}