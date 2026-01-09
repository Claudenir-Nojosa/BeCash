import { motion } from "framer-motion";

const technologies = [
  { name: "Claude", logo: "🤖", color: "from-orange-500 to-amber-500" },
  { name: "Meta API", logo: "📱", color: "from-blue-600 to-blue-400" },
  { name: "Next.js", logo: "▲", color: "from-gray-900 to-gray-600 dark:from-white dark:to-gray-300" },
  { name: "Prisma", logo: "◇", color: "from-indigo-600 to-purple-500" },
  { name: "OpenAI", logo: "🧠", color: "from-emerald-500 to-teal-400" },
  { name: "Auth.js", logo: "🔐", color: "from-violet-600 to-purple-500" },
  { name: "Tailwind", logo: "🎨", color: "from-cyan-500 to-blue-500" },
  { name: "Supabase", logo: "⚡", color: "from-green-500 to-emerald-400" },
];

const TechCard = ({ tech, index }: { tech: typeof technologies[0]; index: number }) => (
  <motion.div
    className="flex-shrink-0 mx-4"
    whileHover={{ scale: 1.1, y: -5 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
  >
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${tech.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-300`} />
      <div className="relative glass rounded-2xl px-8 py-6 flex flex-col items-center gap-3 border border-border/50 hover:border-primary/50 transition-all duration-300">
        <motion.span 
          className="text-4xl"
          animate={{ 
            rotate: [0, 5, -5, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            delay: index * 0.2 
          }}
        >
          {tech.logo}
        </motion.span>
        <span className="text-sm font-semibold text-foreground whitespace-nowrap">
          {tech.name}
        </span>
      </div>
    </div>
  </motion.div>
);

export const TechCarousel = () => {
  return (
    <section className="py-20 overflow-hidden bg-secondary/30">
      <div className="container mx-auto px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.span 
            className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
          >
            Tecnologias de Ponta
          </motion.span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Construído com{" "}
            <span className="gradient-text">Ferramentas de Qualidade</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Utilizamos as melhores tecnologias do mercado para garantir uma experiência excepcional
          </p>
        </motion.div>
      </div>

      {/* Infinite Carousel */}
      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-secondary/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-secondary/30 to-transparent z-10 pointer-events-none" />

        {/* First Row - Left to Right */}
        <motion.div
          className="flex"
          animate={{ x: [0, -1920] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
        >
          {[...technologies, ...technologies, ...technologies, ...technologies].map((tech, index) => (
            <TechCard key={`row1-${index}`} tech={tech} index={index % technologies.length} />
          ))}
        </motion.div>

        {/* Second Row - Right to Left */}
        <motion.div
          className="flex mt-6"
          animate={{ x: [-1920, 0] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 35,
              ease: "linear",
            },
          }}
        >
          {[...technologies.reverse(), ...technologies, ...technologies, ...technologies].map((tech, index) => (
            <TechCard key={`row2-${index}`} tech={tech} index={index % technologies.length} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
