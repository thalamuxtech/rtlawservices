"use client";

import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { useContent } from "@/content/LiveContent";

export function ContactView() {
  const { SITE } = useContent();
  const items = [
    { icon: Phone, label: "Phone", value: SITE.phone, href: SITE.phoneHref },
    { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: MapPin, label: "Office", value: SITE.location },
  ];
  return (
    <>
      <PageHero
        title="We are here to help"
        lede="The fastest way to get advice is to book a consultation. For anything else, call, email or send a message below."
        crumbs={[{ label: "Contact" }]}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/free-evaluation/">Request a free evaluation</ButtonLink>
          <ButtonLink href="/book/" variant="outline-light">
            Book a consultation
          </ButtonLink>
        </div>
      </PageHero>
      <section className="py-20">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid content-start gap-4">
            {items.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex gap-5 rounded-2xl border border-line bg-white p-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-mist text-brass-ink">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone">{label}</p>
                  {href ? (
                    <a href={href} className="mt-1 flex min-h-11 items-center break-all font-bold text-ink hover:text-brass-ink">
                      {value}
                    </a>
                  ) : (
                    <p className="mt-1 font-bold text-ink">{value}</p>
                  )}
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-line bg-white p-6">
              <p className="flex items-center gap-3 text-sm font-bold text-stone">
                <Clock aria-hidden className="size-5 text-brass-ink" /> Office hours (Eastern Time)
              </p>
              <dl className="mt-4 grid gap-2">
                {SITE.hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-4 border-t border-line pt-2 text-ink">
                    <dt>{h.days}</dt>
                    <dd className="font-bold">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <ContactForm />
        </Container>
      </section>
    </>
  );
}
