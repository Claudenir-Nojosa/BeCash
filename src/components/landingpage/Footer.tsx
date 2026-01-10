import { motion } from "framer-motion";
import { Wallet, Github, Twitter, Linkedin, Instagram } from "lucide-react";
import Image from "next/image";

const footerLinks = {
  produto: [
    { label: "Recursos", href: "#features" },
    { label: "Preços", href: "#pricing" },
    { label: "Segurança", href: "#" },
    { label: "Integrações", href: "#" },
  ],
  empresa: [
    { label: "Sobre Nós", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Carreiras", href: "#" },
    { label: "Contato", href: "#" },
  ],
  legal: [
    { label: "Privacidade", href: "#" },
    { label: "Termos", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

const socialLinks = [
  { Icon: Twitter, href: "#" },
  { Icon: Instagram, href: "#" },
  { Icon: Linkedin, href: "#" },
  { Icon: Github, href: "#" },
];

export const Footer = () => {
  return (
    <footer className="py-16 relative overflow-hidden bg-background">


      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="lg:col-span-2">
            <motion.a
              href="#"
              className="flex items-center gap-2 mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <Image
                  src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
                  alt="BeCash Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-[#00cfec] to-[#007cca] bg-clip-text text-transparent">
                becash
              </span>
            </motion.a>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm text-sm md:text-base leading-relaxed">
              Seu assistente financeiro inteligente. Economize mais, invista
              melhor e alcance seus objetivos.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ Icon, href }, index) => (
                <motion.a
                  key={index}
                  href={href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-800/60 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-[#007cca] dark:hover:text-[#00cfec] transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white text-sm">
              Produto
            </h4>
            <ul className="space-y-3">
              {footerLinks.produto.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-[#007cca] dark:hover:text-[#00cfec] transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white text-sm">
              Empresa
            </h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-[#007cca] dark:hover:text-[#00cfec] transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white text-sm">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-[#007cca] dark:hover:text-[#00cfec] transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200/60 dark:border-gray-800/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            © 2026 becash. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
