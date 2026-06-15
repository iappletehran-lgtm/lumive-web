import type { Metadata } from "next";
import { BookContent } from "@/components/book/BookContent";

export const metadata: Metadata = {
  title: "Book a Strategy Call — Lumive AI",
  description:
    "Pick a time for a 30-minute AI strategy call with Lumive AI. Payment is verified automatically and your meeting link arrives by email within minutes.",
};

export default function BookPage() {
  return <BookContent />;
}
