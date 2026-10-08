import type { Metadata } from "next";
import { ContactView } from "@/components/views/ContactView";

export const metadata: Metadata = {
  title: "Contact",
  description: "Call, email or send a message to RT Law Services. Office hours and how to book a consultation.",
};

export default function ContactPage() {
  return <ContactView />;
}
