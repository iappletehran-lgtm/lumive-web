"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingEmail } from "@/lib/booking-store";
import { sendClientPromotion } from "@/lib/email";
import { isProjectStatus } from "@/lib/projects";

/**
 * Promote a prospect to client. Guarded by requireRole("admin") so only an admin
 * session can run it, then uses the service-role client to write across RLS. The
 * extra .eq("role", "prospect") makes it a no-op for anyone who is not currently
 * a prospect, so it can never demote a client or change an admin.
 */
export async function promoteToClient(formData: FormData) {
  await requireRole("admin");

  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  // .select() returns the row only if it was actually a prospect → email once.
  const { data: promoted } = await admin
    .from("profiles")
    .update({ role: "client" })
    .eq("id", id)
    .eq("role", "prospect")
    .select("id, full_name");

  if (promoted && promoted.length) {
    // profiles has no email — pull it from auth.users via the admin API.
    const { data: u } = await admin.auth.admin.getUserById(id);
    const email = u?.user?.email;
    const name =
      promoted[0].full_name || (u?.user?.user_metadata?.full_name as string | undefined) || null;
    if (email) {
      try {
        await sendClientPromotion({ email, name });
      } catch (err) {
        console.error("[admin] promotion email failed:", (err as Error).message);
      }
    }
  }

  revalidatePath("/admin");
}

/**
 * Save / update the per-booking Cal.com link. Payment confirmation is automatic
 * (webhook), so this only sets the link; it does not change payment_status or
 * email. Admin-guarded; service-role write (bookings is RLS-locked).
 */
export async function saveBookingLink(formData: FormData) {
  await requireRole("admin");

  const id = String(formData.get("id") || "");
  const bookingLink = String(formData.get("booking_link") || "").trim();
  if (!id) return;

  const admin = createAdminClient();
  await admin
    .from("bookings")
    .update({ booking_link: bookingLink || null })
    .eq("id", id);

  revalidatePath("/admin");
}

/**
 * Resend the booking-link email for a confirmed booking (uses the booking's own
 * Cal.com link, else the default). Admin-guarded.
 */
export async function resendBookingEmail(formData: FormData) {
  await requireRole("admin");

  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  const { data } = await admin
    .from("bookings")
    .select("email, full_name, booking_link, selected_slot")
    .eq("id", id)
    .maybeSingle();

  if (data) await sendBookingEmail(data);

  revalidatePath("/admin");
}

/**
 * Mark a captured lead as contacted. Admin-guarded; service-role write (leads is
 * RLS-locked). Idempotent — re-marking just refreshes contacted_at.
 */
export async function markLeadContacted(formData: FormData) {
  await requireRole("admin");

  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  await admin
    .from("leads")
    .update({ contacted: true, contacted_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin");
}

/**
 * Create a project. Admin-guarded; service-role write (projects is RLS-locked).
 * client_id, start_date and notes are optional; status falls back to "discovery"
 * if it is not one of the known lifecycle values.
 */
export async function addProject(formData: FormData) {
  await requireRole("admin");

  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const clientId = String(formData.get("client_id") || "").trim();
  const startDate = String(formData.get("start_date") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const statusRaw = String(formData.get("status") || "").trim();
  const status = isProjectStatus(statusRaw) ? statusRaw : "discovery";

  const admin = createAdminClient();
  await admin.from("projects").insert({
    title,
    client_id: clientId || null,
    start_date: startDate || null,
    notes: notes || null,
    status,
  });

  revalidatePath("/admin");
}

/** Update a project's lifecycle status. Admin-guarded; ignores unknown statuses. */
export async function updateProjectStatus(formData: FormData) {
  await requireRole("admin");

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "").trim();
  if (!id || !isProjectStatus(status)) return;

  const admin = createAdminClient();
  await admin.from("projects").update({ status }).eq("id", id);

  revalidatePath("/admin");
}

/**
 * Add a deliverable. Admin-guarded; service-role write. project_id and file_url
 * are optional; name is required.
 */
export async function addDeliverable(formData: FormData) {
  await requireRole("admin");

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const projectId = String(formData.get("project_id") || "").trim();
  const fileUrl = String(formData.get("file_url") || "").trim();

  const admin = createAdminClient();
  await admin.from("deliverables").insert({
    name,
    project_id: projectId || null,
    file_url: fileUrl || null,
  });

  revalidatePath("/admin");
}

/** Delete a stored chatbot memory by id. Admin-guarded; service-role write. */
export async function deleteMemory(formData: FormData) {
  await requireRole("admin");

  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  await admin.from("memories").delete().eq("id", id);

  revalidatePath("/admin");
}
