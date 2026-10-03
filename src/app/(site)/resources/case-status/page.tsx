import type { Metadata } from "next";
import { InfoPage, OfficialLink } from "@/components/site/InfoPage";

export const metadata: Metadata = {
  title: "How to check your USCIS case status",
  description: "Where to find your receipt number, how to check case status online, and what common status messages mean.",
};

export default function CaseStatusPage() {
  return (
    <InfoPage
      title="Checking your case status"
      lede="Every case filed with U.S. Citizenship and Immigration Services (USCIS) has a receipt number you can use to follow its progress online."
      crumb="Case status"
      parent={{ label: "Resources", href: "/resources/" }}
    >
      <h2>Find your receipt number</h2>
      <p>
        The receipt number has 13 characters: three letters followed by ten numbers, for example IOE0123456789. It is
        printed on the receipt notice, Form I-797C.
      </p>
      <p><OfficialLink href="https://egov.uscis.gov/">Check status on uscis.gov</OfficialLink></p>
      <h2>Common messages</h2>
      <ul>
        <li><strong>Case was received</strong>: USCIS accepted the filing and issued a receipt.</li>
        <li><strong>Biometrics appointment was scheduled</strong>: a notice with the date and location will arrive by mail.</li>
        <li><strong>Request for Evidence was sent</strong>: USCIS needs more documents. Note the deadline on the letter.</li>
        <li><strong>Interview was scheduled</strong>: a notice with the date and office will arrive by mail.</li>
        <li><strong>Case was approved</strong>: a decision notice follows, and cards are produced and mailed.</li>
      </ul>
      <h2>If something looks wrong</h2>
      <p>
        If the status has not changed for longer than the published processing time, or a notice never arrived, contact
        us. We can review the record and decide whether a service request or another step is appropriate.
      </p>
    </InfoPage>
  );
}
