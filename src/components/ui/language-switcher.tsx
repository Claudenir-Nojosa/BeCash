"use client";

import { useTranslation } from "react-i18next";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Importe a instância do i18n diretamente
import i18n from "@/lib/i18n/client";

export function LanguageSwitcher() {
  const { t } = useTranslation(); // Ainda usamos useTranslation para o contexto
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const languages = [
    { code: "pt", name: "Português", flag: "🇧🇷" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ];

  const handleLanguageChange = async (newLocale: string) => {
    try {
      // Use a instância do i18n diretamente
      await i18n.changeLanguage(newLocale);

      // Atualiza a URL
      const newPathname = pathname.replace(`/${params.lang}`, `/${newLocale}`);
      router.push(newPathname);

      // Força um reload suave para atualizar os textos
      router.refresh();
    } catch (error) {
      console.error("Erro ao alterar idioma:", error);
    }
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">
            {currentLanguage?.flag} {currentLanguage?.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`cursor-pointer ${i18n.language === language.code ? "bg-gray-700" : "hover:bg-gray-700"}`}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
