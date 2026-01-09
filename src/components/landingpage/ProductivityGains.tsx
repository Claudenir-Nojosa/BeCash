import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { TrendingUp, Clock, FileSpreadsheet, FileText, Sparkles, Zap } from "lucide-react";

const methods = [
  {
    name: "Controle no Papel",
    icon: FileText,
    productivity: 23,
    description: "Lento, sujeito a erros e difícil de analisar",
    color: "from-gray-400 to-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  {
    name: "Planilha Manual",
    icon: FileSpreadsheet,
    productivity: 45,
    description: "Requer tempo para abrir, lançar e salvar",
    color: "from-green-400 to-green-500",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  {
    name: "BeCash",
    icon: Zap,
    productivity: 93,
    description: "Rápido, automático e inteligente",
    color: "from-primary to-accent",
    bgColor: "bg-primary/10",
    featured: true,
  },
];

const AnimatedCounter = ({ target, inView }: { target: number; inView: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (inView) {
      const duration = 1500;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [target, inView]);

  return <span>{count}</span>;
};

export const ProductivityGains = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-background relative overflow-hidden" ref={ref}>
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-l from-primary/5 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ganho de Produtividade</span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Economize{" "}
            <span className="gradient-text">Tempo e Energia</span>
          </h2>

          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Compare o tempo gasto com métodos tradicionais e veja como o BeCash 
            transforma sua rotina financeira
          </p>
        </motion.div>

        {/* Comparison Cards */}
        <div className="max-w-4xl mx-auto space-y-6">
          {methods.map((method, index) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`relative rounded-3xl p-6 md:p-8 transition-all duration-500 ${
                method.featured 
                  ? 'ring-2 ring-primary shadow-2xl scale-105 z-10' 
                  : 'border border-border/50'
              } ${method.bgColor}`}
            >
              {/* Featured Badge */}
              {method.featured && (
                <motion.div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-bold flex items-center gap-2"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4" />
                  Recomendado
                </motion.div>
              )}

              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Icon & Name */}
                <div className="flex items-center gap-4 md:w-1/4">
                  <motion.div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      method.featured 
                        ? 'bg-gradient-to-br from-primary to-accent shadow-lg' 
                        : 'bg-secondary'
                    }`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <method.icon className={`w-7 h-7 ${method.featured ? 'text-white' : 'text-muted-foreground'}`} />
                  </motion.div>
                  <div>
                    <h3 className={`font-bold text-lg ${method.featured ? 'text-foreground' : 'text-foreground/70'}`}>
                      {method.name}
                    </h3>
                    <p className="text-sm text-muted-foreground hidden md:block">{method.description}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-8 rounded-full bg-secondary/50 overflow-hidden relative">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${method.color} relative`}
                        initial={{ width: 0 }}
                        animate={isInView ? { width: `${method.productivity}%` } : { width: 0 }}
                        transition={{ duration: 1.2, delay: 0.3 + index * 0.2, ease: "easeOut" }}
                      >
                        {/* Shimmer Effect for Featured */}
                        {method.featured && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{
                              x: ['-100%', '200%'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 1,
                            }}
                          />
                        )}
                      </motion.div>
                    </div>

                    {/* Percentage */}
                    <div className={`w-20 text-right ${method.featured ? 'text-primary' : 'text-muted-foreground'}`}>
                      <motion.span
                        className={`text-2xl md:text-3xl font-bold ${method.featured ? 'text-primary' : ''}`}
                        initial={{ scale: 0.5 }}
                        animate={isInView ? { scale: 1 } : { scale: 0.5 }}
                        transition={{ delay: 1 + index * 0.2 }}
                      >
                        <AnimatedCounter target={method.productivity} inView={isInView} />%
                      </motion.span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 md:hidden">{method.description}</p>
                </div>
              </div>

              {/* Featured Highlight Glow */}
              {method.featured && (
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  animate={{
                    boxShadow: [
                      '0 0 20px hsl(var(--primary) / 0.1)',
                      '0 0 40px hsl(var(--primary) / 0.2)',
                      '0 0 20px hsl(var(--primary) / 0.1)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary/10 border border-primary/20">
            <Clock className="w-6 h-6 text-primary" />
            <p className="text-foreground">
              <span className="font-bold text-primary">Economize até 4 horas por semana</span>
              {" "}automatizando seu controle financeiro
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
