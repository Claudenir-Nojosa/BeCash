// components/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  Menu,
  ChartNoAxesColumnIncreasing,
  Goal,
  WandSparkles,
  Landmark,
  HandCoins,
  LogOut,
  X,
  User,
  Users,
  CreditCard,
  Pointer,
  ReceiptCent,
  Coins,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

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
        openSubmenus: { lancamentos: false }, // Mantemos compatibilidade
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
    if (!name) return "U";
    const nameParts = name.split(" ");
    return nameParts
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const isActiveRoute = (route: string) => {
    return pathname === route;
  };

  if (isCollapsed === null) {
    return <div className="w-20 lg:w-64"></div>;
  }

  return (
    <div
      className={`
        flex flex-col h-full bg-gray-950 border-r border-blue-900/30
        ${isCollapsed ? "w-20" : "w-64"} 
        transition-all duration-300
      `}
    >
      {/* Topo da Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-blue-900/30">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <Image
              src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
              alt="BeCash Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-white">BeCash</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden hover:bg-blue-900/20 text-blue-200 h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex hover:bg-blue-900/20 text-blue-200 h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {/* Página Inicial */}
          <li>
            <Link
              href="/dashboard"
              className={`
                flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard") ? "bg-blue-900/30 text-white" : ""}
              `}
              onClick={handleLinkClick}
            >
              <Home className="h-6 w-6" />
              {!isCollapsed && (
                <span className="ml-4 text-base">Página Inicial</span>
              )}
            </Link>
          </li>

          {/* MOBILE: Lançamentos como itens separados */}
          {isMobile ? (
            <>
              {/* Lançamentos - Claudenir */}
              <li>
                <Link
                  href="/dashboard/lancamentos"
                  className={`
                    flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                    ${isCollapsed ? "justify-center p-4" : "p-4"}
                    ${isActiveRoute("/dashboard/lancamentos/") ? "bg-blue-900/30 text-white" : ""}
                  `}
                  onClick={handleLinkClick}
                >
                  <HandCoins className="h-6 w-6" />
                  {!isCollapsed && (
                    <span className="ml-4 text-base">Lançamentos</span>
                  )}
                </Link>
              </li>
              {/* Lançamentos - Claudenir */}
              <li>
                <Link
                  href="/dashboard/lancamentos/claudenir"
                  className={`
                    flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                    ${isCollapsed ? "justify-center p-4" : "p-4"}
                    ${isActiveRoute("/dashboard/lancamentos/claudenir") ? "bg-blue-900/30 text-white" : ""}
                  `}
                  onClick={handleLinkClick}
                >
                  <User className="h-6 w-6" />
                  {!isCollapsed && (
                    <span className="ml-4 text-base">Claudenir</span>
                  )}
                </Link>
              </li>

              {/* Lançamentos - Beatriz */}
              <li>
                <Link
                  href="/dashboard/lancamentos/beatriz"
                  className={`
                    flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                    ${isCollapsed ? "justify-center p-4" : "p-4"}
                    ${isActiveRoute("/dashboard/lancamentos/beatriz") ? "bg-blue-900/30 text-white" : ""}
                  `}
                  onClick={handleLinkClick}
                >
                  <User className="h-6 w-6" />
                  {!isCollapsed && (
                    <span className="ml-4 text-base">Beatriz</span>
                  )}
                </Link>
              </li>

              {/* Lançamentos - Compartilhado */}
              <li>
                <Link
                  href="/dashboard/lancamentos/compartilhado"
                  className={`
                    flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                    ${isCollapsed ? "justify-center p-4" : "p-4"}
                    ${isActiveRoute("/dashboard/lancamentos/compartilhado") ? "bg-blue-900/30 text-white" : ""}
                  `}
                  onClick={handleLinkClick}
                >
                  <Users className="h-6 w-6" />
                  {!isCollapsed && (
                    <span className="ml-4 text-base">Compartilhado</span>
                  )}
                </Link>
              </li>
            </>
          ) : (
            /* DESKTOP: Lançamentos como submenu */
            <li>
              <Link
                href="/dashboard/lancamentos"
                className={`
                  flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                  ${isCollapsed ? "justify-center p-4" : "p-4"}
                  ${pathname.includes("/dashboard/lancamentos") ? "bg-blue-900/30 text-white" : ""}
                `}
                onClick={handleLinkClick}
              >
                <HandCoins className="h-6 w-6" />
                {!isCollapsed && (
                  <span className="ml-4 text-base">Lançamentos</span>
                )}
              </Link>

              {/* Submenu desktop */}
              {!isCollapsed && (
                <ul className="ml-6 mt-2 space-y-2 border-l border-blue-800/30 pl-4">
                  <li>
                    <Link
                      href="/dashboard/lancamentos/claudenir"
                      className={`
                        flex items-center p-3 rounded-lg hover:bg-blue-900/20 transition-colors text-base
                        ${
                          isActiveRoute("/dashboard/lancamentos/claudenir")
                            ? "bg-blue-900/30 text-white"
                            : "text-blue-300/80 hover:text-blue-200"
                        }
                      `}
                    >
                      <span>Claudenir</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/lancamentos/beatriz"
                      className={`
                        flex items-center p-3 rounded-lg hover:bg-blue-900/20 transition-colors text-base
                        ${
                          isActiveRoute("/dashboard/lancamentos/beatriz")
                            ? "bg-blue-900/30 text-white"
                            : "text-blue-300/80 hover:text-blue-200"
                        }
                      `}
                    >
                      <span>Beatriz</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/lancamentos/compartilhado"
                      className={`
                        flex items-center p-3 rounded-lg hover:bg-blue-900/20 transition-colors text-base
                        ${
                          isActiveRoute("/dashboard/lancamentos/compartilhado")
                            ? "bg-blue-900/30 text-white"
                            : "text-blue-300/80 hover:text-blue-200"
                        }
                      `}
                    >
                      <span>Compartilhado</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          )}

          {/* Relatórios */}
          <li>
            <Link
              href="/dashboard/relatorios"
              className={`
                flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/relatorios") ? "bg-blue-900/30 text-white" : ""}
              `}
              onClick={handleLinkClick}
            >
              <ChartNoAxesColumnIncreasing className="h-6 w-6" />
              {!isCollapsed && (
                <span className="ml-4 text-base">Relatórios</span>
              )}
            </Link>
          </li>

          {/* Cartões */}
          <li>
            <Link
              href="/dashboard/cartoes"
              className={`
                flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/cartoes") ? "bg-blue-900/30 text-white" : ""}
              `}
              onClick={handleLinkClick}
            >
              <CreditCard className="h-6 w-6" />
              {!isCollapsed && <span className="ml-4 text-base">Cartões</span>}
            </Link>
          </li>

           {/* Pontos */}
          <li>
            <Link
              href="/dashboard/pontos"
              className={`
                flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/pontos") ? "bg-blue-900/30 text-white" : ""}
              `}
              onClick={handleLinkClick}
            >
              <Coins className="h-6 w-6" />
              {!isCollapsed && <span className="ml-4 text-base">Pontos</span>}
            </Link>
          </li>
          {/* Investimentos */}
          <li>
            <Link
              href="/dashboard/investimentos"
              className={`
                flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/investimentos") ? "bg-blue-900/30 text-white" : ""}
              `}
              onClick={handleLinkClick}
            >
              <Landmark className="h-6 w-6" />
              {!isCollapsed && (
                <span className="ml-4 text-base">Investimentos</span>
              )}
            </Link>
          </li>

          {/* Metas */}
          <li>
            <Link
              href="/dashboard/metas"
              className={`
                flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/metas") ? "bg-blue-900/30 text-white" : ""}
              `}
              onClick={handleLinkClick}
            >
              <Goal className="h-6 w-6" />
              {!isCollapsed && <span className="ml-4 text-base">Metas</span>}
            </Link>
          </li>

          {/* Bicla */}
          <li>
            <Link
              href="/dashboard/bicla"
              className={`
                flex items-center rounded-lg hover:bg-blue-900/20 text-blue-100 transition-colors
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/bicla") ? "bg-blue-900/30 text-white" : ""}
              `}
              onClick={handleLinkClick}
            >
              <WandSparkles className="h-6 w-6" />
              {!isCollapsed && <span className="ml-4 text-base">Bicla</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-blue-900/30">
        <div className="space-y-3">
          {/* Perfil do Usuário */}
          <div
            className={`
              flex items-center rounded-lg p-3
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={session?.user?.image || ""}
                alt={session?.user?.name || "Usuário"}
              />
              <AvatarFallback className="bg-blue-800 text-blue-200 text-base">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-base font-medium text-blue-300 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-sm text-blue-100 truncate">
                  {session?.user?.email}
                </p>
              </div>
            )}
          </div>

          {/* Botão Sair */}
          <Button
            variant="ghost"
            className={`
              w-full rounded-lg hover:bg-blue-900/20 text-blue-100 hover:text-blue-100 transition-colors
              ${isCollapsed ? "justify-center p-3" : "justify-start p-3"}
            `}
            onClick={() => signOut()}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3 text-base">Sair</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
