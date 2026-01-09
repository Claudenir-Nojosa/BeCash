import { motion } from "framer-motion";
import { 
  Brain, 
  Target, 
  Bell, 
  PieChart, 
  Lock, 
  Zap 
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "IA Financeira",
    description: "Análises inteligentes que aprendem com seus hábitos e oferecem insights personalizados.",
  },
  {
    icon: Target,
    title: "Metas Personalizadas",
    description: "Defina objetivos financeiros e acompanhe seu progresso em tempo real.",
  },
  {
    icon: Bell,
    title: "Alertas Inteligentes",
    description: "Receba notificações sobre gastos, limites e oportunidades de economia.",
  },
  {
    icon: PieChart,
    title: "Relatórios Visuais",
    description: "Visualize suas finanças com gráficos interativos e dashboards intuitivos.",
  },
  {
    icon: Lock,
    title: "Segurança Total",
    description: "Criptografia de ponta e autenticação avançada protegem seus dados.",
  },
  {
    icon: Zap,
    title: "Automação",
    description: "Automatize transferências, pagamentos e investimentos recorrentes.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

export const Features = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
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
            Recursos
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Tudo que você precisa para{" "}
            <span className="gradient-text">dominar suas finanças</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ferramentas poderosas e intuitivas que transformam a maneira como você
            gerencia seu dinheiro.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute inset-0 gradient-bg rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative p-8 rounded-2xl glass border border-transparent group-hover:border-primary/20 transition-all duration-300">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-6 glow-sm group-hover:glow transition-all">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
