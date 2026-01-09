// components/Testimonials.tsx
'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatarColor: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Mariana Silva",
    role: "Empreendedora",
    content: "A IA do BeCash identificou padrões nos meus gastos que eu nunca tinha percebido. Economizei 30% no primeiro mês!",
    rating: 5,
    avatarColor: "from-[#00cfec] to-[#00cfec]/70"
  },
  {
    name: "Roberto Santos",
    role: "Investidor",
    content: "As recomendações de investimento são impressionantes. Minha carteira cresceu 15% em 6 meses seguindo as sugestões da IA.",
    rating: 5,
    avatarColor: "from-[#007cca] to-[#007cca]/70"
  },
  {
    name: "Camila Oliveira",
    role: "Gerente Financeira",
    content: "Finalmente uma plataforma que une controle financeiro e investimentos de forma inteligente. Revolucionou minha vida financeira.",
    rating: 5,
    avatarColor: "from-[#5665ba] to-[#5665ba]/70"
  }
];

interface StatItemProps {
  value: string;
  label: string;
}

const StatItem = ({ value, label }: StatItemProps) => (
  <div className="text-center">
    <div className="text-4xl font-bold text-gray-900 dark:text-white">{value}</div>
    <div className="text-gray-600 dark:text-gray-400">{label}</div>
  </div>
);

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

const TestimonialCard = ({ testimonial, index }: TestimonialCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ delay: index * 0.2, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      className="relative group"
    >
      <div className="absolute -top-4 -left-4">
        <Quote 
          className="w-12 h-12 text-gray-200 dark:text-gray-700" 
          aria-hidden="true"
        />
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg dark:shadow-xl border border-gray-100 dark:border-gray-700 relative z-10 transition-all duration-300 group-hover:shadow-2xl">
        <div className="flex items-center mb-6" aria-label={`Avaliação: ${testimonial.rating} estrelas`}>
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star 
              key={i} 
              className="w-5 h-5 text-yellow-400 fill-current" 
              aria-hidden="true"
            />
          ))}
        </div>
        
        <blockquote className="mb-8">
          <p className="text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed">
            &ldquo;{testimonial.content}&rdquo;
          </p>
        </blockquote>
        
        <div className="flex items-center">
          <div 
            className={`w-12 h-12 rounded-full bg-gradient-to-r ${testimonial.avatarColor} mr-4`}
            aria-hidden="true"
          />
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">
              {testimonial.name}
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              {testimonial.role}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Testimonials() {
  const sectionRef = useRef(null);
  const isSectionInView = useInView(sectionRef, { once: true, amount: 0.1 });

  const stats = [
    { value: "50K+", label: "Usuários ativos" },
    { value: "R$500M+", label: "Em ativos gerenciados" },
    { value: "4.9", label: "Avaliação média" }
  ];

  return (
    <section 
      id="depoimentos" 
      ref={sectionRef}
      className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 transition-colors scroll-mt-20"
      aria-labelledby="testimonials-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 
            id="testimonials-heading"
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            O que nossos <span className="text-[#007cca] dark:text-[#00cfec]">usuários dizem</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que transformaram suas finanças
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={testimonial.name} 
              testimonial={testimonial} 
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isSectionInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-20"
        >
          <div 
            className="inline-flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 w-full"
            aria-label="Estatísticas"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.7 + (index * 0.1) }}
              >
                <StatItem value={stat.value} label={stat.label} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}