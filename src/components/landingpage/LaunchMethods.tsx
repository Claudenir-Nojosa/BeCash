import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MessageSquare, Edit3, ChevronDown } from "lucide-react";

const launchMethods = [
  {
    id: "audio",
    title: "Lançamento via Áudio",
    icon: Mic,
    description: "Basta gravar um áudio descrevendo sua despesa ou receita. Nossa IA transcreve e categoriza automaticamente, tornando o registro tão natural quanto conversar.",
    features: ["Transcrição automática", "Categorização inteligente", "Hands-free"],
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "message",
    title: "Lançamento via Mensagem",
    icon: MessageSquare,
    description: "Envie uma mensagem pelo WhatsApp com sua transação. Nossa integração com a Meta API processa e lança automaticamente no seu controle financeiro.",
    features: ["WhatsApp integrado", "Resposta instantânea", "Confirmação automática"],
    image: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800&auto=format&fit=crop&q=80",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "normal",
    title: "Lançamento Normal",
    icon: Edit3,
    description: "Para quem prefere o controle total, nossa interface intuitiva permite lançamentos manuais rápidos com categorização, tags e anexos.",
    features: ["Interface intuitiva", "Campos personalizáveis", "Anexo de comprovantes"],
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80",
    gradient: "from-blue-500 to-cyan-600",
  },
];

export const LaunchMethods = () => {
  const [activeMethod, setActiveMethod] = useState<string | null>(null);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
          >
            Múltiplas Formas de Lançar
          </motion.span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Lance suas transações{" "}
            <span className="gradient-text">do seu jeito</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Escolha o método que melhor se adapta ao seu momento. Flexibilidade é a nossa prioridade.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {launchMethods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <motion.div
                className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 ${
                  activeMethod === method.id 
                    ? 'ring-2 ring-primary shadow-2xl' 
                    : 'hover:shadow-xl'
                }`}
                onClick={() => setActiveMethod(activeMethod === method.id ? null : method.id)}
                whileHover={{ scale: activeMethod === method.id ? 1 : 1.02 }}
                layout
              >
                {/* Card Header */}
                <div className={`relative p-8 bg-gradient-to-br ${method.gradient} text-white`}>
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.15"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    }}
                  />
                  
                  <div className="relative z-10">
                    <motion.div 
                      className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <method.icon className="w-8 h-8" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold mb-2">{method.title}</h3>
                    
                    <motion.div 
                      className="flex items-center gap-2 text-white/80"
                      animate={{ y: activeMethod === method.id ? 0 : [0, 3, 0] }}
                      transition={{ duration: 2, repeat: activeMethod === method.id ? 0 : Infinity }}
                    >
                      <span className="text-sm">Clique para ver mais</span>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-300 ${
                          activeMethod === method.id ? 'rotate-180' : ''
                        }`} 
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Expandable Content */}
                <AnimatePresence>
                  {activeMethod === method.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden bg-card"
                    >
                      <div className="p-6">
                        <motion.p 
                          className="text-muted-foreground mb-6"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          {method.description}
                        </motion.p>

                        <motion.div 
                          className="flex flex-wrap gap-2 mb-6"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {method.features.map((feature, i) => (
                            <motion.span
                              key={feature}
                              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 + i * 0.1 }}
                            >
                              {feature}
                            </motion.span>
                          ))}
                        </motion.div>

                        <motion.div
                          className="rounded-2xl overflow-hidden"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <img
                            src={method.image}
                            alt={method.title}
                            className="w-full h-48 object-cover"
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
