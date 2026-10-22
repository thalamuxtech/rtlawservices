import type { Metadata } from "next";
import { page } from "@/content/seo";
import { ContactView } from "@/components/views/ContactView";

export const metadata: Metadata = page("/contact/", {
  title: "Contact",
  description: "Call, email or send a message to RT Law Services. Office hours and how to book a consultation.",
});

export default function ContactPage() {
  return <ContactView />;
}
