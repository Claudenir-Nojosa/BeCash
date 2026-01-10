import { motion } from "framer-motion";
import { Users, Split, Heart, ArrowLeftRight, Check } from "lucide-react";

const features = [
  {
    icon: Split,
    title: "Divisão Automática",
    description: "Defina a porcentagem de divisão e o BeCash calcula automaticamente",
  },
  {
    icon: Users,
    title: "Múltiplos Participantes",
    description: "Adicione quantas pessoas quiser em uma despesa compartilhada",
  },
  {
    icon: ArrowLeftRight,
    title: "Saldo de Quem Deve",
    description: "Visualize quem está devendo e quanto de forma clara",
  },
];

export const SharedExpenses = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
<div className="absolute inset-0 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
  
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96">
    <div className="absolute top-0 left-0 w-96 h-96 bg-[#00cfec]/10 rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#007cca]/10 rounded-full blur-3xl" />
  </div>
</div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-500 text-xs font-medium mb-6 border border-cyan-500/20"
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Heart className="w-4 h-4" />
              <span>Para Casais e Famílias</span>
            </motion.div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
              Controle{" "}
              <span className="bg-gradient-to-r from-[#00cfec] to-[#007cca] bg-clip-text text-transparent">
                Despesas Compartilhadas
              </span>
              {" "}com Facilidade
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-8">
              Comprou algo com seu cônjuge? Dividiu a conta do restaurante? 
              O BeCash permite controlar todas as despesas compartilhadas de forma 
              simples e transparente, mantendo a harmonia financeira do casal.
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-800/60 hover:border-[#00cfec]/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#00cfec]/10 to-[#007cca]/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-[#007cca] dark:text-[#00cfec]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm md:text-base">{feature.title}</h4>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <motion.div
              className="relative rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 shadow-2xl"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Despesas do Casal</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Janeiro 2025</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ 3.450,00</p>
                </div>
              </div>

              <div className="relative h-4 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden mb-6">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: '55%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                <motion.div
                  className="absolute right-0 top-0 bottom-0 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: '45%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>

              <div className="flex justify-between text-sm mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">Você: <span className="font-semibold text-gray-900 dark:text-white">R$ 1.897,50</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-gray-600 dark:text-gray-400">Parceiro(a): <span className="font-semibold text-gray-900 dark:text-white">R$ 1.552,50</span></span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Supermercado Extra", amount: "R$ 456,00", split: true },
                  { name: "Conta de Luz", amount: "R$ 189,00", split: true },
                  { name: "Jantar Romântico", amount: "R$ 280,00", split: true },
                ].map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00cfec]/10 to-[#007cca]/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#007cca] dark:text-[#00cfec]" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.amount}</span>
                      {item.split && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 text-xs font-medium border border-cyan-500/20">
                          50/50
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg flex items-center justify-center"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Users className="w-10 h-10 text-white" />
            </motion.div>

            <motion.div
              className="absolute -bottom-6 -left-6 px-6 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo atual</p>
              <p className="text-lg font-bold text-cyan-500">Você está em dia! ✓</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};