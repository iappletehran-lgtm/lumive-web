import type { Metadata } from "next";
import { LabContent } from "@/components/lab/LabContent";

export const metadata: Metadata = {
  title: "Lumive Lab — Experience AI in action",
  description:
    "Lumive Lab is where you experience practical AI first-hand — interactive demos, business simulations, and agent demonstrations that preview what we build inside real companies.",
};

export default function LabPage() {
  return <LabContent />;
}
