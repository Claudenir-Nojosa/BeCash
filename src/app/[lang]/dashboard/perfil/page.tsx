// app/[lang]/dashboard/perfil/page.tsx
"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Camera,
  Save,
  Loader2,
  CreditCard,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function PerfilPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    return nameParts
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione uma imagem válida");
        return;
      }

      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }

      setSelectedFile(file);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      if (!selectedFile) {
        toast.error("Nenhuma imagem selecionada");
        setIsSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const response = await fetch("/api/usuarios/alterar-foto", {
        method: "POST",
        body: formData,
        // Não definir Content-Type, o browser vai definir automaticamente com boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar foto");
      }

      toast.success("Foto atualizada com sucesso!");

      const { getSession } = await import("next-auth/react");
      await getSession();

      // Resetar estados
      setSelectedFile(null);
      setAvatarPreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Erro ao salvar foto:", error);
      toast.error(error.message || "Erro ao atualizar foto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("perfil.titulo", "Meu Perfil")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t(
              "perfil.descricao",
              "Gerencie suas informações pessoais e preferências",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Informações do Perfil */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("perfil.informacoesPessoais", "Informações Pessoais")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "perfil.descricaoInformacoes",
                    selectedFile
                      ? "Clique em Salvar Alterações para atualizar sua foto"
                      : "Clique no ícone da câmera para alterar sua foto de perfil",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Foto do Perfil */}
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-gray-100 dark:border-gray-800">
                      <AvatarImage
                        src={avatarPreview || session?.user?.image || ""}
                        alt={session?.user?.name || "Usuário"}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                        {getInitials(session?.user?.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Ícone da câmera SEMPRE visível */}
                    <div className="absolute -bottom-2 -right-2">
                      <Button
                        size="icon"
                        className="rounded-full h-10 w-10 shadow-lg"
                        onClick={triggerFileInput}
                      >
                        <Camera className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-semibold">
                      {session?.user?.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {session?.user?.email}
                    </p>

                    {selectedFile && (
                      <div className="mt-4 space-y-2 max-w-sm">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Upload className="h-4 w-4 text-gray-400" />
                            <span className="text-sm truncate">
                              {selectedFile.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {(selectedFile.size / 1024).toFixed(0)}KB
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={handleCancel}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Tamanho máximo: 5MB • Formatos: JPG, PNG, WebP
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Informações NÃO editáveis (só visualização) */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-500 dark:text-gray-400">
                        Nome Completo
                      </Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-900 dark:text-white">
                          {session?.user?.name || "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-500 dark:text-gray-400">
                        E-mail
                      </Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-900 dark:text-white">
                          {session?.user?.email || "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação - Mostrar apenas quando tiver foto selecionada */}
                {selectedFile && (
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      {t("perfil.cancelar", "Cancelar")}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("perfil.salvando", "Salvando...")}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t("perfil.salvarAlteracoes", "Salvar Alterações")}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Informações Adicionais */}
          <div className="space-y-6">
            {/* Status da Conta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("perfil.statusConta", "Status da Conta")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Plano Atual
                  </span>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-500">
                    Premium
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Validade
                  </span>
                  <span className="font-medium">31/12/2024</span>
                </div>
                <Button className="w-full" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t("perfil.gerenciarPlano", "Gerenciar Plano")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
