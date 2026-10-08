"use client";

import { InfoPage } from "@/components/site/InfoPage";
import { NO_RELATIONSHIP, RESULTS_CAVEAT } from "@/content/site";
import { useContent } from "@/content/LiveContent";

export function DisclaimerView() {
  const { SITE } = useContent();
  return (
    <InfoPage title="Disclaimer" lede="Please read this notice before relying on information on this website." crumb="Disclaimer" parent={{ label: "Legal", href: "/legal/disclaimer/" }}>
      <h2>Attorney advertising</h2>
      <p>This website may be considered attorney advertising under the rules of professional conduct that apply to lawyers in Maryland and other jurisdictions.</p>
      <h2>No legal advice</h2>
      <p>The content of this website is general information. It is not legal advice for any individual case and may not reflect the most recent changes in law or policy. Do not act on it without advice from a lawyer about your own situation.</p>
      <h2>No attorney-client relationship</h2>
      <p>{NO_RELATIONSHIP} A relationship begins only after a written engagement agreement is signed.</p>
      <h2>Results</h2>
      <p>{RESULTS_CAVEAT} Reviews and case results describe individual matters and are not a prediction of future results.</p>
      <h2>Responsible attorney</h2>
      <p>{SITE.responsibleAttorney ? `${SITE.responsibleAttorney} is responsible for the content of this website.` : "The firm will name the attorney responsible for this website's content before public launch."}</p>
    </InfoPage>
  );
}
