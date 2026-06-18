"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingEmail } from "@/lib/booking-store";
import { sendClientPromotion } from "@/lib/email";

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
