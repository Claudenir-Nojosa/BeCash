// components/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  Calendar,
  FileText,
  Landmark,
  Layers,
  AlertCircle,
  Building,
  Settings,
  LogOut,
  CreditCard,
  Wand,
  Menu,
  Plane,
  ChevronDown,
  ChevronRight,
  Loader,
  Library,
  HandCoins,
  PiggyBank,
  Mails,
  ScanEye,
  Route,
  Server,
  EqualApproximately,
  ChartNoAxesColumnIncreasing,
  Goal,
  WandSparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { createSlug } from "@/lib/utils";
import Image from "next/image";

interface SubmenuState {
  "obrigacoes-acessorias": boolean;
  "obrigacoes-principais": boolean;
  empresas: boolean;
}

export default function Sidebar() {
  // Estado inicial vazio - será preenchido após carregar do localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);
  const [openSubmenus, setOpenSubmenus] = useState<SubmenuState | null>(null);
  const { data: session } = useSession();

  // Carrega o estado do localStorage quando o componente é montado
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarState");
    if (savedState) {
      const { isCollapsed: savedCollapsed, openSubmenus: savedSubmenus } =
        JSON.parse(savedState);
      setIsCollapsed(savedCollapsed);
      setOpenSubmenus(savedSubmenus);
    } else {
      // Estado padrão se não houver nada salvo
      setIsCollapsed(false);
      setOpenSubmenus({
        "obrigacoes-acessorias": false,
        "obrigacoes-principais": false,
        empresas: false,
      });
    }
  }, []);

  // Salva o estado no localStorage sempre que ele mudar
  useEffect(() => {
    if (isCollapsed !== null && openSubmenus !== null) {
      const stateToSave = {
        isCollapsed,
        openSubmenus,
      };
      localStorage.setItem("sidebarState", JSON.stringify(stateToSave));
    }
  }, [isCollapsed, openSubmenus]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSubmenu = (menu: keyof SubmenuState) => {
    if (openSubmenus) {
      setOpenSubmenus({
        ...openSubmenus,
        [menu]: !openSubmenus[menu],
      });
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

  // Não renderiza até que o estado seja carregado
  if (isCollapsed === null || openSubmenus === null) {
    return <div className="w-16"></div>; // ou algum loader
  }

  return (
    <div
      className={`flex flex-col h-screen bg-gray-950 border-r border-blue-900/30 ${
        isCollapsed ? "w-16" : "w-64"
      } transition-all duration-300`}
    >
      {/* Topo da Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-blue-900/30">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Image
              src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
              alt="BeCash Logo"
              width={50}
              height={50}
            />
            <span className="text-lg font-bold text-white">BeCash</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hover:bg-blue-900/20 text-blue-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          <li>
            <Link
              href="/dashboard"
              className={`flex items-center p-2 rounded-lg hover:bg-blue-900/20 text-blue-100 hover:text-blue-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Home className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Página Inicial</span>}
            </Link>
          </li>

          {/* Empresas com submenu */}
          <li>
            <div className="flex items-center">
              <Link
                href="/dashboard/lancamentos"
                className="flex items-center p-2 rounded-lg hover:bg-blue-900/20 text-blue-100 hover:text-blue-100 w-full"
              >
                <HandCoins className="h-5 w-5" />
                {!isCollapsed && <span className="ml-2">Lançamentos</span>}
              </Link>
              {!isCollapsed && (
                <button
                  onClick={() => toggleSubmenu("empresas")}
                  className="p-1 rounded-full hover:bg-blue-900/20 text-blue-300"
                >
                  {openSubmenus["empresas"] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {!isCollapsed && openSubmenus["empresas"] && (
              <ul className="ml-8 mt-1 space-y-1">
                <li>
                  <Link
                    href="/dashboard/lancamentos/claudenir"
                    className="flex items-center p-2 rounded-lg hover:bg-blue-900/20 text-sm text-blue-300/70 hover:text-blue-200"
                  >
                    <span className="ml-2">Claudenir</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/lancamentos/beatriz"
                    className="flex items-center p-2 rounded-lg hover:bg-blue-900/20 text-sm text-blue-300/70 hover:text-blue-200"
                  >
                    <span className="ml-2">Beatriz</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/lancamentos/compartilhado"
                    className="flex items-center p-2 rounded-lg hover:bg-blue-900/20 text-sm text-blue-300/70 hover:text-blue-200"
                  >
                    <span className="ml-2">Compartilhado</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <Link
              href="/dashboard/relatorios"
              className={`flex items-center p-2 rounded-lg hover:bg-blue-900/20 text-blue-100 hover:text-blue-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <ChartNoAxesColumnIncreasing className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Relatórios</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/biblioteca"
              className={`flex items-center p-2 rounded-lg hover:bg-blue-900/20 text-blue-100 hover:text-blue-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Landmark className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Investimentos</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/metas"
              className={`flex items-center p-2 rounded-lg hover:bg-blue-900/20 text-blue-100 hover:text-blue-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Goal className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Metas</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/bicla"
              className={`flex items-center p-2 rounded-lg hover:bg-blue-900/20 text-blue-100 hover:text-blue-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <WandSparkles className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Bicla</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-blue-900/30">
        <ul className="space-y-1">
          <li>
            <div
              className={`flex items-center p-2 rounded-lg hover:bg-blue-900/20 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session?.user?.image || ""}
                  alt={session?.user?.name || "Usuário"}
                />
                <AvatarFallback className="bg-blue-800 text-blue-200">
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="ml-2">
                  <p className="text-sm font-medium text-blue-300">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-blue-100">
                    {session?.user?.email}
                  </p>
                </div>
              )}
            </div>
          </li>
          <li>
            <Button
              variant="ghost"
              className={`w-full justify-start p-2 rounded-lg hover:bg-blue-900/20 text-blue-100 hover:text-blue-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
              onClick={() => signOut()}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Sair</span>}
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
