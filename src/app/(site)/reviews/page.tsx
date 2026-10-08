import type { Metadata } from "next";
import { ReviewsView } from "@/components/views/ReviewsView";

export const metadata: Metadata = {
  title: "Client reviews",
  description: "What clients say about working with RT Law Services, from family green cards to extraordinary ability petitions.",
};

export default function ReviewsPage() {
  return <ReviewsView />;
}
