// app/onboarding/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Users,
  Instagram,
  TrendingUp,
  Target,
  Smartphone,
  MessageSquare,
  BarChart3,
  CreditCard,
  PieChart,
  Zap,
  Globe,
  Search,
  TvMinimalPlay,
  Ellipsis,
  HandCoins,
  NotebookPen,
  Divide,
  Handshake,
  ReceiptText,
  ScanEye,
  Goal,
  Tablet,
  LaptopMinimal,
} from "lucide-react";
import Image from "next/image";

// Traduções inline para evitar problemas de i18n
const translations = {
  en: {
    // Header
    "header.subtitle": "Personalize your experience",
    loading: "Preparing your onboarding...",

    // Progress
    "progress.label": "Onboarding progress",

    // Validation
    "validation.required": "Please select an option before continuing",
    "validation.maxSelections": "You can select up to {{max}} options",

    // Selection
    "selection.counter": "{{current}} of {{max}} selected",

    // Errors
    "errors.generic": "An error occurred. Please try again.",

    // Buttons
    "buttons.back": "Back",
    "buttons.continue": "Continue",
    "buttons.processing": "Processing...",
    "buttons.finishing": "Finishing...",
    "buttons.startUsing": "Start using BeCash!",

    // Footer
    "footer.message1":
      "Your answers help us create the best possible experience",
    "footer.message2":
      "All information is confidential and used only for personalization",

    // Confirmation
    "confirmation.title": "All set!",
    "confirmation.description":
      "Based on your answers, we'll personalize your BeCash experience.",
    "confirmation.review": "Review",
    "confirmation.letsGo": "Let's go!",

    // Questions
    "questions.source.title": "How did you hear about BeCash?",
    "questions.source.description": "Help us understand how you found us",
    "questions.source.options.referral": "Friend/family referral",
    "questions.source.options.social": "Social media",
    "questions.source.options.google": "Google/Online search",
    "questions.source.options.ads": "Online advertising",
    "questions.source.options.otherApp": "Another finance app",

    "questions.experience.title": "What's your finance experience level?",
    "questions.experience.description":
      "This helps us personalize your experience",
    "questions.experience.options.beginner": "Beginner • Just getting started",
    "questions.experience.options.intermediate":
      "Intermediate • Tried before but couldn't maintain",
    "questions.experience.options.advanced":
      "Advanced • Already use another app/system",
    "questions.experience.options.expert":
      "Expert • Work in finance or related field",

    "questions.difficulties.title": "What are your main financial challenges?",
    "questions.difficulties.description": "Select all that apply (max {{max}})",
    "questions.difficulties.options.dailyExpenses": "Control daily expenses",
    "questions.difficulties.options.planning": "Plan for the future",
    "questions.difficulties.options.sharing": "Split expenses with family",
    "questions.difficulties.options.organization":
      "Organize bills and payments",
    "questions.difficulties.options.understanding":
      "Understand where money goes",
    "questions.difficulties.options.budget": "Create and follow a budget",

    "questions.frequency.title": "How often will you use BeCash?",
    "questions.frequency.description":
      "This helps us prepare ideal notifications for you",
    "questions.frequency.options.daily": "Daily",
    "questions.frequency.options.dailyDesc": "Every day, multiple times a day",
    "questions.frequency.options.fewTimes": "Few times a week",
    "questions.frequency.options.fewTimesDesc": "2-3 times per week",
    "questions.frequency.options.weekly": "Weekly",
    "questions.frequency.options.weeklyDesc": "Once a week",
    "questions.frequency.options.monthly": "Monthly",
    "questions.frequency.options.monthlyDesc": "For monthly closing",
    "questions.frequency.options.whenNeeded": "When needed",
    "questions.frequency.options.whenNeededDesc": "Specific records only",

    "questions.devices.title": "Which devices will you use?",
    "questions.devices.description": "Select all that apply",
    "questions.devices.options.android": "Android phone",
    "questions.devices.options.iphone": "iPhone",
    "questions.devices.options.tablet": "Tablet",
    "questions.devices.options.computer": "Computer/Laptop",

    "questions.features.title": "Which features interest you most?",
    "questions.features.description":
      "Select up to {{max}} that catch your attention",
    "questions.features.options.quickEntry": "Quick expense entry",
    "questions.features.options.quickEntryDesc": "WhatsApp + AI to register",
    "questions.features.options.categories": "Category control",
    "questions.features.options.categoriesDesc": "Organize by expense type",
    "questions.features.options.expenseSharing": "Expense sharing",
    "questions.features.options.expenseSharingDesc":
      "With partner, family, friends",
    "questions.features.options.cards": "Cards and invoices",
    "questions.features.options.cardsDesc": "Complete credit control",
    "questions.features.options.goals": "Financial goals",
    "questions.features.options.goalsDesc": "Save for your objectives",
    "questions.features.options.reports": "Reports and charts",
    "questions.features.options.reportsDesc": "Visualize your patterns",
  },
  pt: {
    // Header
    "header.subtitle": "Personalize sua experiência",
    loading: "Preparando seu onboarding...",

    // Progress
    "progress.label": "Progresso do onboarding",

    // Validation
    "validation.required": "Por favor, selecione uma opção antes de continuar",
    "validation.maxSelections": "Você pode selecionar no máximo {{max}} opções",

    // Selection
    "selection.counter": "{{current}} de {{max}} selecionados",

    // Errors
    "errors.generic": "Ocorreu um erro. Tente novamente.",

    // Buttons
    "buttons.back": "Voltar",
    "buttons.continue": "Continuar",
    "buttons.processing": "Processando...",
    "buttons.finishing": "Finalizando...",
    "buttons.startUsing": "Começar a usar o BeCash!",

    // Footer
    "footer.message1":
      "Suas respostas nos ajudam a criar a melhor experiência possível",
    "footer.message2":
      "Todas as informações são confidenciais e usadas apenas para personalização",

    // Confirmation
    "confirmation.title": "Tudo pronto!",
    "confirmation.description":
      "Com base nas suas respostas, vamos personalizar sua experiência no BeCash.",
    "confirmation.review": "Revisar",
    "confirmation.letsGo": "Vamos lá!",

    // Questions
    "questions.source.title": "Como você conheceu o BeCash?",
    "questions.source.description":
      "Nos ajude a entender por onde você chegou até nós",
    "questions.source.options.referral": "Indicação de amigo/família",
    "questions.source.options.social": "Redes sociais",
    "questions.source.options.google": "Google/Busca online",
    "questions.source.options.ads": "Publicidade online",
    "questions.source.options.otherApp": "Outro app de finanças",

    "questions.experience.title": "Qual seu nível com finanças?",
    "questions.experience.description":
      "Isso nos ajuda a personalizar sua experiência",
    "questions.experience.options.beginner":
      "Iniciante • Estou começando agora",
    "questions.experience.options.intermediate":
      "Intermediário • Já tentei, mas não mantive",
    "questions.experience.options.advanced":
      "Avançado • Já uso outro app/sistema",
    "questions.experience.options.expert":
      "Especialista • Trabalho com finanças",

    "questions.difficulties.title": "Quais são suas principais dificuldades?",
    "questions.difficulties.description":
      "Selecione todas que se aplicam (máximo {{max}})",
    "questions.difficulties.options.dailyExpenses":
      "Controlar gastos do dia a dia",
    "questions.difficulties.options.planning": "Planejar para o futuro",
    "questions.difficulties.options.sharing": "Dividir despesas com família",
    "questions.difficulties.options.organization": "Organizar contas e boletos",
    "questions.difficulties.options.understanding":
      "Entender para onde vai o dinheiro",
    "questions.difficulties.options.budget": "Criar e seguir um orçamento",

    "questions.frequency.title": "Com que frequência pretende usar o BeCash?",
    "questions.frequency.description":
      "Isso nos ajuda a preparar notificações ideais para você",
    "questions.frequency.options.daily": "Diariamente",
    "questions.frequency.options.dailyDesc": "Todo dia, várias vezes ao dia",
    "questions.frequency.options.fewTimes": "Algumas vezes por semana",
    "questions.frequency.options.fewTimesDesc": "2-3 vezes por semana",
    "questions.frequency.options.weekly": "Semanalmente",
    "questions.frequency.options.weeklyDesc": "Uma vez por semana",
    "questions.frequency.options.monthly": "Mensalmente",
    "questions.frequency.options.monthlyDesc": "Para fechamento mensal",
    "questions.frequency.options.whenNeeded": "Quando precisar",
    "questions.frequency.options.whenNeededDesc":
      "Registros específicos apenas",

    "questions.devices.title": "Em quais dispositivos vai usar?",
    "questions.devices.description": "Selecione todos que usar",
    "questions.devices.options.android": "Celular Android",
    "questions.devices.options.iphone": "Celular iPhone",
    "questions.devices.options.tablet": "Tablet",
    "questions.devices.options.computer": "Computador/Notebook",

    "questions.features.title": "Quais funcionalidades mais te interessam?",
    "questions.features.description":
      "Selecione até {{max}} que mais chamam atenção",
    "questions.features.options.quickEntry": "Registro rápido de gastos",
    "questions.features.options.quickEntryDesc": "WhatsApp + IA para registrar",
    "questions.features.options.categories": "Controle por categorias",
    "questions.features.options.categoriesDesc": "Organize por tipo de gasto",
    "questions.features.options.expenseSharing": "Divisão de despesas",
    "questions.features.options.expenseSharingDesc":
      "Com parceiro, família, amigos",
    "questions.features.options.cards": "Cartões e faturas",
    "questions.features.options.cardsDesc": "Controle completo de crédito",
    "questions.features.options.goals": "Metas financeiras",
    "questions.features.options.goalsDesc": "Economize para seus objetivos",
    "questions.features.options.reports": "Relatórios e gráficos",
    "questions.features.options.reportsDesc": "Visualize seus padrões",
  },
};

interface Opcao {
  id: string;
  texto: string;
  descricao?: string;
  icone?: React.ReactNode;
  cor: string;
  gradient: string;
}

interface Pergunta {
  id: string;
  tipo: "single" | "multiple" | "text";
  pergunta: string;
  descricao?: string;
  opcoes: Opcao[];
  obrigatoria: boolean;
  maxSelecoes?: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [mostrarConfetti, setMostrarConfetti] = useState(false);
  const [carregandoPagina, setCarregandoPagina] = useState(true);
  const { data: session, status } = useSession();

  // Detecta o idioma da URL
  const getLanguageFromUrl = () => {
    const pathname = window.location.pathname;
    if (pathname.startsWith("/en/")) return "en";
    if (pathname.startsWith("/pt/")) return "pt";
    return "pt"; // default
  };

  const [lang, setLang] = useState<"en" | "pt">("pt");

  // Função de tradução simples
  const t = (key: string, options?: any): string => {
    const translation = translations[lang][key as keyof typeof translations.en];

    if (!translation) return key;

    if (options) {
      return Object.keys(options).reduce((acc, optionKey) => {
        return acc.replace(`{{${optionKey}}}`, options[optionKey]);
      }, translation);
    }

    return translation;
  };

  // Cria perguntas com traduções inline
  const perguntas: Pergunta[] = [
    {
      id: "fonte_conhecimento",
      tipo: "single",
      pergunta: t("questions.source.title"),
      descricao: t("questions.source.description"),
      opcoes: [
        {
          id: "indicacao",
          texto: t("questions.source.options.referral"),
          icone: <Users className="w-5 h-5" />,
          cor: "from-blue-500 to-cyan-500",
          gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
        },
        {
          id: "redes",
          texto: t("questions.source.options.social"),
          icone: <Instagram className="w-5 h-5" />,
          cor: "from-purple-500 to-pink-500",
          gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
        },
        {
          id: "google",
          texto: t("questions.source.options.google"),
          icone: <Search className="w-5 h-5" />,
          cor: "from-amber-500 to-orange-500",
          gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
        },
        {
          id: "ads",
          texto: t("questions.source.options.ads"),
          icone: <TvMinimalPlay className="w-5 h-5" />,
          cor: "from-green-500 to-emerald-500",
          gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
        },
        {
          id: "outro-app",
          texto: t("questions.source.options.otherApp"),
          icone: <Ellipsis className="w-5 h-5" />,
          cor: "from-rose-500 to-red-500",
          gradient: "bg-gradient-to-br from-rose-500 to-red-500",
        },
      ],
      obrigatoria: true,
    },
    {
      id: "experiencia_financas",
      tipo: "single",
      pergunta: t("questions.experience.title"),
      descricao: t("questions.experience.description"),
      opcoes: [
        {
          id: "iniciante",
          texto: t("questions.experience.options.beginner"),
          icone: (
            <Image src={"/icons/1-white.png"} alt="1" width={25} height={25} />
          ),
          cor: "",
          gradient: "bg-gradient-to-br from-blue-400 to-cyan-400",
        },
        {
          id: "intermediario",
          texto: t("questions.experience.options.intermediate"),
          icone: (
            <Image src={"/icons/2-whites.png"} alt="1" width={25} height={25} />
          ),
          cor: "",
          gradient: "bg-gradient-to-br from-blue-500 to-indigo-500",
        },
        {
          id: "avancado",
          texto: t("questions.experience.options.advanced"),
          icone: (
            <Image src={"/icons/3-white.png"} alt="1" width={25} height={25} />
          ),
          cor: "",
          gradient: "bg-gradient-to-br from-indigo-500 to-purple-500",
        },
        {
          id: "especialista",
          texto: t("questions.experience.options.expert"),
          icone: (
            <Image
              src={"/icons/pro-white.png"}
              alt="1"
              width={25}
              height={25}
            />
          ),
          cor: "",
          gradient: "bg-gradient-to-br from-purple-500 to-violet-500",
        },
      ],
      obrigatoria: true,
    },
    {
      id: "principais_dores",
      tipo: "multiple",
      pergunta: t("questions.difficulties.title"),
      descricao: t("questions.difficulties.description", { max: 3 }),
      opcoes: [
        {
          id: "gastos-dia",
          texto: t("questions.difficulties.options.dailyExpenses"),
          icone: <HandCoins className="w-5 h-5" />,
          cor: "from-blue-600 to-blue-400",
          gradient: "bg-gradient-to-br from-blue-600 to-blue-400",
        },
        {
          id: "planejamento",
          texto: t("questions.difficulties.options.planning"),
          icone: <NotebookPen className="w-5 h-5" />,
          cor: "from-indigo-600 to-indigo-400",
          gradient: "bg-gradient-to-br from-indigo-600 to-indigo-400",
        },
        {
          id: "divisao",
          texto: t("questions.difficulties.options.sharing"),
          icone: <Handshake className="w-5 h-5" />,
          cor: "from-cyan-600 to-cyan-400",
          gradient: "bg-gradient-to-br from-cyan-600 to-cyan-400",
        },
        {
          id: "organizacao",
          texto: t("questions.difficulties.options.organization"),
          icone: <ReceiptText className="w-5 h-5" />,
          cor: "from-sky-600 to-sky-400",
          gradient: "bg-gradient-to-br from-sky-600 to-sky-400",
        },
        {
          id: "entendimento",
          texto: t("questions.difficulties.options.understanding"),
          icone: <ScanEye className="w-5 h-5" />,
          cor: "from-teal-600 to-teal-400",
          gradient: "bg-gradient-to-br from-teal-600 to-teal-400",
        },
        {
          id: "orcamento",
          texto: t("questions.difficulties.options.budget"),
          icone: <Goal className="w-5 h-5" />,
          cor: "from-emerald-600 to-emerald-400",
          gradient: "bg-gradient-to-br from-emerald-600 to-emerald-400",
        },
      ],
      obrigatoria: false,
      maxSelecoes: 3,
    },
    {
      id: "frequencia_uso",
      tipo: "single",
      pergunta: t("questions.frequency.title"),
      descricao: t("questions.frequency.description"),
      opcoes: [
        {
          id: "diariamente",
          texto: t("questions.frequency.options.daily"),
          descricao: t("questions.frequency.options.dailyDesc"),
          icone: (
            <Image
              src={"/icons/daily-white.png"}
              alt="1"
              width={25}
              height={25}
            />
          ),
          cor: "",
          gradient: "bg-gradient-to-br from-blue-700 to-blue-500",
        },
        {
          id: "algumas-vezes",
          texto: t("questions.frequency.options.fewTimes"),
          descricao: t("questions.frequency.options.fewTimesDesc"),
          icone: (
            <Image
              src={"/icons/sand-white.png"}
              alt="1"
              width={25}
              height={25}
            />
          ),
          cor: "from-indigo-700 to-indigo-500",
          gradient: "bg-gradient-to-br from-indigo-700 to-indigo-500",
        },
        {
          id: "semanal",
          texto: t("questions.frequency.options.weekly"),
          descricao: t("questions.frequency.options.weeklyDesc"),
          icone: (
            <Image
              src={"/icons/weekly-white.png"}
              alt="1"
              width={25}
              height={25}
            />
          ),
          cor: "from-cyan-700 to-cyan-500",
          gradient: "bg-gradient-to-br from-cyan-700 to-cyan-500",
        },
        {
          id: "mensal",
          texto: t("questions.frequency.options.monthly"),
          descricao: t("questions.frequency.options.monthlyDesc"),
          icone: (
            <Image
              src={"/icons/monthly-white.png"}
              alt="1"
              width={25}
              height={25}
            />
          ),
          cor: "from-sky-700 to-sky-500",
          gradient: "bg-gradient-to-br from-sky-700 to-sky-500",
        },
        {
          id: "especifico",
          texto: t("questions.frequency.options.whenNeeded"),
          descricao: t("questions.frequency.options.whenNeededDesc"),
          icone: (
            <Image
              src={"/icons/time-white.png"}
              alt="1"
              width={25}
              height={25}
            />
          ),
          cor: "from-teal-700 to-teal-500",
          gradient: "bg-gradient-to-br from-teal-700 to-teal-500",
        },
      ],
      obrigatoria: true,
    },
    {
      id: "dispositivo_principal",
      tipo: "multiple",
      pergunta: t("questions.devices.title"),
      descricao: t("questions.devices.description"),
      opcoes: [
        {
          id: "android",
          texto: t("questions.devices.options.android"),
          icone: <Smartphone className="w-5 h-5" />,
          cor: "from-green-600 to-emerald-500",
          gradient: "bg-gradient-to-br from-green-600 to-emerald-500",
        },
        {
          id: "iphone",
          texto: t("questions.devices.options.iphone"),
          icone: <Smartphone className="w-5 h-5" />,
          cor: "from-gray-700 to-gray-900",
          gradient: "bg-gradient-to-br from-gray-700 to-gray-900",
        },
        {
          id: "tablet",
          texto: t("questions.devices.options.tablet"),
          icone: <Tablet className="w-5 h-5" />,
          cor: "from-indigo-600 to-purple-500",
          gradient: "bg-gradient-to-br from-indigo-600 to-purple-500",
        },
        {
          id: "computador",
          texto: t("questions.devices.options.computer"),
          icone: <LaptopMinimal className="w-5 h-5" />,
          cor: "from-blue-700 to-blue-900",
          gradient: "bg-gradient-to-br from-blue-700 to-blue-900",
        },
      ],
      obrigatoria: true,
    },
    {
      id: "interesses",
      tipo: "multiple",
      pergunta: t("questions.features.title"),
      descricao: t("questions.features.description", { max: 4 }),
      opcoes: [
        {
          id: "registro-rapido",
          texto: t("questions.features.options.quickEntry"),
          descricao: t("questions.features.options.quickEntryDesc"),
          icone: (
            <Image
              src="/icons/whatsapp.png"
              alt="WhatsApp"
              width={23}
              height={23}
              className="h-6 w-6 sm:h-5 sm:w-5"
            />
          ),
          cor: "from-emerald-600 to-green-500",
          gradient: "bg-gradient-to-br from-emerald-600 to-green-500",
        },
        {
          id: "controle-categorias",
          texto: t("questions.features.options.categories"),
          descricao: t("questions.features.options.categoriesDesc"),
          icone: <PieChart className="w-4 h-4" />,
          cor: "from-blue-600 to-cyan-500",
          gradient: "bg-gradient-to-br from-blue-600 to-cyan-500",
        },
        {
          id: "divisao-despesas",
          texto: t("questions.features.options.expenseSharing"),
          descricao: t("questions.features.options.expenseSharingDesc"),
          icone: <Users className="w-4 h-4" />,
          cor: "from-violet-600 to-purple-500",
          gradient: "bg-gradient-to-br from-violet-600 to-purple-500",
        },
        {
          id: "cartoes-faturas",
          texto: t("questions.features.options.cards"),
          descricao: t("questions.features.options.cardsDesc"),
          icone: <CreditCard className="w-4 h-4" />,
          cor: "from-amber-600 to-orange-500",
          gradient: "bg-gradient-to-br from-amber-600 to-orange-500",
        },
        {
          id: "metas",
          texto: t("questions.features.options.goals"),
          descricao: t("questions.features.options.goalsDesc"),
          icone: <Target className="w-4 h-4" />,
          cor: "from-rose-600 to-pink-500",
          gradient: "bg-gradient-to-br from-rose-600 to-pink-500",
        },
        {
          id: "relatorios",
          texto: t("questions.features.options.reports"),
          descricao: t("questions.features.options.reportsDesc"),
          icone: <BarChart3 className="w-4 h-4" />,
          cor: "from-indigo-600 to-blue-500",
          gradient: "bg-gradient-to-br from-indigo-600 to-blue-500",
        },
      ],
      obrigatoria: false,
      maxSelecoes: 4,
    },
  ];

  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Detecta idioma da URL
    const detectedLang = getLanguageFromUrl();
    setLang(detectedLang);
    setCarregandoPagina(false);

    if (status === "unauthenticated") {
      router.push(`/${detectedLang}/login`);
    }
  }, [status, router]);

  const handleResposta = (perguntaId: string, valor: any) => {
    setRespostas((prev) => ({
      ...prev,
      [perguntaId]: valor,
    }));
  };

  const toggleSelecao = (opcaoId: string) => {
    const pergunta = perguntas[perguntaAtual];
    const atual = respostas[pergunta.id] || [];

    if (pergunta.tipo === "single") {
      handleResposta(pergunta.id, opcaoId);
      setSelecionados(new Set([opcaoId]));
    } else {
      let novoArray;
      if (atual.includes(opcaoId)) {
        novoArray = atual.filter((id: string) => id !== opcaoId);
        setSelecionados((prev) => {
          const next = new Set(prev);
          next.delete(opcaoId);
          return next;
        });
      } else {
        if (pergunta.maxSelecoes && atual.length >= pergunta.maxSelecoes) {
          setErro(t("validation.maxSelections", { max: pergunta.maxSelecoes }));
          return;
        }
        novoArray = [...atual, opcaoId];
        setSelecionados((prev) => new Set(prev).add(opcaoId));
      }
      handleResposta(pergunta.id, novoArray);
      setErro(null);
    }
  };

  const avancarPergunta = () => {
    const pergunta = perguntas[perguntaAtual];

    if (pergunta.obrigatoria && !respostas[pergunta.id]) {
      setErro(t("validation.required"));
      return;
    }

    if (pergunta.tipo === "multiple" && pergunta.maxSelecoes) {
      const selecionadas = respostas[pergunta.id] || [];
      if (selecionadas.length > pergunta.maxSelecoes) {
        setErro(t("validation.maxSelections", { max: pergunta.maxSelecoes }));
        return;
      }
    }

    setErro(null);
    setSelecionados(new Set());

    if (perguntaAtual < perguntas.length - 1) {
      setPerguntaAtual(perguntaAtual + 1);
    } else {
      setMostrarConfirmacao(true);
      setMostrarConfetti(true);
      setTimeout(() => setMostrarConfetti(false), 5000);
    }
  };

  const voltarPergunta = () => {
    if (perguntaAtual > 0) {
      setPerguntaAtual(perguntaAtual - 1);
      setErro(null);
      setSelecionados(new Set());
    }
  };

  const finalizarOnboarding = async () => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch("/api/onboarding/completar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          respostas,
          dataCompletado: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar respostas");
      }

      const { atualizado } = await response.json();
      if (atualizado) {
        router.push(`/${lang}/dashboard`);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErro(t("errors.generic"));
    } finally {
      setCarregando(false);
    }
  };

  const progresso = ((perguntaAtual + 1) / perguntas.length) * 100;

  if (status === "loading" || carregandoPagina) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />
          </motion.div>
          <p className="mt-4 text-gray-400">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const pergunta = perguntas[perguntaAtual];
  const selecionadas = respostas[pergunta.id] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
      {/* Header com mais espaçamento */}
      <header className="container mx-auto px-4 pt-12 pb-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Image
            src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
            alt="BeCash Logo"
            width={48}
            height={48}
            className="drop-shadow-lg"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              BeCash
            </h1>
            <p className="text-sm text-gray-400 mt-1">{t("header.subtitle")}</p>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={perguntaAtual}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            {/* Progresso */}
            <div className="mb-10">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{t("progress.label")}</span>
                <span>{Math.round(progresso)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progresso}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Pergunta */}
            <div className="mb-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                  {pergunta.pergunta}
                </h2>
                {pergunta.descricao && (
                  <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    {pergunta.descricao}
                  </p>
                )}
              </motion.div>

              {/* Cards de Opções com altura fixa */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {pergunta.opcoes.map((opcao, index) => {
                  const estaSelecionado =
                    pergunta.tipo === "single"
                      ? respostas[pergunta.id] === opcao.id
                      : (respostas[pergunta.id] || []).includes(opcao.id);

                  return (
                    <motion.div
                      key={opcao.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer border-2 transition-all duration-200 hover:border-gray-600 ${
                          estaSelecionado
                            ? "border-blue-500 bg-gray-800/50"
                            : "border-gray-800 bg-gray-900/50"
                        } min-h-[220px] flex flex-col`}
                        onClick={() => toggleSelecao(opcao.id)}
                      >
                        <CardContent className="p-6 flex-1 flex flex-col">
                          <div className="flex flex-col items-center text-center space-y-4 flex-1">
                            {/* Ícone */}
                            <div
                              className={`w-16 h-16 rounded-xl ${opcao.gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}
                            >
                              {typeof opcao.icone === "string" ? (
                                <span className="text-2xl">{opcao.icone}</span>
                              ) : (
                                opcao.icone
                              )}
                            </div>

                            {/* Texto com altura mínima */}
                            <div className="space-y-2 flex-1 min-h-[72px]">
                              <h3 className="font-semibold text-lg line-clamp-2">
                                {opcao.texto}
                              </h3>
                              {opcao.descricao && (
                                <p className="text-sm text-gray-400 line-clamp-2">
                                  {opcao.descricao}
                                </p>
                              )}
                            </div>

                            {/* Indicador de seleção */}
                            <div
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                                estaSelecionado
                                  ? "border-blue-500 bg-blue-500/10"
                                  : "border-gray-700"
                              } flex-shrink-0`}
                            >
                              {estaSelecionado && (
                                <Check className="w-4 h-4 text-blue-400" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Contador para múltipla seleção */}
              {pergunta.tipo === "multiple" && pergunta.maxSelecoes && (
                <div className="text-center mb-6">
                  <p className="text-gray-400">
                    {t("selection.counter", {
                      current: selecionadas.length,
                      max: pergunta.maxSelecoes,
                    })}
                  </p>
                </div>
              )}

              {/* Mensagem de erro */}
              {erro && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center px-4 py-2 rounded-lg bg-red-900/20 border border-red-800 text-red-400">
                    {erro}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Navegação */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={voltarPergunta}
                disabled={perguntaAtual === 0 || carregando}
                className="border-gray-700 text-gray-400 hover:bg-gray-800/50 hover:text-white hover:border-gray-600 transition-all"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t("buttons.back")}
              </Button>

              <div className="flex items-center space-x-4">
                {perguntaAtual < perguntas.length - 1 ? (
                  <Button
                    onClick={avancarPergunta}
                    disabled={carregando}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-8 py-6 text-lg transition-all hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    {carregando ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t("buttons.processing")}
                      </>
                    ) : (
                      <>
                        {t("buttons.continue")}
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setMostrarConfirmacao(true);
                      setMostrarConfetti(true);
                      setTimeout(() => setMostrarConfetti(false), 5000);
                    }}
                    disabled={carregando}
                    className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white px-8 py-6 text-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    {carregando ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t("buttons.finishing")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        {t("buttons.startUsing")}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12">
        <div className="text-center text-gray-500 text-sm">
          <p className="mb-2">{t("footer.message1")}</p>
          <p>{t("footer.message2")}</p>
        </div>

        {/* Indicadores de progresso */}
        <div className="flex justify-center mt-8 space-x-2">
          {perguntas.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setPerguntaAtual(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === perguntaAtual
                  ? "bg-blue-500 w-8"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </footer>

      {/* Modal de Confirmação */}
      {mostrarConfirmacao && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-full  flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Image
                  src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
                  alt="BeCash Logo"
                  width={48}
                  height={48}
                  className="drop-shadow-lg"
                />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">
                {t("confirmation.title")}
              </h3>
              <p className="text-gray-400 mb-6">
                {t("confirmation.description")}
              </p>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrarConfirmacao(false);
                    setMostrarConfetti(false);
                  }}
                  className="flex-1 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all"
                >
                  {t("confirmation.review")}
                </Button>
                <Button
                  onClick={finalizarOnboarding}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  {t("confirmation.letsGo")}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
