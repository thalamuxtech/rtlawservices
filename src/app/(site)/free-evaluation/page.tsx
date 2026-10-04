import type { Metadata } from "next";
import { Suspense } from "react";
import { BadgeCheck, Clock, FileSearch, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Accordion } from "@/components/site/PageHero";
import { EvaluationForm } from "@/components/evaluation/EvaluationForm";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Free evaluation",
  description:
    "Send your background for a free evaluation by an immigration attorney: EB-1A, National Interest Waiver, O-1, H-1B, family green cards and citizenship.",
};

const days = SITE.evaluationDays;
const STEPS = [
  { icon: FileSearch, title: "Tell us about you", text: "Answer a short questionnaire and, if you like, attach your CV. It takes about five minutes." },
  { icon: BadgeCheck, title: "Attorney review", text: "An attorney reviews your record against the legal standard for each route that could fit." },
  { icon: Clock, title: "Your evaluation", text: `We email our assessment and recommended next steps, usually within ${days} business day${days > 1 ? "s" : ""}.` },
];

const FAQ = [
  { q: "Is the evaluation really free?", a: "Yes. There is no charge for the evaluation and no obligation to retain the firm afterwards." },
  { q: "Does the evaluation make you my lawyer?", a: "No. An attorney-client relationship begins only after a written engagement agreement is signed. The evaluation is a preliminary assessment, not legal advice for your case." },
  { q: "Who sees my information?", a: "Only firm staff. Your answers and documents are stored securely and are not shared. Please leave out passport and file numbers." },
  { q: "What if I am not sure which category fits?", a: "Choose \"Not sure\" and describe your work. Assessing which route fits best is part of the evaluation." },
  { q: "Can I check my eligibility first?", a: "Yes. The eligibility self-check scores your record against the EB-1A, O-1A and National Interest Waiver standards in a few minutes, and passes your answers to this form." },
];

export default function FreeEvaluationPage() {
  return (
    <>
      <PageHero
        image="case-preparation"
        imagePosition="62% 45%"
        eyebrow="Free evaluation"
        title="Find out where you stand, from an attorney, at no cost"
        lede={`Send your background and an immigration attorney will assess which routes fit, usually within ${days} business day${days > 1 ? "s" : ""}. No fee, and no obligation.`}
        crumbs={[{ label: "Free evaluation" }]}
        aside={
          <ul className="grid gap-3 rounded-2xl border border-line-dark bg-ink-raised/80 p-6 text-sm text-stone-dark">
            {["Free and without obligation", "Reviewed by an attorney", "Sent securely, read only by firm staff", "Professionals, families and employers"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <ShieldCheck aria-hidden className="size-4 shrink-0 text-brass-light" /> {t}
              </li>
            ))}
          </ul>
        }
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="#evaluation">Start the questionnaire</ButtonLink>
          <ButtonLink href="/check-eligibility/" variant="outline-light">
            Check eligibility first
          </ButtonLink>
        </div>
      </PageHero>

      <section className="border-b border-line py-16">
        <Container>
          <ol className="grid gap-10 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative" data-reveal style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}>
                <span className="grid size-12 place-items-center rounded-full bg-ink text-brass-light">
                  <Icon aria-hidden className="size-5" />
                </span>
                <p className="mt-5 text-sm font-bold text-brass-ink">Step {i + 1}</p>
                <h2 className="font-serif-display mt-1 text-2xl text-ink">{title}</h2>
                <p className="mt-2 leading-relaxed text-stone">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {SITE.refundPolicy && (
        <section className="bg-brass-pale/60 py-12">
          <Container className="max-w-3xl text-center">
            <h2 className="font-serif-display text-3xl text-ink">{SITE.refundPolicy.title}</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{SITE.refundPolicy.text}</p>
          </Container>
        </section>
      )}

      <section className="py-16 sm:py-20">
        <Container>
          <Suspense fallback={<p className="text-stone">Loading the questionnaire</p>}>
            <EvaluationForm />
          </Suspense>
        </Container>
      </section>

      <section className="border-t border-line bg-mist py-20">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <h2 className="font-serif-display text-4xl text-ink" data-reveal>
            Questions about the evaluation
          </h2>
          <Accordion items={FAQ} />
        </Container>
      </section>
    </>
  );
}
