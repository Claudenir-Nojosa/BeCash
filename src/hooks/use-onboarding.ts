// hooks/use-onboarding.ts
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useOnboardingRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      const onboardingCompleto = (session.user as any)?.onboardingCompleto;
      
      // Se onboarding não está completo e não está na página de onboarding
      if (!onboardingCompleto && !window.location.pathname.startsWith('/onboarding')) {
        router.push('/onboarding');
      }
      
      // Se onboarding está completo e está na página de onboarding
      if (onboardingCompleto && window.location.pathname.startsWith('/onboarding')) {
        router.push('/dashboard');
      }
    }
  }, [session, status, router]);
}