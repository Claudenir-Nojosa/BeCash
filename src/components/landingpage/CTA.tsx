import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../ui/button";

export const CTA = () => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto text-center"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 gradient-bg rounded-3xl opacity-10 blur-2xl scale-110" />

          {/* Content Card */}
          <div className="relative glass rounded-3xl p-8 md:p-16 overflow-hidden">
            {/* Floating Sparkles */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-8 right-8"
            >
              <Sparkles className="w-8 h-8 text-primary/30" />
            </motion.div>
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute bottom-8 left-8"
            >
              <Sparkles className="w-6 h-6 text-accent/30" />
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-sm font-medium mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Comece grátis, sem cartão de crédito
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pronto para{" "}
              <span className="gradient-text">transformar suas finanças</span>?
            </h2>

            <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
              Junte-se a milhares de brasileiros que já estão economizando mais e
              construindo um futuro financeiro mais seguro com o becash.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="gradient-bg text-primary-foreground glow px-8 py-6 text-lg font-semibold hover:opacity-90 transition-all group"
              >
                Criar Conta Grátis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-semibold glass hover:bg-secondary/50"
              >
                Falar com Vendas
              </Button>
            </div>

            {/* Trust Text */}
            <p className="text-sm text-muted-foreground mt-8">
              ✨ Mais de 10.000 usuários confiam no becash
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
