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
  Target,
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
        flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800
        ${isCollapsed ? "w-20" : "w-64"} 
        transition-all duration-300
      `}
    >
      {/* Topo da Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
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
            className="lg:hidden hover:bg-gray-800 text-gray-300 h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex hover:bg-gray-800 text-gray-300 h-10 w-10"
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
                flex items-center rounded-lg hover:bg-gray-800 text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard") ? "bg-gray-800 text-white border-l-2 border-gray-700" : ""}
              `}
              onClick={handleLinkClick}
            >
              <Home className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">Página Inicial</span>
              )}
            </Link>
          </li>

          {/* Lançamentos */}
          <li>
            <Link
              href="/dashboard/lancamentos"
              className={`
                flex items-center rounded-lg hover:bg-gray-800 text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${pathname.includes("/dashboard/lancamentos") ? "bg-gray-800 text-white border-l-2 border-blue-500" : ""}
              `}
              onClick={handleLinkClick}
            >
              <HandCoins className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">Lançamentos</span>
              )}
            </Link>
          </li>

          {/* Limites */}
          <li>
            <Link
              href="/dashboard/limites"
              className={`
                flex items-center rounded-lg hover:bg-gray-800 text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/limites") ? "bg-gray-800 text-white border-l-2 border-blue-500" : ""}
              `}
              onClick={handleLinkClick}
            >
              <Target className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">Limites</span>
              )}
            </Link>
          </li>

          {/* Relatórios */}
          <li>
            <Link
              href="/dashboard/relatorios"
              className={`
                flex items-center rounded-lg hover:bg-gray-800 text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/relatorios") ? "bg-gray-800 text-white border-l-2 border-blue-500" : ""}
              `}
              onClick={handleLinkClick}
            >
              <ChartNoAxesColumnIncreasing className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">Relatórios</span>
              )}
            </Link>
          </li>

          {/* Cartões */}
          <li>
            <Link
              href="/dashboard/cartoes"
              className={`
                flex items-center rounded-lg hover:bg-gray-800 text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/cartoes") ? "bg-gray-800 text-white border-l-2 border-blue-500" : ""}
              `}
              onClick={handleLinkClick}
            >
              <CreditCard className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">Cartões</span>
              )}
            </Link>
          </li>

          {/* Categorias */}
          <li>
            <Link
              href="/dashboard/categorias"
              className={`
                flex items-center rounded-lg hover:bg-gray-800 text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/categorias") ? "bg-gray-800 text-white border-l-2 border-blue-500" : ""}
              `}
              onClick={handleLinkClick}
            >
              <ReceiptCent className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">Categorias</span>
              )}
            </Link>
          </li>

          {/* Pontos */}
          <li>
            <Link
              href="/dashboard/pontos"
              className={`
                flex items-center rounded-lg hover:bg-gray-800 text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/pontos") ? "bg-gray-800 text-white border-l-2 border-blue-500" : ""}
              `}
              onClick={handleLinkClick}
            >
              <Coins className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">Pontos</span>
              )}
            </Link>
          </li>

          {/* Metas */}
          <li>
            <Link
              href="/dashboard/metas"
              className={`
                flex items-center rounded-lg hover:bg-gray-800 text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/metas") ? "bg-gray-800 text-white border-l-2 border-blue-500" : ""}
              `}
              onClick={handleLinkClick}
            >
              <Goal className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">Metas</span>
              )}
            </Link>
          </li>

          {/* Bicla */}
          <li>
            <Link
              href="/dashboard/bicla"
              className={`
                flex items-center rounded-lg hover:bg-gray-800 text-gray-300 transition-all duration-200
                ${isCollapsed ? "justify-center p-4" : "p-4"}
                ${isActiveRoute("/dashboard/bicla") ? "bg-gray-800 text-white border-l-2 border-blue-500" : ""}
              `}
              onClick={handleLinkClick}
            >
              <WandSparkles className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">Bicla</span>
              )}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-gray-800">
        <div className="space-y-3">
          {/* Perfil do Usuário */}
          <div
            className={`
              flex items-center rounded-lg p-3
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <Avatar className="h-8 w-8 border border-gray-700">
              <AvatarImage
                src={session?.user?.image || ""}
                alt={session?.user?.name || "Usuário"}
              />
              <AvatarFallback className="bg-gray-800 text-gray-300 text-sm">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
            )}
          </div>

          {/* Botão Sair */}
          <Button
            variant="ghost"
            className={`
              w-full rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-all duration-200
              ${isCollapsed ? "justify-center p-3" : "justify-start p-3"}
            `}
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-3 text-sm">Sair</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
