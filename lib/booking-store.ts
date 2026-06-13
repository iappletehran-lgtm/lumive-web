/**
 * Booking persistence + side effects. SERVER ONLY (service-role DB writes + email).
 *
 * `syncPaymentStatus` is the single place a payment_status change is applied to
 * the DB, called by both the NOWPayments webhook and the status poll. The
 * "confirmed" path uses a guarded update (.neq confirmed) so the confirmation
 * email is sent exactly once, no matter which caller observes the transition
 * first.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { PAYMENT, type PaymentStatus } from "@/lib/booking";
import { BOOKING_URL } from "@/lib/contact";

type BookingRow = {
  email: string | null;
  full_name: string | null;
  booking_link: string | null;
};

/** Email the payer their booking link (their per-booking link, else the default Cal.com link). */
export async function sendBookingEmail(b: BookingRow): Promise<void> {
  if (!b?.email) return;
  const link = b.booking_link || BOOKING_URL;
  const firstName = (b.full_name || "").trim().split(/\s+/)[0] || "there";
  try {
    await sendEmail({
      to: b.email,
      subject: "Your Lumive AI strategy call — booking link",
      text:
        `Hi ${firstName},\n\n` +
        `Thanks for your payment. Your ${PAYMENT.offer} is confirmed.\n\n` +
        `Book your time here:\n${link}\n\n` +
        `If none of the times work, reply to this email and we will sort it.\n\n` +
        `— Lumive AI`,
    });
  } catch (err) {
    console.error("[bookings] email failed:", (err as Error).message);
  }
}

/**
 * Apply a payment status to the booking with the given NOWPayments id. Only ever
 * moves a booking forward, and emails the booking link on the first transition
 * into "confirmed". Failures are logged, never thrown (callers are webhooks/polls).
 */
export async function syncPaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
  if (!paymentId) return;
  const admin = createAdminClient();
  try {
    if (status === "confirmed") {
      // Guarded update: rows only match if not already confirmed → email once.
      const { data } = await admin
        .from("bookings")
        .update({ payment_status: "confirmed" })
        .eq("payment_id", paymentId)
        .neq("payment_status", "confirmed")
        .select("email, full_name, booking_link");
      if (data && data.length) await sendBookingEmail(data[0] as BookingRow);
    } else if (status === "failed") {
      await admin
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("payment_id", paymentId)
        .in("payment_status", ["waiting", "confirming"]);
    } else if (status === "confirming") {
      await admin
        .from("bookings")
        .update({ payment_status: "confirming" })
        .eq("payment_id", paymentId)
        .eq("payment_status", "waiting");
    }
    // "waiting" is the initial state — nothing to do.
  } catch (err) {
    console.error("[bookings] syncPaymentStatus failed:", (err as Error).message);
  }
}
