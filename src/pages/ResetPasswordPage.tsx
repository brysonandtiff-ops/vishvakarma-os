import { Navigate } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';

export default function ResetPasswordPage() {
  return (
    <>
      <PageMeta title="Reset Password" description="Recover your Vishvakarma.OS account." />
      <Navigate to="/auth" replace state={{ message: 'password-reset-unavailable' }} />
    </>
  );
}
