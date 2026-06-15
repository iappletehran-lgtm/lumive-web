import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent, type Project } from "@/components/dashboard/DashboardContent";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireRole("client");
  const supabase = createClient();

  // RLS scopes this to the signed-in client's own projects (and their
  // deliverables), so no explicit client_id filter is required.
  const { data } = await supabase
    .from("projects")
    .select(
      "id, title, status, start_date, notes, created_at, deliverables ( id, name, file_url, uploaded_at )"
    )
    .order("created_at", { ascending: false });

  const projects = (data ?? []) as Project[];
  const firstName = profile.full_name?.trim().split(/\s+/)[0] || "";

  return (
    <DashboardContent
      firstName={firstName}
      company={profile.company || ""}
      email={profile.email || ""}
      projects={projects}
    />
  );
}
