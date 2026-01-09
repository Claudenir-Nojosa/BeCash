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
    <section className="py-24 bg-gradient-to-b from-secondary/30 to-background relative overflow-hidden">
      {/* Floating Hearts Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/10"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '110%',
              rotate: Math.random() * 360 
            }}
            animate={{ 
              y: '-10%',
              rotate: Math.random() * 360 + 360 
            }}
            transition={{
              duration: Math.random() * 10 + 15,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "linear"
            }}
          >
            <Heart className="w-8 h-8" fill="currentColor" />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 text-pink-500 text-sm font-medium mb-6"
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
            >
              <Heart className="w-4 h-4" />
              <span>Para Casais e Famílias</span>
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Controle{" "}
              <span className="gradient-text">Despesas Compartilhadas</span>
              {" "}com Facilidade
            </h2>

            <p className="text-muted-foreground text-lg mb-8">
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
                  className="flex items-start gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Main Card */}
            <motion.div
              className="relative rounded-3xl bg-card border border-border p-8 shadow-2xl"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Despesas do Casal</h4>
                    <p className="text-sm text-muted-foreground">Janeiro 2025</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">R$ 3.450,00</p>
                </div>
              </div>

              {/* Split Visualization */}
              <div className="relative h-4 rounded-full bg-secondary overflow-hidden mb-6">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: '55%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                <motion.div
                  className="absolute right-0 top-0 bottom-0 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: '45%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>

              <div className="flex justify-between text-sm mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Você: <span className="font-semibold text-foreground">R$ 1.897,50</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-muted-foreground">Parceiro(a): <span className="font-semibold text-foreground">R$ 1.552,50</span></span>
                </div>
              </div>

              {/* Recent Transactions */}
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
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{item.amount}</span>
                      {item.split && (
                        <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-medium">
                          50/50
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg flex items-center justify-center"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Users className="w-10 h-10 text-white" />
            </motion.div>

            <motion.div
              className="absolute -bottom-6 -left-6 px-6 py-3 rounded-2xl bg-card border border-border shadow-lg"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              <p className="text-sm text-muted-foreground">Saldo atual</p>
              <p className="text-lg font-bold text-green-500">Você está em dia! ✓</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
