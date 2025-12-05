"use client";

import { useState } from "react";
import Sidebar from "@/components/shared/sideBar";
import { ThemeToggle } from "@/components/shared/themeToggle";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthGuard from "@/components/shared/AuthGuard";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-950 overflow-hidden">
        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 transition-transform duration-300 ease-in-out
          `}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          {/* Header mobile */}
          <header className="lg:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-white">BeCash</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>

          {/* Header desktop */}
          <header className="hidden lg:flex items-center justify-end p-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>

          {/* Conteúdo */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
};

export default DashboardLayout;
