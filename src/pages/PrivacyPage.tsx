import PageMeta from '@/components/common/PageMeta';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';

const EFFECTIVE_DATE = '15 July 2026';
const CONTACT_EMAIL = 'support@vishvakarma-os.app';

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold vish-text-heading">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed vish-text-body">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <PageMeta
        title="Privacy Policy — Vishvakarma.OS"
        description="What Vishvakarma.OS collects, how project data is stored, and the choices you have."
      />
      <section className="vish-marketing-section mx-auto max-w-3xl py-16">
        <MarketingPageHeader
          devanagari="गोपनीयता नीति"
          title="Privacy Policy"
          description={`Effective ${EFFECTIVE_DATE}. Plain-language, because you should not need a lawyer to know what happens to your floor plans.`}
        />

        <LegalSection title="What we collect">
          <p>
            Account details (email and authentication data), the project content you create (floor plans,
            models, exports, project names and descriptions), and basic technical information needed to run a
            web application (session state, device type, approximate performance characteristics).
          </p>
        </LegalSection>

        <LegalSection title="Where it lives">
          <p>
            Project data and accounts are stored in Supabase (managed Postgres) with row-level security, so
            your projects are only readable by your account and people you explicitly share with. Local
            drafts may also be kept on your device so work survives a dropped connection.
          </p>
        </LegalSection>

        <LegalSection title="Payments">
          <p>
            Subscriptions are processed by Stripe. Your card details go directly to Stripe and never touch
            our servers. We receive only what is needed to run your subscription: plan, status, and billing
            country.
          </p>
        </LegalSection>

        <LegalSection title="What we do not do">
          <p>
            We do not sell your data. We do not use your project content to train AI models. We do not show
            advertising. Optional AI-assisted features only send the specific content you ask them to act on,
            when you invoke them.
          </p>
        </LegalSection>

        <LegalSection title="Cookies and local storage">
          <p>
            We use session storage and local storage for sign-in state, drafts, and interface preferences —
            the things the app needs to function. We do not run third-party advertising trackers.
          </p>
        </LegalSection>

        <LegalSection title="Your choices">
          <p>
            You can export your project data, delete individual projects, or delete your account entirely.
            Account deletion removes your projects from active systems, with residual copies clearing from
            backups on their normal rotation. For access, correction, or deletion requests under the
            Australian Privacy Principles, contact{' '}
            <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="Changes">
          <p>
            If this policy changes in a way that matters, we will note it on this page with a new effective
            date. Continued use after a change means you accept the updated policy.
          </p>
        </LegalSection>
      </section>
    </>
  );
}
