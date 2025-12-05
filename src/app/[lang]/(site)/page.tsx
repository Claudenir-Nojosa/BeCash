"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PieChart,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Shield,
  CreditCard,
  Users,
  DollarSign,
  Calendar,
  Target,
  CheckCircle,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

const TeamLandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <BarChart3 className="text-indigo-400" size={24} />,
      title: "Análise Detalhada",
      description:
        "Visualize seus gastos por categoria e identifique oportunidades de economia.",
    },
    {
      icon: <Shield className="text-indigo-400" size={24} />,
      title: "Segurança Máxima",
      description:
        "Seus dados financeiros protegidos com criptografia de última geração.",
    },
    {
      icon: <CreditCard className="text-indigo-400" size={24} />,
      title: "Contas Integradas",
      description: "Conecte todas suas contas bancárias em um único lugar.",
    },
    {
      icon: <Target className="text-indigo-400" size={24} />,
      title: "Metas Personalizadas",
      description:
        "Estabeleça e acompanhe suas metas financeiras com facilidade.",
    },
  ];

  const plans = [
    {
      name: "Básico",
      price: "Gratuito",
      features: [
        "Até 2 contas bancárias",
        "Análise básica de gastos",
        "Metas simples",
        "Suporte por email",
      ],
    },
    {
      name: "Premium",
      price: "R$ 29,90/mês",
      features: [
        "Contas ilimitadas",
        "Análise avançada",
        "Metas personalizadas",
        "Relatórios detalhados",
        "Suporte prioritário",
      ],
    },
    {
      name: "Empresarial",
      price: "Sob consulta",
      features: [
        "Gestão de múltiplos usuários",
        "Relatórios corporativos",
        "Integração com ERP",
        "Suporte dedicado 24/7",
      ],
    },
  ];

  const faqs = [
    {
      question: "Meus dados financeiros estão seguros?",
      answer:
        "Sim, utilizamos criptografia de ponta a ponta e não compartilhamos seus dados com terceiros.",
    },
    {
      question: "Quanto tempo leva para configurar minha conta?",
      answer:
        "A configuração inicial é rápida e leva menos de 5 minutos para conectar suas primeiras contas.",
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer:
        "Sim, não há fidelidade e você pode cancelar seu plano premium a qualquer momento.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-indigo-900/30 sticky top-0 bg-gray-950/90 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
          <span className="text-xl font-medium tracking-tight flex items-center gap-2 text-white">
            <Image
              src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
              alt="BeCash Logo"
              width={40}
              height={40}
            />
            BeCash
          </span>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-indigo-300/80 hover:text-indigo-200 transition-all duration-200 text-sm font-medium"
            >
              Recursos
            </a>
            <a
              href="#pricing"
              className="text-indigo-300/80 hover:text-indigo-200 transition-all duration-200 text-sm font-medium"
            >
              Planos
            </a>
            <a
              href="#faq"
              className="text-indigo-300/80 hover:text-indigo-200 transition-all duration-200 text-sm font-medium"
            >
              FAQ
            </a>
            <Link
              href="/login"
              className="text-indigo-300/80 hover:text-indigo-200 transition-all duration-200 text-sm font-medium flex items-center gap-1"
            >
              ENTRAR <ArrowRight size={14} />
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-indigo-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4">
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-indigo-300/80 hover:text-indigo-200 transition-all duration-200 text-sm font-medium py-2"
              >
                Recursos
              </a>
              <a
                href="#pricing"
                className="text-indigo-300/80 hover:text-indigo-200 transition-all duration-200 text-sm font-medium py-2"
              >
                Planos
              </a>
              <a
                href="#faq"
                className="text-indigo-300/80 hover:text-indigo-200 transition-all duration-200 text-sm font-medium py-2"
              >
                FAQ
              </a>
              <Link
                href="/login"
                className="text-indigo-300/80 hover:text-indigo-200 transition-all duration-200 text-sm font-medium flex items-center gap-1 py-2"
              >
                ENTRAR <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-4 w-full">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-3 rounded-full bg-indigo-900/20 border border-indigo-800/30">
                  <Image
                    src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
                    alt="BeCash Logo"
                    width={80}
                    height={80}
                  />
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-none">
                CONTROLE{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                  FINANCEIRO
                </span>
              </h1>

              <p className="mt-6 text-lg text-indigo-200/80 max-w-2xl mx-auto">
                Domine suas finanças com ferramentas poderosas de análise e
                gestão. Tome decisões inteligentes e alcance sua liberdade
                financeira.
              </p>

              <div className="mt-8 max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

              <p className="mt-8 text-indigo-300/70 text-sm tracking-wide font-light">
                PLATAFORMA EXCLUSIVA • ACESSO SEGURO
              </p>

              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login"
                  className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-sm font-medium tracking-wide rounded text-white hover:from-indigo-500 hover:to-blue-500 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-indigo-500/10 justify-center"
                >
                  COMEÇAR AGORA <ArrowRight size={16} />
                </Link>
                <a
                  href="#features"
                  className="px-8 py-3.5 border border-indigo-700/50 text-sm font-medium tracking-wide rounded text-indigo-300 hover:border-indigo-500 transition-all duration-200 flex items-center gap-2 justify-center"
                >
                  SAIBA MAIS <ChevronDown size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gradient-to-b from-gray-950 to-indigo-950/20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-indigo-400">
                  50K+
                </div>
                <div className="text-sm text-indigo-300/70 mt-2">
                  Usuários Ativos
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-indigo-400">
                  R$ 1.2B
                </div>
                <div className="text-sm text-indigo-300/70 mt-2">
                  Em Transações
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-indigo-400">
                  94%
                </div>
                <div className="text-sm text-indigo-300/70 mt-2">
                  Satisfação dos Clientes
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-indigo-400">
                  24/7
                </div>
                <div className="text-sm text-indigo-300/70 mt-2">
                  Suporte Disponível
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light">
                Recursos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                  Poderosos
                </span>
              </h2>
              <p className="mt-4 text-indigo-200/70 max-w-2xl mx-auto">
                Tudo que você precisa para tomar controle total das suas
                finanças pessoais ou empresariais.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border border-indigo-800/30 bg-gradient-to-b from-indigo-900/10 to-indigo-900/5 transition-all duration-300 hover:border-indigo-700/50 ${activeFeature === index ? "border-indigo-700/50" : ""}`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-indigo-900/30 rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-indigo-200">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm text-indigo-300/70">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 bg-gradient-to-r from-indigo-900/20 to-blue-900/20 p-8 rounded-2xl border border-indigo-700/30">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-indigo-900/30 rounded-full">
                    <DollarSign className="text-indigo-400" size={32} />
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-medium text-indigo-200">
                    Relatórios Detalhados
                  </h3>
                  <p className="mt-2 text-indigo-300/70">
                    Acesse relatórios completos sobre seus gastos, receitas e
                    investimentos. Visualize gráficos interativos e exporte
                    dados para análise avançada.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href="/login"
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-sm font-medium tracking-wide rounded text-white hover:from-indigo-500 hover:to-blue-500 transition-all duration-200 flex items-center gap-2"
                  >
                    Experimentar <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="py-20 bg-gradient-to-b from-indigo-950/20 to-gray-950"
        >
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light">
                Planos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                  Acessíveis
                </span>
              </h2>
              <p className="mt-4 text-indigo-200/70 max-w-2xl mx-auto">
                Escolha o plano que melhor se adapta às suas necessidades
                financeiras.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`p-8 rounded-2xl border transition-all duration-300 ${index === 1 ? "border-indigo-700/50 bg-gradient-to-b from-indigo-900/20 to-indigo-900/10 scale-105 shadow-lg shadow-indigo-900/20" : "border-indigo-800/30 bg-gradient-to-b from-indigo-900/10 to-indigo-900/5"}`}
                >
                  <h3 className="text-2xl font-medium text-indigo-200">
                    {plan.name}
                  </h3>
                  <div className="mt-4 text-3xl font-bold text-indigo-400">
                    {plan.price}
                  </div>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle
                          className="text-indigo-500 mt-0.5 flex-shrink-0"
                          size={16}
                        />
                        <span className="text-sm text-indigo-300/80">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href="/login"
                      className={`w-full block text-center py-3 rounded-lg text-sm font-medium transition-all duration-200 ${index === 1 ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500" : "border border-indigo-700 text-indigo-300 hover:border-indigo-500"}`}
                    >
                      Começar Agora
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light">
                Perguntas{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                  Frequentes
                </span>
              </h2>
              <p className="mt-4 text-indigo-200/70 max-w-2xl mx-auto">
                Tire suas dúvidas sobre a plataforma BeCash.
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-indigo-800/30 bg-gradient-to-b from-indigo-900/10 to-indigo-900/5"
                >
                  <h3 className="text-lg font-medium text-indigo-200">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm text-indigo-300/70">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-indigo-300/70">Ainda tem dúvidas?</p>
              <a
                href="#"
                className="inline-block mt-2 text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
              >
                Fale com nosso time de suporte
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-indigo-900/30 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Image
                src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
                alt="BeCash Logo"
                width={60}
                height={60}
              />
              BeCash
            </div>

            <div className="flex gap-6 mt-6 md:mt-0">
              <a
                href="terms-of-service"
                className="text-indigo-300/70 hover:text-indigo-200 transition-colors duration-200 text-sm"
              >
                Termos
              </a>
              <a
              href="/privacy-policy"
                className="text-indigo-300/70 hover:text-indigo-200 transition-colors duration-200 text-sm"
              >
                Privacidade
              </a>
              <a
                href="#"
                className="text-indigo-300/70 hover:text-indigo-200 transition-colors duration-200 text-sm"
              >
                Contato
              </a>
            </div>
          </div>

          <div className="mt-8 text-center md:text-left text-xs text-indigo-400/40 tracking-wide">
            © 2025 BeCash — Todos os direitos reservados. Sua plataforma de
            gestão financeira.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TeamLandingPage;
