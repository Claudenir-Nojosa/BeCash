// components/FAQ.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: "Como o BeCash protege meus dados financeiros?",
    answer: "Utilizamos criptografia de banco com padrão AES-256, autenticação de dois fatores e seguimos todas as regulamentações LGPD. Seus dados nunca são compartilhados com terceiros sem sua autorização.",
    color: "border-[#00cfec]/20 dark:border-[#00cfec]/30"
  },
  {
    question: "A IA realmente faz recomendações personalizadas?",
    answer: "Sim! Nossa IA analisa seus padrões de gastos, objetivos financeiros e perfil de risco para criar recomendações únicas. Ela aprende continuamente com seu comportamento para melhorar as sugestões.",
    color: "border-[#007cca]/20 dark:border-[#007cca]/30"
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim, você pode cancelar seu plano a qualquer momento sem taxas ou multas. Se cancelar durante o período de teste gratuito, não será cobrado.",
    color: "border-[#5665ba]/20 dark:border-[#5665ba]/30"
  },
  {
    question: "Quais bancos são compatíveis?",
    answer: "Somos compatíveis com todos os principais bancos brasileiros e várias corretoras. A lista completa está disponível durante o processo de conexão.",
    color: "border-[#00cfec]/20 dark:border-[#00cfec]/30"
  },
  {
    question: "Como funciona o suporte?",
    answer: "Oferecemos suporte por chat 24/7 para todos os usuários, com resposta em menos de 5 minutos para planos Pro e Empresas.",
    color: "border-[#007cca]/20 dark:border-[#007cca]/30"
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Perguntas <span className="text-[#007cca] dark:text-[#00cfec]">frequentes</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tire suas dúvidas sobre a plataforma BeCash
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`mb-4 rounded-xl border-2 ${faq.color} bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 overflow-hidden transition-all`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  {openIndex === index ? (
                    <Minus className="w-6 h-6 text-[#007cca] dark:text-[#00cfec]" />
                  ) : (
                    <Plus className="w-6 h-6 text-[#007cca] dark:text-[#00cfec]" />
                  )}
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 pt-2">
                      <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-[#00cfec]/10 via-[#007cca]/10 to-[#5665ba]/10 dark:from-[#00cfec]/20 dark:via-[#007cca]/20 dark:to-[#5665ba]/20 rounded-2xl p-8 md:p-12 transition-colors">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ainda tem dúvidas?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Nossa equipe está pronta para ajudar você a começar sua jornada financeira.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[#00cfec] to-[#007cca] hover:shadow-lg dark:hover:shadow-[0_10px_25px_rgba(0,207,236,0.3)] transition-shadow"
              >
                Falar com Especialista
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-lg font-semibold border-2 border-[#007cca] dark:border-[#00cfec] text-[#007cca] dark:text-[#00cfec] hover:bg-[#007cca]/5 dark:hover:bg-[#00cfec]/10 transition-colors"
              >
                Ver Tutorials
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}