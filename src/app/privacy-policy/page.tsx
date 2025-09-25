"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Lock,
  Eye,
  Mail,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

const PrivacyPolicy = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-indigo-900/30 sticky top-0 bg-gray-950/90 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-medium tracking-tight flex items-center gap-2 text-white"
          >
            <Image
              src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
              alt="BeCash Logo"
              width={40}
              height={40}
            />
            BeCash
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-indigo-300/80 hover:text-indigo-200 transition-all duration-200 text-sm font-medium"
            >
              Início
            </Link>
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
              <Link
                href="/"
                className="text-indigo-300/80 hover:text-indigo-200 transition-all duration-200 text-sm font-medium py-2"
              >
                Início
              </Link>
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

      {/* Main Content */}
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-indigo-900/20 border border-indigo-800/30">
                <Shield className="text-indigo-400" size={40} />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight">
              Política de{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                Privacidade
              </span>
            </h1>
            <p className="mt-4 text-indigo-200/70 max-w-2xl mx-auto">
              Última atualização: 25 de janeiro de 2025
            </p>
          </div>

          <div className="bg-gradient-to-b from-indigo-900/10 to-indigo-900/5 border border-indigo-800/30 rounded-2xl p-8">
            {/* Introduction */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                1. Introdução
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                A BeCash valoriza a privacidade e a segurança dos dados dos
                nossos usuários. Esta Política de Privacidade descreve como
                coletamos, usamos, armazenamos e protegemos suas informações
                quando você utiliza nossos serviços. Ao acessar ou usar a
                plataforma BeCash, você concorda com os termos desta política.
              </p>
            </section>

            {/* Information Collection */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                2. Informações que Coletamos
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-900/30 rounded-lg mt-1">
                    <Eye className="text-indigo-400" size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-indigo-200 mb-2">
                      Informações Pessoais
                    </h3>
                    <ul className="text-indigo-300/80 space-y-2 list-disc pl-5">
                      <li>Nome completo, e-mail e dados de contato</li>
                      <li>Informações de perfil e preferências de uso</li>
                      <li>Dados de autenticação e acesso</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-900/30 rounded-lg mt-1">
                    <Lock className="text-indigo-400" size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-indigo-200 mb-2">
                      Dados Financeiros
                    </h3>
                    <ul className="text-indigo-300/80 space-y-2 list-disc pl-5">
                      <li>Informações de contas bancárias conectadas</li>
                      <li>Transações financeiras e histórico de gastos</li>
                      <li>Metas financeiras e orçamentos definidos</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-900/30 rounded-lg mt-1">
                    <Shield className="text-indigo-400" size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-indigo-200 mb-2">
                      Dados Técnicos
                    </h3>
                    <ul className="text-indigo-300/80 space-y-2 list-disc pl-5">
                      <li>Endereço IP, tipo de navegador e dispositivo</li>
                      <li>Logs de acesso e atividade na plataforma</li>
                      <li>Cookies e tecnologias similares</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Use of Information */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                3. Como Utilizamos Suas Informações
              </h2>
              <p className="text-indigo-300/80 leading-relaxed mb-4">
                Utilizamos suas informações para os seguintes propósitos:
              </p>
              <ul className="text-indigo-300/80 space-y-2 list-disc pl-5">
                <li>Fornecer, operar e manter nossos serviços</li>
                <li>Personalizar sua experiência na plataforma</li>
                <li>Processar transações e gerenciar contas</li>
                <li>Enviar comunicações importantes sobre o serviço</li>
                <li>Melhorar nossos produtos e desenvolver novos recursos</li>
                <li>Garantir a segurança e prevenir atividades fraudulentas</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                4. Compartilhamento de Informações
              </h2>
              <p className="text-indigo-300/80 leading-relaxed mb-4">
                Não vendemos suas informações pessoais. Podemos compartilhar
                dados apenas nas seguintes situações:
              </p>
              <ul className="text-indigo-300/80 space-y-2 list-disc pl-5">
                <li>Com seu consentimento explícito</li>
                <li>
                  Com provedores de serviços que nos auxiliam na operação da
                  plataforma
                </li>
                <li>
                  Para cumprir obrigações legais ou responder a solicitações
                  governamentais
                </li>
                <li>Em caso de fusão, aquisição ou venda de ativos</li>
                <li>
                  Para proteger nossos direitos, propriedade ou segurança, e dos
                  nossos usuários
                </li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                5. Segurança dos Dados
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais
                robustas para proteger suas informações:
              </p>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                  <h4 className="font-medium text-indigo-200 mb-2">
                    Criptografia Avançada
                  </h4>
                  <p className="text-sm text-indigo-300/70">
                    Seus dados são criptografados em trânsito e em repouso
                    usando tecnologias de última geração.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                  <h4 className="font-medium text-indigo-200 mb-2">
                    Acesso Controlado
                  </h4>
                  <p className="text-sm text-indigo-300/70">
                    Limitamos o acesso às informações pessoais apenas a
                    funcionários autorizados.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                  <h4 className="font-medium text-indigo-200 mb-2">
                    Monitoramento Contínuo
                  </h4>
                  <p className="text-sm text-indigo-300/70">
                    Monitoramos nossos sistemas constantemente para detectar e
                    prevenir ameaças à segurança.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                  <h4 className="font-medium text-indigo-200 mb-2">
                    Conformidade com Regulamentações
                  </h4>
                  <p className="text-sm text-indigo-300/70">
                    Seguimos as melhores práticas e regulamentações de proteção
                    de dados aplicáveis.
                  </p>
                </div>
              </div>
            </section>

            {/* User Rights */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                6. Seus Direitos
              </h2>
              <p className="text-indigo-300/80 leading-relaxed mb-4">
                Você tem o direito de:
              </p>
              <ul className="text-indigo-300/80 space-y-2 list-disc pl-5">
                <li>Acessar e revisar suas informações pessoais</li>
                <li>Corrigir dados imprecisos ou incompletos</li>
                <li>Solicitar a exclusão de suas informações pessoais</li>
                <li>Revogar consentimentos previamente fornecidos</li>
                <li>Receber uma cópia de seus dados em formato legível</li>
                <li>
                  Opor-se ao processamento de seus dados em certas
                  circunstâncias
                </li>
              </ul>
              <p className="text-indigo-300/80 leading-relaxed mt-4">
                Para exercer esses direitos, entre em contato conosco através do
                e-mail:
                <a
                  href="mailto:privacidade@becash.com"
                  className="text-indigo-400 hover:text-indigo-300 ml-1"
                >
                  privacidade@becash.com
                </a>
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                7. Cookies e Tecnologias Similares
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Utilizamos cookies e tecnologias similares para melhorar sua
                experiência, analisar o uso da plataforma e personalizar
                conteúdo. Você pode gerenciar suas preferências de cookies
                através das configurações do seu navegador.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                8. Retenção de Dados
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Mantemos suas informações pessoais apenas pelo tempo necessário
                para cumprir os propósitos descritos nesta política, a menos que
                um período de retenção mais longo seja exigido ou permitido por
                lei.
              </p>
            </section>

            {/* International Transfers */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                9. Transferências Internacionais
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Seus dados podem ser processados em servidores localizados fora
                do seu país de residência. Garantimos que quaisquer
                transferências internacionais de dados sejam realizadas com
                medidas de proteção adequadas, em conformidade com as leis de
                proteção de dados aplicáveis.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                10. Privacidade de Crianças
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Nossos serviços não são destinados a menores de 18 anos. Não
                coletamos intencionalmente informações pessoais de crianças. Se
                tomarmos conhecimento de que coletamos dados de uma criança sem
                verificação do consentimento parental, tomaremos medidas para
                remover essas informações.
              </p>
            </section>

            {/* Policy Updates */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                11. Alterações nesta Política
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente.
                Notificaremos você sobre mudanças significativas publicando a
                nova política em nosso site ou enviando uma notificação direta.
                O uso continuado de nossos serviços após tais alterações
                constitui sua aceitação da nova política.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                12. Contato
              </h2>
              <p className="text-indigo-300/80 leading-relaxed mb-4">
                Se você tiver dúvidas sobre esta Política de Privacidade ou
                sobre como tratamos seus dados, entre em contato conosco:
              </p>
              <div className="flex items-center gap-2 text-indigo-400">
                <Mail size={18} />
                <a
                  href="mailto:privacidade@becash.com"
                  className="hover:text-indigo-300"
                >
                  privacidade@becash.com
                </a>
              </div>
            </section>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg text-white font-medium hover:from-indigo-500 hover:to-blue-500 transition-all duration-200"
            >
              Voltar para o Login <ArrowRight size={16} />
            </Link>
          </div>
        </div>
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
              <Link
                href="/terms"
                className="text-indigo-300/70 hover:text-indigo-200 transition-colors duration-200 text-sm"
              >
                Termos de Uso
              </Link>
              <span className="text-indigo-300/70 text-sm">
                Política de Privacidade
              </span>
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
            gestão financeira segura.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
