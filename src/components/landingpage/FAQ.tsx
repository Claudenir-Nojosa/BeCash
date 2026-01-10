"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
  return (
    <motion.div
      layout
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-800/60"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <motion.button
        className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-gradient-to-r from-[#00cfec]/5 to-[#007cca]/5 transition-colors"
        onClick={onClick}
      >
        <span className="font-semibold text-gray-900 dark:text-white pr-4 text-sm md:text-base">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-shrink-0"
        >
          {isOpen ? (
            <Minus className="w-5 h-5 text-[#007cca] dark:text-[#00cfec]" />
          ) : (
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-5 pt-2">
              <motion.p
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base"
              >
                {answer}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FAQ = () => {
  const { t } = useTranslation(["faq", "common"]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Fallback direto sem chamadas dinâmicas problemáticas
  const getFAQData = () => {
    // Se não houver tradução, usa os valores hardcoded
    const fallbackData = [
      {
        question: "Como funciona o BeCash?",
        answer: "O BeCash é um assistente financeiro inteligente que analisa seus gastos, identifica padrões e oferece recomendações personalizadas. Conecte suas contas bancárias de forma segura e deixe nossa IA fazer o trabalho pesado de organizar e otimizar suas finanças.",
      },
      {
        question: "Meus dados financeiros estão seguros?",
        answer: "Sim! Utilizamos criptografia de nível bancário (256-bit SSL) e nunca armazenamos suas credenciais de acesso. Somos certificados pela PCI DSS e seguimos rigorosamente a LGPD. Seus dados são exclusivamente seus e jamais são compartilhados com terceiros.",
      },
      {
        question: "Quais bancos são compatíveis?",
        answer: "Trabalhamos com mais de 300 instituições financeiras brasileiras, incluindo Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Caixa, Inter, C6 Bank e muitos outros. A integração é feita via Open Banking, garantindo segurança máxima.",
      },
      {
        question: "Posso cancelar minha assinatura a qualquer momento?",
        answer: "Sim, sem burocracia! Você pode cancelar sua assinatura a qualquer momento direto no aplicativo. Não há taxas de cancelamento e você continuará com acesso aos recursos até o final do período pago.",
      },
      {
        question: "Como funciona o período de teste gratuito?",
        answer: "Oferecemos 14 dias de teste gratuito com acesso completo a todos os recursos premium. Não é necessário cartão de crédito para começar. Após o período de teste, você escolhe se deseja continuar com um dos nossos planos.",
      },
      {
        question: "O BeCash funciona em dispositivos móveis?",
        answer: "Sim! Temos aplicativos nativos para iOS e Android, além da versão web. Seus dados são sincronizados em tempo real entre todos os dispositivos, permitindo que você gerencie suas finanças de qualquer lugar.",
      },
      {
        question: "Como funciona a análise de IA?",
        answer: "Nossa inteligência artificial analisa seus padrões de gastos, compara com benchmarks do mercado e identifica oportunidades de economia. Ela aprende com seu comportamento e oferece insights cada vez mais personalizados ao longo do tempo.",
      },
      {
        question: "Preciso de conhecimento financeiro para usar?",
        answer: "Não! O BeCash foi desenvolvido para ser intuitivo e acessível para todos. Nossa interface é simples e explicamos cada métrica de forma clara. Oferecemos também tutoriais e dicas educativas para quem deseja aprender mais sobre finanças pessoais.",
      },
    ];

    try {
      // Tenta pegar traduções, mas se falhar usa fallback
      const translatedData = [];
      for (let i = 1; i <= 8; i++) {
        const q = t(`faq:items.q${i}`, { defaultValue: fallbackData[i-1]?.question });
        const a = t(`faq:items.a${i}`, { defaultValue: fallbackData[i-1]?.answer });
        
        if (q && a) {
          translatedData.push({ question: q, answer: a });
        } else {
          translatedData.push(fallbackData[i-1]);
        }
      }
      return translatedData;
    } catch (error) {
      console.log("Error loading FAQ translations, using fallback:", error);
      return fallbackData;
    }
  };

  const faqData = getFAQData();

  // Textos principais com fallback
  const badgeText = t("faq:badge", { defaultValue: "Perguntas Frequentes" });
  const titlePart1 = t("faq:title.part1", { defaultValue: "Dúvidas?" });
  const titlePart2 = t("faq:title.part2", { defaultValue: "Nós temos as respostas" });
  const subtitleText = t("faq:subtitle", { defaultValue: "Confira as perguntas mais comuns sobre o BeCash. Não encontrou o que procura? Entre em contato conosco!" });
  const stillQuestions = t("faq:stillHaveQuestions", { defaultValue: "Ainda tem dúvidas?" });
  const contactSupport = t("faq:contactSupport", { defaultValue: "Fale com nosso suporte" });

  return (
    <section className="py-20 md:py-24 relative overflow-hidden bg-background" id="faq">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96">
          <div className="absolute top-0 left-2/3 w-96 h-96 bg-[#00cfec]/10 rounded-full blur-3xl" />
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              className="inline-block px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00cfec]/10 to-[#007cca]/10 text-[#007cca] dark:text-[#00cfec] text-xs font-medium mb-3 border border-[#00cfec]/20"
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {badgeText}
            </motion.span>

            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white tracking-tight">
              {titlePart1}{" "}
              <span className="bg-gradient-to-r from-[#00cfec] to-[#007cca] bg-clip-text text-transparent">
                {titlePart2}
              </span>
            </h2>

            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {subtitleText}
            </p>
          </motion.div>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqData.map((faq, index) => (
            <FAQItem
              key={`faq-${index}`}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => toggleFAQ(index)}
            />
          ))}
        </div>

        <motion.div
          className="text-center mt-10 md:mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            {stillQuestions}
          </p>
          <motion.a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-800/60 hover:bg-gradient-to-r from-[#00cfec]/5 to-[#007cca]/5 transition-colors font-medium text-gray-900 dark:text-white text-sm group"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {contactSupport}
            <ArrowRight className="w-4 h-4 text-[#007cca] dark:text-[#00cfec] group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};