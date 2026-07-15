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

export default function TermsPage() {
  return (
    <>
      <PageMeta
        title="Terms of Service — Vishvakarma.OS"
        description="The terms that govern your use of Vishvakarma.OS, including accounts, subscriptions, your content, and acceptable use."
      />
      <section className="vish-marketing-section mx-auto max-w-3xl py-16">
        <MarketingPageHeader
          devanagari="नियम एवं शर्तें"
          title="Terms of Service"
          description={`Effective ${EFFECTIVE_DATE}. These terms govern your use of Vishvakarma.OS.`}
        />

        <LegalSection title="1. Who we are">
          <p>
            Vishvakarma.OS ("the Service", "we", "us") is a browser-based architecture studio for drawing floor
            plans, reviewing designs in 3D, and exporting project packages, operated from Western Australia.
            By creating an account or using the Service you agree to these terms.
          </p>
        </LegalSection>

        <LegalSection title="2. Your account">
          <p>
            You need an account for most features. You are responsible for keeping your sign-in credentials
            secure and for activity that occurs under your account. You must provide accurate information and
            be at least 18 years old, or use the Service under the supervision of someone who is.
          </p>
        </LegalSection>

        <LegalSection title="3. Subscriptions and billing">
          <p>
            Paid plans are billed through Stripe. We do not store your card details — payment information is
            handled by Stripe under its own terms and privacy policy. Subscriptions renew automatically until
            cancelled. You can cancel at any time from your account; cancellation takes effect at the end of
            the current billing period, and you keep access until then.
          </p>
          <p>
            Prices may change with reasonable notice. Nothing in these terms excludes rights you have under
            the Australian Consumer Law, including any applicable consumer guarantees.
          </p>
        </LegalSection>

        <LegalSection title="4. Your content">
          <p>
            Your projects — floor plans, models, exports, and everything you create in the Service — belong to
            you. You grant us only the limited licence needed to store, process, display, and back up your
            content so the Service can function. We do not sell your project data or use it to train AI models.
          </p>
        </LegalSection>

        <LegalSection title="5. Acceptable use">
          <p>
            You agree not to misuse the Service: no attempts to breach security, disrupt other users, reverse
            engineer non-open components, resell access without permission, or use the Service for unlawful
            purposes. We may suspend accounts that put the Service or other users at risk.
          </p>
        </LegalSection>

        <LegalSection title="6. Professional judgement disclaimer">
          <p>
            Vishvakarma.OS is a design and drafting tool. Outputs — including plans, measurements, cost
            estimates, and compliance aids — are provided for design exploration and communication. They are
            not a substitute for the judgement of a licensed architect, engineer, or surveyor, and must not be
            relied on as construction documentation without professional review and local approval.
          </p>
        </LegalSection>

        <LegalSection title="7. Availability and changes">
          <p>
            We work to keep the Service available and your data safe, but the Service is provided on an
            "as available" basis and features may change, be added, or be retired over time. Where we retire
            a feature that materially affects paid functionality, we will give reasonable notice.
          </p>
        </LegalSection>

        <LegalSection title="8. Liability">
          <p>
            To the maximum extent permitted by law, our total liability arising out of or in connection with
            the Service is limited to the amount you paid us in the twelve months before the claim arose.
            Nothing in this section limits liability that cannot be excluded under Australian law.
          </p>
        </LegalSection>

        <LegalSection title="9. Ending these terms">
          <p>
            You can stop using the Service and delete your account at any time. We may terminate or suspend
            access for material breach of these terms. On termination you may request an export of your
            project data within 30 days.
          </p>
        </LegalSection>

        <LegalSection title="10. Governing law and contact">
          <p>
            These terms are governed by the laws of Western Australia, and disputes are subject to the
            jurisdiction of its courts. Questions about these terms:{' '}
            <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </LegalSection>
      </section>
    </>
  );
}
