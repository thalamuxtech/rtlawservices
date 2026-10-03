import type { Metadata } from "next";
import { InfoPage, OfficialLink } from "@/components/site/InfoPage";

export const metadata: Metadata = {
  title: "The Visa Bulletin, explained",
  description: "What the monthly U.S. Department of State Visa Bulletin shows, how priority dates work, and how to find your place in line.",
};

export default function VisaBulletinPage() {
  return (
    <InfoPage
      title="The Visa Bulletin, explained"
      lede="Some green card categories have more applicants than visas each year. The Visa Bulletin shows who can move forward each month."
      crumb="Visa Bulletin"
      parent={{ label: "Resources", href: "/resources/" }}
    >
      <h2>Why a waiting line exists</h2>
      <p>
        U.S. law limits the number of green cards in most family and employment categories each year, with a cap per
        country of birth. Immediate relatives of U.S. citizens are not subject to these limits and do not wait for the
        bulletin.
      </p>
      <h2>Your priority date</h2>
      <p>
        Your priority date is your place in line. It is usually the date your petition was filed, or the date a labor
        certification was filed for employment cases. It appears on the approval or receipt notice.
      </p>
      <h2>Reading the charts</h2>
      <p>The bulletin has two charts for each category and country:</p>
      <ul>
        <li><strong>Final Action Dates</strong>: when a green card can be approved. Your priority date must be earlier than the date shown.</li>
        <li><strong>Dates for Filing</strong>: when you may submit the final paperwork, if USCIS or the Department of State says this chart applies that month.</li>
      </ul>
      <p>
        &ldquo;C&rdquo; means current: visas are available for every priority date in that category. &ldquo;U&rdquo;
        means unavailable.
      </p>
      <p><OfficialLink href="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html">Current Visa Bulletin</OfficialLink></p>
    </InfoPage>
  );
}
