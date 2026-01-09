import { motion } from "framer-motion";
import { Download, Link, Sparkles, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Download,
    title: "Crie sua conta",
    description: "Cadastre-se em segundos com seu email ou redes sociais.",
  },
  {
    icon: Link,
    title: "Conecte suas contas",
    description: "Vincule suas contas bancárias e cartões de forma segura.",
  },
  {
    icon: Sparkles,
    title: "Receba insights",
    description: "Nossa IA analisa seus gastos e sugere melhorias personalizadas.",
  },
  {
    icon: TrendingUp,
    title: "Alcance suas metas",
    description: "Acompanhe seu progresso e veja seu dinheiro crescer.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full glass text-sm text-primary font-medium mb-4">
            Como Funciona
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Simples como{" "}
            <span className="gradient-text">1, 2, 3, 4</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comece a transformar suas finanças em poucos minutos com nosso
            processo simplificado.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative text-center"
              >
                {/* Step Number */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative inline-flex mb-6"
                >
                  <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center glow">
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
