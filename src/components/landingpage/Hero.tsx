import { motion } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  PiggyBank,
  CreditCard,
  BarChart3,
  Shield,
  Sparkles,
  ChevronRight,
  Coins,
  CircleDollarSign,
  BanknoteIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";

const floatingIcons = [
  {
    Icon: TrendingUp,
    className: "top-20 left-[10%] float-animation",
    delay: 0,
    glow: true,
  },
  {
    Icon: PiggyBank,
    className: "top-32 right-[15%] float-animation-delayed",
    delay: 0.2,
    glow: true,
  },
  {
    Icon: CreditCard,
    className: "bottom-40 left-[20%] float-animation-slow",
    delay: 0.4,
    glow: true,
  },
  {
    Icon: BarChart3,
    className: "bottom-32 right-[10%] float-animation",
    delay: 0.6,
    glow: true,
  },
  {
    Icon: BanknoteIcon,
    className: "top-48 left-[5%] float-animation-delayed",
    delay: 0.3,
    glow: true,
  },
  {
    Icon: CircleDollarSign,
    className: "top-24 right-[5%] float-animation-slow",
    delay: 0.5,
    glow: true,
  },
];

// Array de moedas animadas
const animatedCoins = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: Math.random() * 20 + 10,
  left: Math.random() * 100,
  delay: Math.random() * 5,
  duration: Math.random() * 10 + 10,
}));

export const Hero = () => {
  const [isHoveringOffer, setIsHoveringOffer] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden bg-background">
        {/* Gradientes de fundo */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl" />

        {/* Moedas animadas */}
        {animatedCoins.map((coin) => (
          <motion.div
            key={coin.id}
            className="absolute"
            style={{
              left: `${coin.left}%`,
              top: "-5%",
              width: coin.size,
              height: coin.size,
            }}
            animate={{
              y: [0, window.innerHeight + 100],
              rotate: 360,
            }}
            transition={{
              duration: coin.duration,
              delay: coin.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <CircleDollarSign className="w-full h-full text-accent/40" />
          </motion.div>
        ))}
      </div>

      {/* Floating Icons - Mais chamativos */}
      {floatingIcons.map(({ Icon, className, delay, glow }, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            delay: 0.3 + delay,
            duration: 0.6,
            rotate: {
              delay: 1 + delay,
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
            },
          }}
          className={`absolute hidden lg:block ${className}`}
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${glow ? "glow-effect" : ""} bg-gradient-to-br from-secondary to-primary border border-accent/30`}
          >
            <div className="relative w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Icon className="w-7 h-7 text-accent" />
              {glow && (
                <div className="absolute inset-0 rounded-xl border border-accent/20 animate-ping" />
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge com oferta especial - versão clean */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-50 to-blue-50 dark:from-primary/10 dark:to-secondary/10 border border-sky-200 dark:border-accent/30 mb-6 group cursor-pointer hover:shadow-md transition-all"
            onMouseEnter={() => setIsHoveringOffer(true)}
            onMouseLeave={() => setIsHoveringOffer(false)}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-sky-900 dark:text-white">
              2 meses gratuitos no plano anual
            </span>
            <motion.div
              animate={{ x: isHoveringOffer ? 2 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-3 h-3 text-sky-600 dark:text-accent" />
            </motion.div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          >
            Controle suas finanças pelo{" "}
            <span className="relative inline-block">
              <span className="gradient-text">WhatsApp</span>
              <motion.div
                className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-accent to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </span>
            <br />
            <span className="text-2xl md:text-4xl lg:text-5xl font-semibold mt-4 block">
              com IA inteligente
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            O BeCash é seu assistente financeiro que transforma mensagens do
            WhatsApp em controle financeiro completo. Lançamentos automáticos,
            limites por categoria, metas compartilhadas e análises de IA para
            você economizar de verdade.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="gradient-bg text-primary-foreground glow px-8 py-6 text-lg font-semibold hover:opacity-90 transition-all group relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent"
                animate={{
                  x: ["0%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <span className="relative z-10">Começar Gratuitamente</span>
              <ArrowRight className="ml-2 w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-semibold glass hover:bg-secondary/50 border-accent/30 hover:border-accent/50 transition-all"
            >
              <Sparkles className="mr-2 w-5 h-5" />
              Ver Demonstração
            </Button>
          </motion.div>
          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-16 flex flex-wrap justify-center items-center gap-8 text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm">Dados Protegidos</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm">IA Avançada</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm">+30% Economia Média</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* CSS para animações */}
      <style jsx global>{`
        .glow-effect {
          box-shadow:
            0 0 20px rgba(56, 189, 248, 0.3),
            0 0 40px rgba(56, 189, 248, 0.2),
            0 0 60px rgba(56, 189, 248, 0.1);
        }

        .float-animation {
          animation: float 6s ease-in-out infinite;
        }

        .float-animation-delayed {
          animation: float 7s ease-in-out infinite 0.5s;
        }

        .float-animation-slow {
          animation: float 8s ease-in-out infinite 1s;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        .gradient-text {
          background: linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gradient-bg {
          background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
        }

        .glass {
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(56, 189, 248, 0.1);
        }
      `}</style>
    </section>
  );
};
