"use client";

import { InfoPage } from "@/components/site/InfoPage";
import { useContent } from "@/content/LiveContent";

export function PrivacyView() {
  const { SITE } = useContent();
  return (
    <InfoPage title="Privacy policy" lede="What we collect through this website, why, and how we protect it." crumb="Privacy" parent={{ label: "Legal", href: "/legal/disclaimer/" }}>
      <h2>What we collect</h2>
      <ul>
        <li>Details you enter when booking or sending a message: name, email, phone, country, preferred language, the type of matter and the names of other parties, which we use for a conflict check.</li>
        <li>Answers you give in the free evaluation questionnaire, such as country of birth, current status, education, work and, if you choose to answer, past immigration problems, plus any CV you upload.</li>
        <li>Usage data from Google Analytics, such as pages viewed, device type and approximate location, only if you accept analytics cookies. Analytics never receives what you type into forms.</li>
      </ul>
      <p>We do not ask for passport numbers or immigration file numbers through website forms. Please share only what the questions ask for.</p>
      <h2>Cookies and analytics</h2>
      <p>
        The website works without cookies. Google Analytics, which sets cookies and sends usage data to Google, loads only after you choose
        Accept in the privacy notice. Until then, no analytics script, tracking pixel or other third-party script runs on this website. You
        can change your choice at any time with Cookie settings at the foot of every page; choosing Reject also removes the analytics
        cookies already set.
      </p>
      <p>
        The staff portal sets one essential cookie that keeps staff signed in. Visitors to the public website never receive it.
      </p>
      <h2>How we use it</h2>
      <p>To respond to you, schedule consultations, check for conflicts of interest and improve the website. We do not sell personal information.</p>
      <h2>Where it is stored</h2>
      <p>Form submissions and any CV you upload are stored with Cloudflare, our hosting provider, encrypted in transit and at rest, and are readable only by authorized firm staff. When we email you from our staff portal, the message is delivered through Brevo, an email delivery service.</p>
      <h2>How long we keep it</h2>
      <p>If you do not become a client, we delete website enquiry data within 24 months, unless the law requires otherwise.</p>
      <h2>Your choices</h2>
      <p>You may ask us to see, correct or delete your information by writing to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
    </InfoPage>
  );
}
