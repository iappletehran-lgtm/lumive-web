import { requireRole } from "@/lib/auth";
import { WelcomeContent } from "@/components/dashboard/WelcomeContent";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const profile = await requireRole("prospect");
  const firstName = profile.full_name?.trim().split(/\s+/)[0] || "";

  return (
    <WelcomeContent
      firstName={firstName}
      fullName={profile.full_name || ""}
      company={profile.company || ""}
      email={profile.email || ""}
    />
  );
}
