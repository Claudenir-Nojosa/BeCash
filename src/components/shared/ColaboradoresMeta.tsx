"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { UserPlus, Mail, Trash2, User, Users } from "lucide-react";

interface ColaboradoresMetaProps {
  metaId: string;
  colaboradores: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    permissao: string;
  }>;
  convites: Array<{
    id: string;
    emailConvidado: string;
    status: string;
    expiraEm: string;
  }>;
  usuarioAtualEhDono: boolean;
  onColaboradoresAtualizados: () => void;
}

export function ColaboradoresMeta({
  metaId,
  colaboradores,
  convites,
  usuarioAtualEhDono,
  onColaboradoresAtualizados,
}: ColaboradoresMetaProps) {
  const [dialogConvidarAberto, setDialogConvidarAberto] = useState(false);
  const [emailConvidado, setEmailConvidado] = useState("");
  const [enviandoConvite, setEnviandoConvite] = useState(false);

  const handleConvidarColaborador = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailConvidado.trim()) {
      toast.error("Digite um email válido");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailConvidado)) {
      toast.error("Digite um email válido");
      return;
    }

    setEnviandoConvite(true);
    try {
      const response = await fetch(
        `/api/dashboard/metas/${metaId}/colaboradores`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailConvidado: emailConvidado.trim() }),
        }
      );

      if (response.ok) {
        toast.success("Convite enviado com sucesso!");
        setEmailConvidado("");
        setDialogConvidarAberto(false);
        onColaboradoresAtualizados();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar convite");
      }
    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      toast.error(error.message || "Erro ao enviar convite");
    } finally {
      setEnviandoConvite(false);
    }
  };

  const handleRemoverColaborador = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/metas/${metaId}/colaboradores/${userId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Colaborador removido com sucesso!");
        onColaboradoresAtualizados();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao remover colaborador");
      }
    } catch (error: any) {
      console.error("Erro ao remover colaborador:", error);
      toast.error(error.message || "Erro ao remover colaborador");
    }
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">Colaboradores</p>
        {usuarioAtualEhDono && (
          <Dialog
            open={dialogConvidarAberto}
            onOpenChange={setDialogConvidarAberto}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Convidar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Convidar Colaborador</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Envie um convite para alguém acompanhar esta meta
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleConvidarColaborador} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email do Colaborador
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailConvidado}
                    onChange={(e) => setEmailConvidado(e.target.value)}
                    placeholder="colaborador@email.com"
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogConvidarAberto(false)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={enviandoConvite}
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    {enviandoConvite ? "Enviando..." : "Enviar Convite"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista de Colaboradores */}
      <div className="space-y-2">
        {/* Colaboradores */}
        {colaboradores.map((colaborador) => (
          <div
            key={colaborador.id}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={colaborador.user.image || ""} />
                <AvatarFallback className="bg-green-600 text-white text-xs">
                  {colaborador.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">
                  {colaborador.user.name}
                </p>
                <p className="text-xs text-gray-400">
                  {colaborador.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-900/50 text-green-300 border-green-700">
                {colaborador.permissao === "LEITURA" ? "Leitura" : "Escrita"}
              </Badge>
              {usuarioAtualEhDono && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoverColaborador(colaborador.user.id)
                        }
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white border-gray-700">
                      <p>Remover colaborador</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        ))}

        {/* Convites Pendentes - Só mostrar para o dono */}
        {usuarioAtualEhDono &&
          convites.map((convite) => (
            <div
              key={convite.id}
              className="flex items-center justify-between p-2 rounded-lg bg-yellow-900/20 border border-yellow-800/50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-yellow-600 text-white text-xs">
                    <Mail className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-yellow-300">
                    {convite.emailConvidado}
                  </p>
                  <p className="text-xs text-yellow-400">
                    Convite pendente - Expira {formatarData(convite.expiraEm)}
                  </p>
                </div>
              </div>
              <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">
                Pendente
              </Badge>
            </div>
          ))}

        {colaboradores.length === 0 &&
          (!usuarioAtualEhDono || convites.length === 0) && (
            <div className="text-center py-4 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum colaborador</p>
              {usuarioAtualEhDono && (
                <p className="text-xs">Convide alguém para colaborar</p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
