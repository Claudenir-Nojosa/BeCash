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
    <section id="features" className="py-24 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <motion.span
            className="inline-block px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00cfec]/10 to-[#007cca]/10 text-[#007cca] dark:text-[#00cfec] text-xs font-medium mb-3 border border-[#00cfec]/20"
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            Recursos
          </motion.span>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Tudo que você precisa para{" "}
            <span className="bg-gradient-to-r from-[#00cfec] to-[#007cca] bg-clip-text text-transparent">
              dominar suas finanças
            </span>
          </h2>

          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Ferramentas poderosas e intuitivas que transformam a maneira como você
            gerencia seu dinheiro.
          </p>
        </motion.div>

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
              <div className="absolute inset-0 bg-gradient-to-r from-[#00cfec]/80 to-[#007cca]/80 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative p-8 rounded-2xl glass border border-transparent group-hover:border-[#00cfec]/20 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-[#00cfec] to-[#007cca] flex items-center justify-center mb-6 shadow-lg shadow-[#00cfec]/20 group-hover:shadow-[#00cfec]/40 transition-all">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white group-hover:text-[#007cca] dark:group-hover:text-[#00cfec] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
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