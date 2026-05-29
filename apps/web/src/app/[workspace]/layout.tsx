import { Sidebar } from "@/components/sidebar";

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspace: string };
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 border-r border-[var(--af-stone-200)] bg-white">
        <Sidebar workspaceName={params.workspace} />
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[var(--af-stone-50)] p-8">{children}</main>
    </div>
  );
}
