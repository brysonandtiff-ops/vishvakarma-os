import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { SacredBackground } from '@/components/marketing/SacredBackground';
import { Mail } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <SacredBackground className="flex min-h-screen items-center justify-center px-4">
      <PageMeta title="Reset Password" description="Recover your Vishvakarma.OS account." />
      <div className="vish-auth-center-card max-w-md p-8 text-center">
        <Mail className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-bold text-stone-100">Password reset not enabled</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-400">
          Vishvakarma.OS uses secure email-link sign-in. Password reset is not available in this
          release — request a new access link from the sign-in page instead.
        </p>
        <Link to="/auth" className="vish-gold-cta mt-8 inline-flex">
          Return to sign in
        </Link>
      </div>
    </SacredBackground>
  );
}
