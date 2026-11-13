import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { canManageCertificados } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function CertificadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (!canManageCertificados(user)) {
    redirect('/');
  }
  return <>{children}</>;
}
