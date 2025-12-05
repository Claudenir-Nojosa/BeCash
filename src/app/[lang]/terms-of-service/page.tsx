"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

const TermsOfService = () => {
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
                <FileText className="text-indigo-400" size={40} />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight">
              Termos de{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                Serviço
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
                1. Aceitação dos Termos
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Ao acessar ou usar a plataforma BeCash, você concorda em ficar
                vinculado a estes Termos de Serviço. Se você não concordar com
                qualquer parte destes termos, não poderá utilizar nossos
                serviços.
              </p>
            </section>

            {/* Definitions */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                2. Definições
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle
                    className="text-indigo-500 mt-1 flex-shrink-0"
                    size={16}
                  />
                  <div>
                    <span className="text-indigo-200 font-medium">
                      Plataforma BeCash:
                    </span>
                    <span className="text-indigo-300/80">
                      {" "}
                      Serviços de gestão financeira oferecidos através do site e
                      aplicativos.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle
                    className="text-indigo-500 mt-1 flex-shrink-0"
                    size={16}
                  />
                  <div>
                    <span className="text-indigo-200 font-medium">
                      Usuário:
                    </span>
                    <span className="text-indigo-300/80">
                      {" "}
                      Pessoa física ou jurídica que utiliza nossos serviços.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle
                    className="text-indigo-500 mt-1 flex-shrink-0"
                    size={16}
                  />
                  <div>
                    <span className="text-indigo-200 font-medium">
                      Conteúdo:
                    </span>
                    <span className="text-indigo-300/80">
                      {" "}
                      Dados, informações, textos e outros materiais
                      disponibilizados na plataforma.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Account Registration */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                3. Registro de Conta
              </h2>
              <div className="space-y-4">
                <p className="text-indigo-300/80 leading-relaxed">
                  Para utilizar nossos serviços, você deve criar uma conta
                  fornecendo informações precisas e completas.
                </p>
                <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-lg p-4">
                  <h4 className="font-medium text-indigo-200 mb-2 flex items-center gap-2">
                    <Shield size={18} />
                    Responsabilidades da Conta
                  </h4>
                  <ul className="text-indigo-300/80 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      Você é responsável por manter a confidencialidade de suas
                      credenciais de acesso
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      Notifique-nos imediatamente sobre qualquer uso não
                      autorizado de sua conta
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      Mantenha suas informações de contato atualizadas
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Services Description */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                4. Descrição dos Serviços
              </h2>
              <p className="text-indigo-300/80 leading-relaxed mb-4">
                A BeCash oferece uma plataforma de gestão financeira que inclui:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                  <h4 className="font-medium text-indigo-200 mb-2">
                    Análise Financeira
                  </h4>
                  <p className="text-sm text-indigo-300/70">
                    Visualização de gastos por categoria e relatórios detalhados
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                  <h4 className="font-medium text-indigo-200 mb-2">
                    Integração Bancária
                  </h4>
                  <p className="text-sm text-indigo-300/70">
                    Conexão segura com instituições financeiras
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                  <h4 className="font-medium text-indigo-200 mb-2">
                    Metas Personalizadas
                  </h4>
                  <p className="text-sm text-indigo-300/70">
                    Estabelecimento e acompanhamento de objetivos financeiros
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                  <h4 className="font-medium text-indigo-200 mb-2">
                    Relatórios Avançados
                  </h4>
                  <p className="text-sm text-indigo-300/70">
                    Exportação de dados e análises personalizadas
                  </p>
                </div>
              </div>
            </section>

            {/* Acceptable Use */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                5. Uso Aceitável
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-indigo-200 mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-400" />
                    Condutas Permitidas
                  </h3>
                  <ul className="text-indigo-300/80 space-y-2 list-disc pl-5">
                    <li>
                      Utilizar a plataforma para gestão de finanças pessoais ou
                      empresariais
                    </li>
                    <li>
                      Compartilhar relatórios com seu contador ou consultor
                      financeiro
                    </li>
                    <li>
                      Usar os dados para tomada de decisões financeiras
                      informadas
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-indigo-200 mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-yellow-400" />
                    Condutas Proibidas
                  </h3>
                  <ul className="text-indigo-300/80 space-y-2 list-disc pl-5">
                    <li>
                      Utilizar a plataforma para atividades ilegais ou
                      fraudulentas
                    </li>
                    <li>Tentar acessar contas de outros usuários</li>
                    <li>
                      Reverse engineer, decompilar ou desmontar qualquer parte
                      da plataforma
                    </li>
                    <li>
                      Utilizar bots, scrapers ou outros métodos automatizados
                    </li>
                    <li>
                      Distribuir malware ou comprometer a segurança da
                      plataforma
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Payments and Subscriptions */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                6. Pagamentos e Assinaturas
              </h2>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-900/20 to-blue-900/20 p-4 rounded-lg border border-indigo-800/30">
                  <h4 className="font-medium text-indigo-200 mb-2">
                    Planos de Assinatura
                  </h4>
                  <p className="text-indigo-300/80 text-sm">
                    Oferecemos diferentes planos de assinatura com
                    funcionalidades específicas. Os valores e condições estão
                    disponíveis em nossa página de planos.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                    <h4 className="font-medium text-indigo-200 mb-2">
                      Renovação Automática
                    </h4>
                    <p className="text-sm text-indigo-300/70">
                      As assinaturas são renovadas automaticamente no final de
                      cada período
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                    <h4 className="font-medium text-indigo-200 mb-2">
                      Cancelamento
                    </h4>
                    <p className="text-sm text-indigo-300/70">
                      Você pode cancelar a qualquer momento através das
                      configurações da conta
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-200 mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Reembolsos
                  </h4>
                  <p className="text-yellow-300/80 text-sm">
                    Não oferecemos reembolsos por períodos parciais de
                    assinatura. O cancelamento efetiva-se no final do período
                    atual.
                  </p>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                7. Propriedade Intelectual
              </h2>
              <p className="text-indigo-300/80 leading-relaxed mb-4">
                Todos os direitos de propriedade intelectual relacionados à
                plataforma BeCash são de nossa propriedade ou de nossos
                licenciadores.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle
                    className="text-indigo-500 mt-1 flex-shrink-0"
                    size={16}
                  />
                  <span className="text-indigo-300/80">
                    Você mantém a propriedade dos seus dados financeiros
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle
                    className="text-indigo-500 mt-1 flex-shrink-0"
                    size={16}
                  />
                  <span className="text-indigo-300/80">
                    Concedemos uma licença limitada para uso da plataforma
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle
                    className="text-indigo-500 mt-1 flex-shrink-0"
                    size={16}
                  />
                  <span className="text-indigo-300/80">
                    Não é permitido o uso comercial de nossa marca ou conteúdo
                  </span>
                </div>
              </div>
            </section>

            {/* User Content */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                8. Conteúdo do Usuário
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Você é responsável pelo conteúdo que insere na plataforma. Ao
                enviar dados, você nos concede a licença necessária para
                processar e exibir essas informações em conformidade com nossa
                Política de Privacidade.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                9. Rescisão
              </h2>
              <p className="text-indigo-300/80 leading-relaxed mb-4">
                Podemos suspender ou encerrar sua conta em caso de violação
                destes termos:
              </p>
              <ul className="text-indigo-300/80 space-y-2 list-disc pl-5">
                <li>Uso não autorizado da plataforma</li>
                <li>Atividades fraudulentas ou ilegais</li>
                <li>Violacao de direitos de propriedade intelectual</li>
                <li>
                  Qualquer conduta que prejudique outros usuários ou a
                  plataforma
                </li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                10. Isenção de Responsabilidade
              </h2>

              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-200 mb-2 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Aviso Importante
                </h4>
                <p className="text-red-300/80 text-sm">
                  A BeCash é uma ferramenta de gestão financeira e não oferece
                  aconselhamento financeiro profissional. As decisões de
                  investimento e gestão financeira são de sua exclusiva
                  responsabilidade.
                </p>
              </div>

              <p className="text-indigo-300/80 leading-relaxed">
                A plataforma é fornecida "no estado em que se encontra". Não
                garantimos que o serviço será ininterrupto ou livre de erros.
                Não nos responsabilizamos por perdas financeiras resultantes do
                uso da plataforma.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                11. Limitação de Responsabilidade
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Em nenhum caso a BeCash será responsável por danos indiretos,
                incidentais, especiais ou consequenciais resultantes do uso ou
                incapacidade de usar nossos serviços. Nossa responsabilidade
                total em qualquer caso não excederá o valor pago por você nos
                últimos 12 meses.
              </p>
            </section>

            {/* Modifications */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                12. Modificações dos Termos
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Reservamo-nos o direito de modificar estes Termos a qualquer
                momento. Notificaremos sobre mudanças significativas através do
                site ou por e-mail. O uso continuado após as modificações
                constitui aceitação dos novos termos.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-10">
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                13. Lei Aplicável
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Estes Termos são regidos pelas leis do Brasil. Qualquer disputa
                será resolvida nos tribunais da comarca de São Paulo/SP.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-medium text-indigo-200 mb-4">
                14. Contato
              </h2>
              <p className="text-indigo-300/80 leading-relaxed">
                Para questões sobre estes Termos de Serviço, entre em contato
                conosco:
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300/80">
                  <span className="text-indigo-200 font-medium">E-mail:</span>
                  <a
                    href="mailto:legal@becash.com"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    legal@becash.com
                  </a>
                </div>
                <div className="flex items-center gap-2 text-indigo-300/80">
                  <span className="text-indigo-200 font-medium">Endereço:</span>
                  <span>Av. Paulista, 1000 - São Paulo/SP, Brasil</span>
                </div>
              </div>
            </section>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center space-y-4">
            <p className="text-indigo-300/70">
              Ao utilizar nossa plataforma, você confirma que leu e concorda com
              estes Termos de Serviço.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg text-white font-medium hover:from-indigo-500 hover:to-blue-500 transition-all duration-200"
              >
                Aceitar e Continuar <ArrowRight size={16} />
              </Link>
              <Link
                href="/privacy-policy"
                className="inline-flex items-center gap-2 px-6 py-3 border border-indigo-700/50 rounded-lg text-indigo-300 font-medium hover:border-indigo-500 transition-all duration-200"
              >
                Ver Política de Privacidade
              </Link>
            </div>
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
                Termos de Serviço
              </Link>
              <Link
                href="/privacy-policy"
                className="text-indigo-300/70 hover:text-indigo-200 transition-colors duration-200 text-sm"
              >
                Privacidade
              </Link>
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

export default TermsOfService;
