"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, Wallet } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ThemeToggle } from "../shared/themeToggle";
import { Button } from "../ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "Recursos", href: "/#features" },
  { label: "Como Funciona", href: "/#how-it-works" },
  { label: "Depoimentos", href: "/#testimonials" },
  { label: "Preços", href: "/#pricing" },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLinkClick = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <motion.div
      initial={false}
      animate={{ 
        height: isOpen ? "calc(100vh - 64px)" : 0,
        opacity: isOpen ? 1 : 0 
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-16 left-0 right-0 md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 overflow-hidden z-40"
      style={{ backdropFilter: "blur(10px)" }}
      aria-hidden={!isOpen}
    >
      <div className="container mx-auto px-4 py-6 flex flex-col gap-3">
        {NAV_LINKS.map((link) => (
          <Link
            key={`mobile-${link.label}`}
            href={link.href}
            className={cn(
              "text-lg text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg transition-colors",
              "hover:text-[#007cca] dark:hover:text-[#00cfec] hover:bg-gray-100 dark:hover:bg-gray-800",
              "focus:outline-none focus:ring-2 focus:ring-[#007cca] focus:ring-offset-2"
            )}
            onClick={handleLinkClick}
            aria-label={`Navegar para ${link.label}`}
          >
            {link.label}
          </Link>
        ))}
        
        <div className="flex flex-col gap-3 pt-6 mt-4 border-t border-gray-200 dark:border-gray-800">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleLinkClick}
          >
            Entrar
          </Button>
          <Button 
            className="w-full bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90 transition-opacity"
            onClick={handleLinkClick}
          >
            Começar Grátis
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const DesktopNavLinks = () => {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-6 lg:gap-8">
      {NAV_LINKS.map((link, index) => (
        <motion.div
          key={`desktop-${link.label}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link
            href={link.href}
            className={cn(
              "relative text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
              "transition-colors duration-300 font-medium text-sm lg:text-base",
              "group py-2"
            )}
            aria-label={`Navegar para ${link.label}`}
          >
            {link.label}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#00cfec] to-[#007cca] group-hover:w-full transition-all duration-300" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const navbarStyles = {
    background: isScrolled 
      ? "rgba(255, 255, 255, 0.95) dark:rgba(17, 24, 39, 0.95)"
      : "transparent",
    backdropFilter: isScrolled ? "blur(10px)" : "none",
    borderBottom: isScrolled 
      ? "1px solid rgba(0, 0, 0, 0.1) dark:1px solid rgba(255, 255, 255, 0.1)"
      : "none",
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={navbarStyles}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2"
            >
              <Link 
                href="/" 
                className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#007cca] focus:ring-offset-2 rounded-lg p-1"
                aria-label="Voltar para página inicial"
              >
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-r from-[#00cfec] to-[#007cca] flex items-center justify-center shadow-lg">
                  <Wallet className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#007cca] to-[#00cfec] bg-clip-text text-transparent">
                  becash
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <DesktopNavLinks />

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Entrar
              </Button>
              <Button 
                className="bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:shadow-lg transition-all duration-300"
              >
                Começar Grátis
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={toggleMenu}
                className="p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#007cca]"
                aria-expanded={isOpen}
                aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
              >
                {isOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isOpen} onClose={closeMenu} />

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
};