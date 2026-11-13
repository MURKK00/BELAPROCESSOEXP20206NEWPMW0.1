import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { canAccessBackoffice } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (!canAccessBackoffice(user)) {
    redirect('/');
  }
  return <>{children}</>;
}
