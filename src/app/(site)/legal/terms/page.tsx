import type { Metadata } from "next";
import { InfoPage } from "@/components/site/InfoPage";

export const metadata: Metadata = { title: "Terms of use", description: "Terms that apply to the use of the RT Law Services website." };

export default function TermsPage() {
  return (
    <InfoPage title="Terms of use" lede="By using this website you agree to these terms." crumb="Terms" parent={{ label: "Legal", href: "/legal/disclaimer/" }}>
      <h2>Use of content</h2>
      <p>Content on this website is provided for general information. You may share links to it. Please do not copy it for commercial use without permission.</p>
      <h2>Accuracy</h2>
      <p>We review content regularly, but immigration law and government fees change often. Each page shows when it was last reviewed where relevant.</p>
      <h2>Links to other websites</h2>
      <p>Links to government and other websites are provided for convenience. We are not responsible for their content.</p>
      <h2>Bookings</h2>
      <p>A booking reserves a consultation time. It does not create an attorney-client relationship, and the firm may decline a matter after a conflict check.</p>
    </InfoPage>
  );
}
