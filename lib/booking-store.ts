/**
 * Booking persistence + side effects. SERVER ONLY (service-role DB writes + Cal
 * booking + email).
 *
 * `syncPaymentStatus` is the single place a payment_status change is applied to
 * the DB, called by both the NOWPayments webhook and the status poll. The
 * "confirmed" path uses a guarded update (.neq confirmed) so fulfilment — create
 * the Cal.com booking, then email the meeting details — runs exactly once, no
 * matter which caller observes the transition first.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmation } from "@/lib/email";
import { BUSINESS_TZ, type PaymentStatus } from "@/lib/booking";
import { createBooking } from "@/lib/cal";

type BookingRow = {
  id?: string;
  email: string | null;
  full_name: string | null;
  booking_link: string | null;
  selected_slot?: string | null;
};

/** Email the payer their confirmed meeting (time + join link). Never throws. */
export async function sendBookingEmail(b: BookingRow): Promise<void> {
  if (!b?.email) return;
  try {
    await sendBookingConfirmation({
      email: b.email,
      name: b.full_name,
      selectedSlot: b.selected_slot,
      bookingLink: b.booking_link,
    });
  } catch (err) {
    console.error("[bookings] confirmation email failed:", (err as Error).message);
  }
}

/**
 * Fulfil a newly-confirmed booking: create the Cal.com booking for the chosen
 * slot, persist the meeting link, then email the payer. Best-effort — a Cal
 * failure still emails what we have and is logged for manual follow-up.
 */
async function fulfilBooking(
  admin: ReturnType<typeof createAdminClient>,
  b: BookingRow
): Promise<void> {
  let meetingUrl = b.booking_link;

  if (b.selected_slot) {
    try {
      const startISO = new Date(b.selected_slot).toISOString();
      const cal = await createBooking({
        startISO,
        name: b.full_name || "",
        email: b.email || "",
        timeZone: BUSINESS_TZ,
      });
      if (cal.meetingUrl) {
        meetingUrl = cal.meetingUrl;
        if (b.id) {
          await admin.from("bookings").update({ booking_link: meetingUrl }).eq("id", b.id);
        }
      }
    } catch (err) {
      console.error("[bookings] Cal booking failed:", (err as Error).message);
    }
  }

  await sendBookingEmail({ ...b, booking_link: meetingUrl });
}

/**
 * Apply a payment status to the booking with the given NOWPayments id. Only ever
 * moves a booking forward, and fulfils (Cal booking + email) once on the first
 * transition into "confirmed". Failures are logged, never thrown.
 */
export async function syncPaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
  if (!paymentId) return;
  const admin = createAdminClient();
  try {
    if (status === "confirmed") {
      const { data } = await admin
        .from("bookings")
        .update({ payment_status: "confirmed" })
        .eq("payment_id", paymentId)
        .neq("payment_status", "confirmed")
        .select("id, email, full_name, booking_link, selected_slot");
      if (data && data.length) await fulfilBooking(admin, data[0] as BookingRow);
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
