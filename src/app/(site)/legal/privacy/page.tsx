import type { Metadata } from "next";
import { InfoPage } from "@/components/site/InfoPage";
import { SITE } from "@/content/site";

export const metadata: Metadata = { title: "Privacy policy", description: "How RT Law Services collects, uses and protects personal information." };

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy policy" lede="What we collect through this website, why, and how we protect it." crumb="Privacy" parent={{ label: "Legal", href: "/legal/disclaimer/" }}>
      <h2>What we collect</h2>
      <ul>
        <li>Details you enter when booking or sending a message: name, email, phone, country, preferred language, the type of matter and the names of other parties, which we use for a conflict check.</li>
        <li>Answers you give in the free evaluation questionnaire, such as country of birth, current status, education, work and, if you choose to answer, past immigration problems, plus any CV you upload.</li>
        <li>Usage data from Google Analytics, such as pages viewed, device type and approximate location. Analytics uses cookies and does not receive what you type into forms.</li>
      </ul>
      <p>We do not ask for passport numbers or immigration file numbers through website forms. Please share only what the questions ask for.</p>
      <h2>How we use it</h2>
      <p>To respond to you, schedule consultations, check for conflicts of interest and improve the website. We do not sell personal information.</p>
      <h2>Where it is stored</h2>
      <p>Form submissions are stored in Google Firebase, encrypted in transit and at rest, and are readable only by authorized firm staff.</p>
      <h2>How long we keep it</h2>
      <p>If you do not become a client, we delete website enquiry data within 24 months, unless the law requires otherwise.</p>
      <h2>Your choices</h2>
      <p>You may ask us to see, correct or delete your information by writing to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
    </InfoPage>
  );
}
