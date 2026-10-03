import type { Metadata } from "next";
import { InfoPage } from "@/components/site/InfoPage";
import { SITE } from "@/content/site";

export const metadata: Metadata = { title: "Accessibility", description: "RT Law Services accessibility statement." };

export default function AccessibilityPage() {
  return (
    <InfoPage title="Accessibility" lede="We want everyone to be able to use this website, including people who use assistive technology." crumb="Accessibility">
      <h2>Our standard</h2>
      <p>We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. These guidelines, published by the World Wide Web Consortium, describe how to make web content usable for people with disabilities.</p>
      <h2>What we test</h2>
      <ul>
        <li>Text contrast of at least 4.5 to 1 against its background</li>
        <li>Keyboard access to every link, button and form field, with a visible focus outline</li>
        <li>Touch targets of at least 44 by 44 pixels</li>
        <li>Reduced motion for visitors who turn off animation in their device settings</li>
        <li>Labels on every form field and text alternatives for meaningful images</li>
      </ul>
      <h2>Tell us about a problem</h2>
      <p>If you have difficulty using any part of the site, call <a href={SITE.phoneHref}>{SITE.phone}</a> or write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. We will provide the information in another format and work to fix the issue.</p>
    </InfoPage>
  );
}
