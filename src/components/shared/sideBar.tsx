// components/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Home,
  Menu,
  ChartNoAxesColumnIncreasing,
  Goal,
  WandSparkles,
  HandCoins,
  LogOut,
  X,
  CreditCard,
  ReceiptCent,
  Coins,
  Target,
  PhoneIncoming,
  Headphones,
  User,
  Settings,
  Crown, // Adicionado para indicar plano premium
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { usePathname, useParams, useRouter } from "next/navigation";
import { logoutAction } from "@/app/[lang]/(auth)/(logout)/logoutAction";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface SidebarProps {
  onClose?: () => void;
}

interface LimiteInfo {
  plano: string;

  // Limites individuais
  limiteLancamentos: number;
  usadoLancamentos: number;
  percentualLancamentos: number;
  lancamentosAtingido: boolean;

  limiteCategorias: number;
  usadoCategorias: number;
  percentualCategorias: number;
  categoriasAtingido: boolean;

  limiteMetas: number; // ← NOVO
  usadoMetas: number; // ← NOVO
  percentualMetas: number; // ← NOVO
  metasAtingido: boolean; // ← NOVO

  // Dados combinados
  percentualCombinado: number;
  atingido: boolean;
  limiteCritico: string;
  maisProximoDoLimite: string;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);
  const { data: session } = useSession();
  const { t, i18n } = useTranslation("sidebar");
  const pathname = usePathname();
  const params = useParams();
  const [isMobile, setIsMobile] = useState(false);
  const locale = pathname.split("/")[1];
  const currentLang = (params?.lang as string) || i18n.language || "pt";
  const router = useRouter();
  const [limiteInfo, setLimiteInfo] = useState<LimiteInfo | null>(null);
  const [loadingLimite, setLoadingLimite] = useState(false);
  // Função para buscar informações de limite
  const fetchLimiteInfo = async () => {
    try {
      setLoadingLimite(true);
      const response = await fetch(
        "/api/usuarios/subscription/limite-combinado",
      );
      if (response.ok) {
        const data = await response.json();
        setLimiteInfo(data);
      }
    } catch (error) {
      console.error("Erro ao buscar limite:", error);
    } finally {
      setLoadingLimite(false);
    }
  };

  // Buscar limite ao carregar componente
  useEffect(() => {
    fetchLimiteInfo();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchLimiteInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logoutAction(locale);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarState");
    if (savedState) {
      const { isCollapsed: savedCollapsed } = JSON.parse(savedState);
      setIsCollapsed(savedCollapsed);
    } else {
      setIsCollapsed(false);
    }
  }, []);

  useEffect(() => {
    if (isCollapsed !== null) {
      const stateToSave = {
        isCollapsed,
        openSubmenus: { lancamentos: false },
      };
      localStorage.setItem("sidebarState", JSON.stringify(stateToSave));
    }
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return t("usuario.usuarioPadrao").charAt(0);
    const nameParts = name.split(" ");
    return nameParts
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const isActiveRoute = (route: string) => {
    const pathWithoutLang = pathname.replace(/^\/(pt|en)/, "");
    const routeWithoutLang = route.replace(/^\/(pt|en)/, "");
    return pathWithoutLang === routeWithoutLang;
  };

  const createLink = (path: string) => {
    if (path.startsWith(`/${currentLang}/`)) {
      return path;
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/${currentLang}${cleanPath}`;
  };
  // Componente do círculo percentual - COM LIMITES COMBINADOS
  const CirculoPercentual = () => {
    if (!limiteInfo || loadingLimite || limiteInfo.plano !== "free") {
      return null;
    }

    const { percentualCombinado, atingido, limiteCritico } = limiteInfo;

    // Definir cores baseado no percentual combinado
    let corProgresso = "#3b82f6"; // Azul padrão
    let corFundo = "bg-gray-200";
    let corTexto = "text-gray-600";
    let corBorda = "border-gray-300";

    if (atingido) {
      corProgresso = "#ef4444"; // Vermelho
      corFundo = "bg-red-100";
      corTexto = "text-red-600";
      corBorda = "border-red-300";
    } else if (percentualCombinado >= 80) {
      corProgresso = "#f59e0b"; // Amarelo
      corFundo = "bg-yellow-100";
      corTexto = "text-yellow-600";
      corBorda = "border-yellow-300";
    } else if (percentualCombinado >= 50) {
      corProgresso = "#3b82f6"; // Azul
      corFundo = "bg-blue-100";
      corTexto = "text-blue-600";
      corBorda = "border-blue-300";
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
              relative flex items-center justify-center
              ${isCollapsed ? "mx-auto my-3" : "ml-3 my-3"}
              cursor-pointer
              ${corFundo} ${corBorda}
              rounded-full border-2
              transition-all duration-300 hover:scale-105
              ${isCollapsed ? "h-12 w-12" : "h-14 w-14"}
            `}
              onClick={() => router.push(`/${currentLang}/dashboard/perfil`)}
            >
              {/* Círculo de fundo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  {/* Círculo de fundo */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeOpacity="0.2"
                    className={corTexto}
                  />

                  {/* Círculo de progresso */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke={corProgresso}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${percentualCombinado * 2.83} 283`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>

              {/* Texto no centro */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`
                  font-bold
                  ${isCollapsed ? "text-xs" : "text-sm"}
                  ${atingido ? "animate-pulse" : ""}
                  ${corTexto}
                `}
                >
                  {Math.round(percentualCombinado)}%
                </span>
              </div>

              {/* Indicador de atingido */}
              {atingido && (
                <div className="absolute -top-1 -right-1">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2 p-1">
              <div className="font-medium text-sm">
                {atingido ? "Limite Atingido!" : "Limites Free"}
                {limiteCritico && !atingido && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({limiteCritico})
                  </span>
                )}
              </div>

              {/* Lançamentos */}
              <div className="text-xs space-y-1.5">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-medium">Lançamentos:</span>
                    <span className="font-semibold">
                      {limiteInfo.usadoLancamentos}/
                      {limiteInfo.limiteLancamentos}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        limiteInfo.lancamentosAtingido
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min(limiteInfo.percentualLancamentos, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Categorias */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-medium">Categorias:</span>
                    <span className="font-semibold">
                      {limiteInfo.usadoCategorias}/{limiteInfo.limiteCategorias}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        limiteInfo.categoriasAtingido
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(limiteInfo.percentualCategorias, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Metas - NOVA SEÇÃO */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-medium">Metas:</span>
                    <span className="font-semibold">
                      {limiteInfo.usadoMetas}/{limiteInfo.limiteMetas}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        limiteInfo.metasAtingido
                          ? "bg-red-500"
                          : "bg-purple-500"
                      }`}
                      style={{
                        width: `${Math.min(limiteInfo.percentualMetas, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 pt-1">
                {limiteInfo.maisProximoDoLimite}
              </div>

              {atingido && (
                <Button
                  size="sm"
                  className="w-full mt-2 text-xs h-7 border"
                  onClick={() =>
                    router.push(`/${currentLang}/dashboard/perfil`)
                  }
                >
                  <Crown className="h-3 w-3 mr-1" />
                  Fazer Upgrade
                </Button>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  // Versão expandida com limites combinados
  const LimiteExpandido = () => {
    if (!limiteInfo || loadingLimite || limiteInfo.plano !== "free") {
      return null;
    }

    const {
      percentualCombinado,
      atingido,
      limiteCritico,
      usadoLancamentos,
      limiteLancamentos,
      usadoCategorias,
      limiteCategorias,
      usadoMetas,
      limiteMetas,
    } = limiteInfo;

    // Cores baseadas no percentual combinado
    const corProgresso = atingido ? "#ef4444" : "#3b82f6";
    const corTexto = atingido
      ? "text-red-600 dark:text-red-400"
      : "text-blue-600 dark:text-blue-400";

    return (
      <div
        className="mt-4 p-3 rounded-lg dark:bg-transparent cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => router.push(`/${currentLang}/dashboard/perfil`)}
      >
        <div className="flex items-center gap-3">
          {/* Círculo minimalista */}
          <div className="relative h-12 w-12">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#e5e7eb"
                strokeWidth="4"
                className="dark:stroke-gray-700"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={corProgresso}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${percentualCombinado * 2.51} 251`}
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-medium ${corTexto}`}>
                {Math.round(percentualCombinado)}%
              </span>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                  Limite Free
                </span>
                {limiteCritico && !atingido && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({limiteCritico})
                  </span>
                )}
              </div>
              {atingido && (
                <Button
                  size="sm"
                  className="
                  bg-gradient-to-r from-[#00cfec] to-[#007cca] 
                  text-white hover:opacity-90
                  hover:text-white dark:hover:text-white
                  px-3 py-1 h-auto min-h-0
                  ml-2
                "
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${currentLang}/dashboard/perfil`);
                  }}
                >
                  <Crown className="h-3 w-3 mr-1.5" />
                  <span className="text-xs font-medium">Upgrade</span>
                </Button>
              )}
            </div>

            {/* Estatísticas detalhadas */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Lançamentos:
                </span>
                <span
                  className={`font-medium ${usadoLancamentos >= limiteLancamentos ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {usadoLancamentos}/{limiteLancamentos}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Categorias:
                </span>
                <span
                  className={`font-medium ${usadoCategorias >= limiteCategorias ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {usadoCategorias}/{limiteCategorias}
                </span>
              </div>
              {/* Nova linha para metas */}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Metas:</span>
                <span
                  className={`font-medium ${usadoMetas >= limiteMetas ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {usadoMetas}/{limiteMetas}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isCollapsed === null) {
    return <div className="w-20 lg:w-64"></div>;
  }

  return (
    <div
      className={`
        flex flex-col h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 
        border-r border-gray-200 dark:border-gray-800 shadow-lg dark:shadow-none
        ${isCollapsed ? "w-20" : "w-64"} 
        transition-all duration-300
      `}
    >
      {/* Topo da Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <Image
              src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
              alt="BeCash Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              BeCash
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {/* Página Inicial */}
          <li>
            <Link
              href={createLink("/dashboard")}
              className={`
                flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                text-gray-700 dark:text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${
                  isActiveRoute("/dashboard")
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700"
                    : ""
                }
              `}
              onClick={handleLinkClick}
            >
              <Home className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">
                  {t("menu.paginaInicial")}
                </span>
              )}
            </Link>
          </li>

          {/* Lançamentos */}
          <li>
            <Link
              href={createLink("/dashboard/lancamentos")}
              className={`
                flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                text-gray-700 dark:text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${
                  pathname.includes("/lancamentos")
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700"
                    : ""
                }
              `}
              onClick={handleLinkClick}
            >
              <HandCoins className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">
                  {t("menu.lancamentos")}
                </span>
              )}
            </Link>
          </li>

          {/* Limites */}
          <li>
            <Link
              href={createLink("/dashboard/limites")}
              className={`
                flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                text-gray-700 dark:text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${
                  isActiveRoute("/dashboard/limites")
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700"
                    : ""
                }
              `}
              onClick={handleLinkClick}
            >
              <Target className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">
                  {t("menu.limites")}
                </span>
              )}
            </Link>
          </li>

          {/* Relatórios */}
          <li>
            <Link
              href={createLink("/dashboard/relatorios")}
              className={`
                flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                text-gray-700 dark:text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${
                  isActiveRoute("/dashboard/relatorios")
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700"
                    : ""
                }
              `}
              onClick={handleLinkClick}
            >
              <ChartNoAxesColumnIncreasing className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">
                  {t("menu.relatorios")}
                </span>
              )}
            </Link>
          </li>

          {/* Cartões */}
          <li>
            <Link
              href={createLink("/dashboard/cartoes")}
              className={`
                flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                text-gray-700 dark:text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${
                  isActiveRoute("/dashboard/cartoes")
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700"
                    : ""
                }
              `}
              onClick={handleLinkClick}
            >
              <CreditCard className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">
                  {t("menu.cartoes")}
                </span>
              )}
            </Link>
          </li>

          {/* Categorias */}
          <li>
            <Link
              href={createLink("/dashboard/categorias")}
              className={`
                flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                text-gray-700 dark:text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${
                  isActiveRoute("/dashboard/categorias")
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700"
                    : ""
                }
              `}
              onClick={handleLinkClick}
            >
              <ReceiptCent className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">
                  {t("menu.categorias")}
                </span>
              )}
            </Link>
          </li>

          {/* Metas */}
          <li>
            <Link
              href={createLink("/dashboard/metas")}
              className={`
                flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                text-gray-700 dark:text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${
                  isActiveRoute("/dashboard/metas")
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700"
                    : ""
                }
              `}
              onClick={handleLinkClick}
            >
              <Goal className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">
                  {t("menu.metas")}
                </span>
              )}
            </Link>
          </li>

          {/* Telefone */}
          <li>
            <Link
              href={createLink("/dashboard/vincular-telefone")}
              className={`
                flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                text-gray-700 dark:text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${
                  isActiveRoute("/dashboard/vincular-telefone")
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700"
                    : ""
                }
              `}
              onClick={handleLinkClick}
            >
              <PhoneIncoming className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">
                  {t("menu.vincularTelefone")}
                </span>
              )}
            </Link>
          </li>

          {/* Bicla */}
          <li>
            <Link
              href={createLink("/dashboard/bicla")}
              className={`
                flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                text-gray-700 dark:text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${
                  isActiveRoute("/dashboard/bicla")
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700"
                    : ""
                }
              `}
              onClick={handleLinkClick}
            >
              <WandSparkles className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">
                  {t("menu.bicla")}
                </span>
              )}
            </Link>
          </li>

          {/* Suporte */}
          <li>
            <Link
              href={createLink("/dashboard/suporte")}
              className={`
                flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                text-gray-700 dark:text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${
                  isActiveRoute("/dashboard/suporte")
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700"
                    : ""
                }
              `}
              onClick={handleLinkClick}
            >
              <Headphones className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">
                  {t("menu.suporte") || "Suporte"}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </nav>
      {/* SEÇÃO DE LIMITE - Colocada ANTES do rodapé */}
      <div className="px-4 pb-2">
        {!isCollapsed && <LimiteExpandido />}
        {isCollapsed && <CirculoPercentual />}
      </div>
      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="space-y-3">
          {/* Perfil do Usuário (Clique para ir para o perfil) */}
          <Link
            href={createLink(`/${currentLang}/dashboard/perfil`)}
            className={`
    flex items-center rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-800 
    transition-all duration-200 cursor-pointer
    ${isCollapsed ? "justify-center" : ""}
  `}
            onClick={handleLinkClick}
          >
            <div className="relative h-8 w-8 flex-shrink-0">
              <Avatar className="h-full w-full">
                <AvatarImage
                  src={session?.user?.image || ""}
                  alt={session?.user?.name || t("usuario.usuarioPadrao")}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm">
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            {!isCollapsed && (
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
            )}
          </Link>

          {/* Botão Sair */}
          <Button
            variant="ghost"
            className={`
              w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
              text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white 
              transition-all duration-200
              ${isCollapsed ? "justify-center p-3" : "justify-start p-3"}
            `}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && (
              <span className="ml-3 text-sm">{t("usuario.sair")}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
