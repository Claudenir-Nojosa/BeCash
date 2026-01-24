import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';

// Inicializar Stripe apenas uma vez
let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export function useStripeCheckout() {
  const router = useRouter();

  const createCheckoutSession = async ({
    plan,
    period,
    currency,
    lang = 'pt',
    userEmail,
  }: {
    plan: 'basic' | 'pro' | 'family';
    period: 'monthly' | 'yearly';
    currency: 'USD' | 'BRL';
    lang?: string;
    userEmail?: string;
  }) => {
    try {
      console.log('Iniciando checkout:', { plan, period, currency, lang });

      // Se for plano básico, redireciona direto para signup
      if (plan === 'basic') {
        router.push(`/${lang}/signup`);
        return;
      }

      // Para planos pagos, criar sessão de checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          period,
          currency,
          userEmail,
          successUrl: `${window.location.origin}/${lang}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/${lang}/pricing`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Erro na API:', data);
        throw new Error(data.error || 'Erro ao criar sessão');
      }

      if (data.sessionId) {
        const stripe = await getStripe();
        if (!stripe) throw new Error('Stripe não carregado');

        // Se tiver URL direta, usar redirectToCheckout
        if (data.url) {
          window.location.href = data.url;
        } else {
          const { error } = await stripe.redirectToCheckout({ 
            sessionId: data.sessionId 
          });

          if (error) {
            console.error('Erro ao redirecionar para checkout:', error);
            alert('Erro ao processar pagamento. Tente novamente.');
          }
        }
      } else {
        throw new Error('Sessão não criada');
      }
    } catch (error: any) {
      console.error('Erro ao criar sessão de checkout:', error);
      alert(`Erro: ${error.message || 'Não foi possível processar o pagamento'}`);
    }
  };

  const redirectToCustomerPortal = async () => {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erro ao acessar portal do cliente:', error);
    }
  };

  return { 
    createCheckoutSession, 
    redirectToCustomerPortal 
  };
}