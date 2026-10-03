import type { Metadata } from "next";
import { InfoPage, OfficialLink } from "@/components/site/InfoPage";

export const metadata: Metadata = {
  title: "USCIS processing times explained",
  description: "How to read official USCIS processing times, what affects them, and when a case may be outside normal processing.",
};

export default function ProcessingTimesPage() {
  return (
    <InfoPage
      title="Processing times, explained"
      lede="U.S. Citizenship and Immigration Services (USCIS) publishes processing times for each form and office. This page explains how to read them."
      crumb="Processing times"
      parent={{ label: "Resources", href: "/resources/" }}
    >
      <h2>Where to find them</h2>
      <p>
        USCIS lists processing times by form, category and the office handling the case. Your receipt notice (Form
        I-797C) names the office, which tells you which line of the table applies to you.
      </p>
      <p><OfficialLink href="https://egov.uscis.gov/processing-times/">Official USCIS processing times</OfficialLink></p>
      <h2>How to read the figure</h2>
      <p>
        The published time describes how long USCIS took to complete most recent cases of that type. It is a guide
        based on past work, not a promise for any single case.
      </p>
      <h2>What can lengthen a case</h2>
      <ul>
        <li>A Request for Evidence (RFE), which pauses the case until you respond</li>
        <li>An interview requirement, which depends on the local office schedule</li>
        <li>Background checks that need more time</li>
        <li>A change of address that was not reported to USCIS</li>
      </ul>
      <h2>When a case seems stuck</h2>
      <p>
        If your receipt date is earlier than the date USCIS shows for inquiries, you can submit a case inquiry. Other
        options include contacting your member of Congress and, in some situations, a federal court action. We can help
        you decide which step fits.
      </p>
    </InfoPage>
  );
}
