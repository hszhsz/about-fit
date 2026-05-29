import { redirect } from "next/navigation";

/**
 * Root redirect — skip login, go straight to demo workspace.
 * TODO: wire up real auth (magic link / OAuth) before launch.
 */
export default function HomePage() {
  redirect("/demo");
}