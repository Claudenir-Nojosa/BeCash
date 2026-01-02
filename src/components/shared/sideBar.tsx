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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);
  const { data: session } = useSession();
  const { t, i18n } = useTranslation("sidebar");
  const pathname = usePathname();
  const params = useParams();
  const [isMobile, setIsMobile] = useState(false);

  const currentLang = (params?.lang as string) || i18n.language || "pt";

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
                ${isActiveRoute("/dashboard") ? 
                  "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700" : 
                  ""
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
                ${pathname.includes("/lancamentos") ? 
                  "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700" : 
                  ""
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
                ${isActiveRoute("/dashboard/limites") ? 
                  "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700" : 
                  ""
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
                ${isActiveRoute("/dashboard/relatorios") ? 
                  "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700" : 
                  ""
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
                ${isActiveRoute("/dashboard/cartoes") ? 
                  "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700" : 
                  ""
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
                ${isActiveRoute("/dashboard/categorias") ? 
                  "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700" : 
                  ""
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
                ${isActiveRoute("/dashboard/metas") ? 
                  "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700" : 
                  ""
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
                ${isActiveRoute("/dashboard/vincular-telefone") ? 
                  "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700" : 
                  ""
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
                ${isActiveRoute("/dashboard/bicla") ? 
                  "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-gray-300 dark:border-gray-700" : 
                  ""
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
        </ul>
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="space-y-3">
          {/* Perfil do Usuário */}
          <div
            className={`
              flex items-center rounded-lg p-3
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <Avatar className="h-8 w-8 border border-gray-300 dark:border-gray-700">
              <AvatarImage
                src={session?.user?.image || ""}
                alt={session?.user?.name || t("usuario.usuarioPadrao")}
              />
              <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
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
          </div>

          {/* Botão Sair */}
          <Button
            variant="ghost"
            className={`
              w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
              text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white 
              transition-all duration-200
              ${isCollapsed ? "justify-center p-3" : "justify-start p-3"}
            `}
            onClick={() => signOut()}
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