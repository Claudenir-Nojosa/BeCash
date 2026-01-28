"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Smartphone,
  CheckCircle2,
  MessageCircle,
  Mic,
  Zap,
  Trash2,
  Shield,
  Globe,
  Bell,
  Lock,
} from "lucide-react";
import { Loading } from "@/components/ui/loading-barrinhas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { getFallback } from "@/lib/i18nFallback";

interface PhoneInfo {
  temTelefoneVinculado: boolean;
  telefone: string | null;
  usuario: {
    name: string | null;
    email: string | null;
  };
}

export default function VincularTelefone() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [step, setStep] = useState<"phone" | "code">("phone"); // Novo estado para controlar o passo
  const [verificationCode, setVerificationCode] = useState(""); // Código digitado pelo usuário
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // Tempo restante do código
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3); // Tentativas restantes
  const { t, i18n } = useTranslation("vincularTelefone");
  const currentLang = (params?.lang as string) || "pt";
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneInfo?.temTelefoneVinculado) {
      setMessage({
        type: "error",
        text: translations.mensagens.jaVinculado,
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/usuarios/vincular-telefone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "request_code",
          telefone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message || "Código enviado via WhatsApp!",
        });
        setStep("code");
        setTimeLeft(data.expiresIn || 600);
        setAttemptsLeft(3);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Erro ao solicitar código",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao solicitar código de verificação",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({
        type: "error",
        text: "Digite o código de 6 dígitos",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/usuarios/vincular-telefone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verify_code",
          telefone,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message || translations.mensagens.vinculadoSucesso,
        });
        setTelefone("");
        setVerificationCode("");
        setStep("phone");
        await fetchPhoneInfo();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Código inválido",
        });

        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }

        // Se não há mais tentativas, voltar para o início
        if (data.attemptsLeft === 0) {
          setTimeout(() => {
            setStep("phone");
            setVerificationCode("");
            setTelefone("");
          }, 3000);
        }
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao verificar código",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setVerificationCode("");
    setMessage(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  // Função auxiliar para obter tradução com fallback
  const getTranslation = (key: string) => {
    // Primeiro tenta usar o i18n
    const translation = t(key);
    if (translation && translation !== key) {
      return translation;
    }

    // Fallback manual baseado nas chaves que você tem nos arquivos JSON
    switch (key) {
      // Títulos
      case "titulo":
        return getFallback(currentLang, "Vincular Telefone", "Link Phone");
      case "subtitulo":
        return getFallback(
          currentLang,
          "Conecte seu telefone para receber notificações",
          "Connect your phone to receive notifications",
        );
      case "verificacao.codigoEnviadoPara":
        return getFallback(
          currentLang,
          "Código enviado para:",
          "Code sent to:",
        );
      case "verificacao.expiraEm":
        return getFallback(currentLang, "⏰ Expira em:", "⏰ Expires in:");
      case "verificacao.codigoExpirado":
        return getFallback(
          currentLang,
          "⚠️ Código expirado. Solicite um novo código.",
          "⚠️ Code expired. Request a new code.",
        );
      case "verificacao.tentativasRestantes":
        return getFallback(
          currentLang,
          "⚠️ {attempts} tentativa(s) restante(s)",
          "⚠️ {attempts} attempt(s) remaining",
        );
      case "verificacao.digiteCodigo":
        return getFallback(
          currentLang,
          "Digite o código de 6 dígitos enviado via WhatsApp",
          "Enter the 6-digit code sent via WhatsApp",
        );
      case "verificacao.codigoPlaceholder":
        return getFallback(currentLang, "000000", "000000");
      case "verificacao.voltar":
        return getFallback(currentLang, "← Voltar", "← Back");
      case "verificacao.verificar":
        return getFallback(currentLang, "Verificar", "Verify");
      case "verificacao.solicitarNovoCodigo":
        return getFallback(
          currentLang,
          "Solicitar novo código",
          "Request new code",
        );
      case "verificacao.titulo":
        return getFallback(currentLang, "Verificar Código", "Verify Code");
      case "verificacao.descricao":
        return getFallback(
          currentLang,
          "Digite o código de 6 dígitos enviado via WhatsApp",
          "Enter the 6-digit code sent via WhatsApp",
        );
      // Formulário
      case "formulario.labelTelefone":
        return getFallback(currentLang, "Número de telefone", "Phone number");
      case "formulario.placeholderTelefone":
        return getFallback(currentLang, "(11) 99999-9999", "(11) 99999-9999");
      case "formulario.instrucaoTelefone":
        return getFallback(
          currentLang,
          "Digite seu número com DDD",
          "Enter your number with area code",
        );
      case "formulario.labelIdioma":
        return getFallback(
          currentLang,
          "Idioma preferido para notificações",
          "Preferred language for notifications",
        );
      case "formulario.placeholderIdioma":
        return getFallback(
          currentLang,
          "Selecione um idioma",
          "Select a language",
        );
      case "formulario.instrucaoIdioma":
        return getFallback(
          currentLang,
          "Esta configuração define o idioma das mensagens que você receberá.",
          "This setting defines the language of the messages you will receive.",
        );

      // Botões
      case "botoes.vincularTelefone":
        return getFallback(currentLang, "Vincular Telefone", "Link Phone");
      case "botoes.desvincular":
        return getFallback(currentLang, "Desvincular", "Unlink");
      case "botoes.salvarIdioma":
        return getFallback(currentLang, "Salvar Idioma", "Save Language");
      case "botoes.cancelar":
        return getFallback(currentLang, "Cancelar", "Cancel");
      case "botoes.desconectar":
        return getFallback(currentLang, "Desconectar", "Disconnect");
      case "botoes.enviarCodigo":
        return getFallback(
          currentLang,
          "Enviar Código via WhatsApp",
          "Send Code via WhatsApp",
        );
      // Estados
      case "estados.vinculando":
        return getFallback(currentLang, "Vinculando...", "Linking...");
      case "estados.desvinculando":
        return getFallback(currentLang, "Desvinculando...", "Unlinking...");
      case "estados.salvando":
        return getFallback(currentLang, "Salvando...", "Saving...");
      case "estados.salvandoConfiguracao":
        return getFallback(
          currentLang,
          "Salvando configuração...",
          "Saving configuration...",
        );
      case "estados.processando":
        return getFallback(currentLang, "Processando...", "Processing...");

      // Mensagens
      case "mensagens.erroCarregar":
        return getFallback(
          currentLang,
          "Erro ao carregar informações",
          "Error loading information",
        );
      case "mensagens.erroConfiguracoes":
        return getFallback(
          currentLang,
          "Erro ao carregar configurações",
          "Error loading settings",
        );
      case "mensagens.idiomaSalvo":
        return getFallback(
          currentLang,
          "Idioma salvo com sucesso!",
          "Language saved successfully!",
        );
      case "mensagens.jaVinculado":
        return getFallback(
          currentLang,
          "Você já possui um telefone vinculado. Desvincule primeiro para adicionar outro.",
          "You already have a linked phone. Unlink first to add another.",
        );
      case "mensagens.vinculadoSucesso":
        return getFallback(
          currentLang,
          "Telefone vinculado com sucesso!",
          "Phone linked successfully!",
        );
      case "mensagens.desvinculadoSucesso":
        return getFallback(
          currentLang,
          "Telefone desvinculado com sucesso!",
          "Phone unlinked successfully!",
        );
      case "verificacao.labelCodigo":
        return getFallback(
          currentLang,
          "Código de Verificação",
          "Verification Code",
        );
      // Erros
      case "erros.salvarIdioma":
        return getFallback(
          currentLang,
          "Erro ao salvar idioma",
          "Error saving language",
        );
      case "erros.vincularTelefone":
        return getFallback(
          currentLang,
          "Erro ao vincular telefone",
          "Error linking phone",
        );
      case "erros.desvincularTelefone":
        return getFallback(
          currentLang,
          "Erro ao desvincular telefone",
          "Error unlinking phone",
        );

      // Labels
      case "labels.usuario":
        return getFallback(currentLang, "Usuário", "User");

      // Idiomas
      case "idiomas.portugues":
        return getFallback(
          currentLang,
          "Português (Brasil)",
          "Portuguese (Brazil)",
        );
      case "idiomas.ingles":
        return getFallback(currentLang, "English (US)", "English (US)");

      // Cartões - Telefone Vinculado
      case "cartoes.telefoneVinculado.titulo":
        return getFallback(currentLang, "Telefone Vinculado", "Linked Phone");
      case "cartoes.telefoneVinculado.descricao":
        return getFallback(
          currentLang,
          "Seu telefone está vinculado e pronto para receber notificações.",
          "Your phone is linked and ready to receive notifications.",
        );

      // Cartões - Segurança
      case "cartoes.seguranca.titulo":
        return getFallback(currentLang, "Segurança", "Security");
      case "cartoes.seguranca.descricao":
        return getFallback(
          currentLang,
          "Seu telefone está protegido e não será compartilhado com terceiros.",
          "Your phone is protected and will not be shared with third parties.",
        );

      // Cartões - Vincular Telefone
      case "cartoes.vincularTelefone.titulo":
        return getFallback(currentLang, "Vincular Telefone", "Link Phone");
      case "cartoes.vincularTelefone.descricao":
        return getFallback(
          currentLang,
          "Adicione seu número para receber notificações",
          "Add your number to receive notifications",
        );

      // Cartões - Idioma
      case "cartoes.idioma.titulo":
        return getFallback(
          currentLang,
          "Preferência de Idioma",
          "Language Preference",
        );
      case "cartoes.idioma.descricao":
        return getFallback(
          currentLang,
          "Escolha o idioma das suas notificações",
          "Choose your notification language",
        );
      case "cartoes.idioma.atualSalvo":
        return getFallback(
          currentLang,
          "Idioma atual salvo:",
          "Current saved language:",
        );

      // Benefícios
      case "beneficios.titulo":
        return getFallback(currentLang, "Por que conectar?", "Why connect?");
      case "beneficios.subtitulo":
        return getFallback(
          currentLang,
          "Vantagens de usar o WhatsApp",
          "Advantages of using WhatsApp",
        );
      case "beneficios.alertas.titulo":
        return getFallback(
          currentLang,
          "Alertas Instantâneos",
          "Instant Alerts",
        );
      case "beneficios.alertas.descricao":
        return getFallback(
          currentLang,
          "Receba notificações em tempo real sobre seus lançamentos",
          "Receive real-time notifications about your transactions",
        );
      case "beneficios.comandos.titulo":
        return getFallback(currentLang, "Comandos por Voz", "Voice Commands");
      case "beneficios.comandos.descricao":
        return getFallback(
          currentLang,
          "Registre gastos usando áudio - rápido e prático",
          "Record expenses using audio - fast and practical",
        );
      case "beneficios.acesso.titulo":
        return getFallback(currentLang, "Acesso Rápido", "Quick Access");
      case "beneficios.acesso.descricao":
        return getFallback(
          currentLang,
          "Consulte informações importantes sem abrir o app",
          "Check important information without opening the app",
        );
      case "beneficios.seguranca.titulo":
        return getFallback(currentLang, "Segurança Total", "Total Security");
      case "beneficios.seguranca.descricao":
        return getFallback(
          currentLang,
          "Seu número é protegido com criptografia de ponta",
          "Your number is protected with state-of-the-art encryption",
        );

      // Privacidade
      case "privacidade.titulo":
        return getFallback(currentLang, "Sua Privacidade", "Your Privacy");
      case "privacidade.descricao":
        return getFallback(
          currentLang,
          "Usamos seu número apenas para enviar notificações. Nunca faremos spam ou compartilharemos seus dados.",
          "We use your number only to send notifications. We will never spam or share your data.",
        );
      case "privacidade.criptografia":
        return getFallback(
          currentLang,
          "Protegido por criptografia de ponta a ponta",
          "Protected by end-to-end encryption",
        );

      // Confirmação
      case "confirmacao.titulo":
        return getFallback(
          currentLang,
          "Desconectar WhatsApp",
          "Disconnect WhatsApp",
        );
      case "confirmacao.descricao":
        return getFallback(
          currentLang,
          "Tem certeza que deseja desconectar o número {{telefone}}?",
          "Are you sure you want to disconnect the number {{telefone}}?",
        );
      case "confirmacao.aviso":
        return getFallback(
          currentLang,
          "Você não conseguirá realizar os lançamentos via Whatsapp até conectar novamente.",
          "You will not be able to make transactions via WhatsApp until you connect again.",
        );

      default:
        return key;
    }
  };

  // Criar um objeto de traduções para fácil acesso
  const translations = {
    titulo: getTranslation("titulo"),
    subtitulo: getTranslation("subtitulo"),

    formulario: {
      labelTelefone: getTranslation("formulario.labelTelefone"),
      placeholderTelefone: getTranslation("formulario.placeholderTelefone"),
      instrucaoTelefone: getTranslation("formulario.instrucaoTelefone"),
      labelIdioma: getTranslation("formulario.labelIdioma"),
      placeholderIdioma: getTranslation("formulario.placeholderIdioma"),
      instrucaoIdioma: getTranslation("formulario.instrucaoIdioma"),
    },
    verificacao: {
      labelCodigo: getTranslation("verificacao.labelCodigo"),
      codigoEnviadoPara: getTranslation("verificacao.codigoEnviadoPara"),
      expiraEm: getTranslation("verificacao.expiraEm"),
      codigoExpirado: getTranslation("verificacao.codigoExpirado"),
      tentativasRestantes: getTranslation("verificacao.tentativasRestantes"),
      digiteCodigo: getTranslation("verificacao.digiteCodigo"),
      codigoPlaceholder: getTranslation("verificacao.codigoPlaceholder"),
      voltar: getTranslation("verificacao.voltar"),
      verificar: getTranslation("verificacao.verificar"),
      solicitarNovoCodigo: getTranslation("verificacao.solicitarNovoCodigo"),
      titulo: getTranslation("verificacao.titulo"),
      descricao: getTranslation("verificacao.descricao"),
    },
    botoes: {
      vincularTelefone: getTranslation("botoes.vincularTelefone"),
      desvincular: getTranslation("botoes.desvincular"),
      salvarIdioma: getTranslation("botoes.salvarIdioma"),
      cancelar: getTranslation("botoes.cancelar"),
      desconectar: getTranslation("botoes.desconectar"),
      enviarCodigo: getTranslation("botoes.enviarCodigo"),
    },

    estados: {
      vinculando: getTranslation("estados.vinculando"),
      desvinculando: getTranslation("estados.desvinculando"),
      salvando: getTranslation("estados.salvando"),
      salvandoConfiguracao: getTranslation("estados.salvandoConfiguracao"),
      processando: getTranslation("estados.processando"),
    },

    mensagens: {
      erroCarregar: getTranslation("mensagens.erroCarregar"),
      erroConfiguracoes: getTranslation("mensagens.erroConfiguracoes"),
      idiomaSalvo: getTranslation("mensagens.idiomaSalvo"),
      jaVinculado: getTranslation("mensagens.jaVinculado"),
      vinculadoSucesso: getTranslation("mensagens.vinculadoSucesso"),
      desvinculadoSucesso: getTranslation("mensagens.desvinculadoSucesso"),
    },

    erros: {
      salvarIdioma: getTranslation("erros.salvarIdioma"),
      vincularTelefone: getTranslation("erros.vincularTelefone"),
      desvincularTelefone: getTranslation("erros.desvincularTelefone"),
    },

    labels: {
      usuario: getTranslation("labels.usuario"),
    },

    idiomas: {
      portugues: getTranslation("idiomas.portugues"),
      ingles: getTranslation("idiomas.ingles"),
    },

    cartoes: {
      telefoneVinculado: {
        titulo: getTranslation("cartoes.telefoneVinculado.titulo"),
        descricao: getTranslation("cartoes.telefoneVinculado.descricao"),
      },
      seguranca: {
        titulo: getTranslation("cartoes.seguranca.titulo"),
        descricao: getTranslation("cartoes.seguranca.descricao"),
      },
      vincularTelefone: {
        titulo: getTranslation("cartoes.vincularTelefone.titulo"),
        descricao: getTranslation("cartoes.vincularTelefone.descricao"),
      },
      idioma: {
        titulo: getTranslation("cartoes.idioma.titulo"),
        descricao: getTranslation("cartoes.idioma.descricao"),
        atualSalvo: getTranslation("cartoes.idioma.atualSalvo"),
      },
    },

    beneficios: {
      titulo: getTranslation("beneficios.titulo"),
      subtitulo: getTranslation("beneficios.subtitulo"),
      alertas: {
        titulo: getTranslation("beneficios.alertas.titulo"),
        descricao: getTranslation("beneficios.alertas.descricao"),
      },
      comandos: {
        titulo: getTranslation("beneficios.comandos.titulo"),
        descricao: getTranslation("beneficios.comandos.descricao"),
      },
      acesso: {
        titulo: getTranslation("beneficios.acesso.titulo"),
        descricao: getTranslation("beneficios.acesso.descricao"),
      },
      seguranca: {
        titulo: getTranslation("beneficios.seguranca.titulo"),
        descricao: getTranslation("beneficios.seguranca.descricao"),
      },
    },

    privacidade: {
      titulo: getTranslation("privacidade.titulo"),
      descricao: getTranslation("privacidade.descricao"),
      criptografia: getTranslation("privacidade.criptografia"),
    },

    confirmacao: {
      titulo: getTranslation("confirmacao.titulo"),
      descricao: getTranslation("confirmacao.descricao"),
      aviso: getTranslation("confirmacao.aviso"),
    },
  };

  const [phoneInfo, setPhoneInfo] = useState<PhoneInfo | null>(null);
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhoneInfo, setLoadingPhoneInfo] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("pt-BR");
  const [savedLanguage, setSavedLanguage] = useState("pt-BR");

  const getLocalizedPath = (path: string) => {
    return `/${i18n.language}${path}`;
  };

  const fetchPhoneInfo = useCallback(async () => {
    try {
      setLoadingPhoneInfo(true);
      const response = await fetch("/api/usuarios/vincular-telefone");
      const data = await response.json();

      if (data.success) {
        setPhoneInfo(data);
      } else {
        setMessage({
          type: "error",
          text: translations.mensagens.erroCarregar,
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: translations.mensagens.erroCarregar });
    } finally {
      setLoadingPhoneInfo(false);
    }
  }, [translations.mensagens.erroCarregar]);

  const fetchUserConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/configuracoes");
      const data = await response.json();

      if (data.configuracoes) {
        setSelectedLanguage(data.configuracoes.idioma || "pt-BR");
        setSavedLanguage(data.configuracoes.idioma || "pt-BR");
      }
    } catch (error) {
      console.error(translations.mensagens.erroConfiguracoes, error);
    }
  }, [translations.mensagens.erroConfiguracoes]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPhoneInfo();
      fetchUserConfig();
    }
  }, [status, fetchPhoneInfo, fetchUserConfig]);

  const handleSaveLanguage = async () => {
    setSavingLanguage(true);
    setMessage(null);

    try {
      const response = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idioma: selectedLanguage }),
      });

      const data = await response.json();

      if (data.success) {
        setSavedLanguage(selectedLanguage);
        setMessage({
          type: "success",
          text: translations.mensagens.idiomaSalvo,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || translations.erros.salvarIdioma,
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: translations.erros.salvarIdioma });
    } finally {
      setSavingLanguage(false);
    }
  };

  if (status === "loading" || loadingPhoneInfo) {
    return <Loading />;
  }

  if (!session) {
    router.push(getLocalizedPath("/login"));
    return null;
  }


  const handleDeletePhone = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/usuarios/vincular-telefone", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: translations.mensagens.desvinculadoSucesso,
        });
        await fetchPhoneInfo();
      } else {
        setMessage({
          type: "error",
          text: data.error || translations.erros.desvincularTelefone,
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: translations.erros.desvincularTelefone,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length <= 11) {
      if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      }
      if (value.length > 10) {
        value = `${value.slice(0, 10)}-${value.slice(10)}`;
      }
    }

    setTelefone(value);
  };

  const formatPhoneForDisplay = (phone: string | null) => {
    if (!phone) return "";

    const numbers = phone.replace(/\D/g, "");

    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }

    return phone;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-3 sm:gap-4"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {translations.titulo}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {translations.subtitulo}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Formulário de Vinculação */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Card de Preferências de Idioma */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xl">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-gray-900 dark:text-white">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                    {translations.cartoes.idioma.titulo}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {translations.cartoes.idioma.descricao}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label
                        htmlFor="language"
                        className="text-sm sm:text-base text-gray-900 dark:text-white"
                      >
                        {translations.formulario.labelIdioma}
                      </Label>
                      <Select
                        value={selectedLanguage}
                        onValueChange={setSelectedLanguage}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                          <SelectValue
                            placeholder={
                              translations.formulario.placeholderIdioma
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🇧🇷</span>
                              <span>{translations.idiomas.portugues}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="en-US">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🇺🇸</span>
                              <span>{translations.idiomas.ingles}</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {translations.formulario.instrucaoIdioma}
                      </p>
                    </div>

                    <Button
                      onClick={handleSaveLanguage}
                      disabled={savingLanguage}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {savingLanguage ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{translations.estados.salvando}</span>
                        </div>
                      ) : (
                        translations.botoes.salvarIdioma
                      )}
                    </Button>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {translations.cartoes.idioma.atualSalvo}
                      </p>
                      <div className="flex items-center gap-2">
                        {savedLanguage === "pt-BR" ? (
                          <>
                            <span className="text-2xl">🇧🇷</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {translations.idiomas.portugues}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">🇺🇸</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {translations.idiomas.ingles}
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {/* Card de Telefone Vinculado */}
            <AnimatePresence mode="wait">
              {phoneInfo?.temTelefoneVinculado && phoneInfo.telefone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white dark:bg-gray-900 border-green-200 dark:border-green-800 shadow-2xl">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center justify-between text-lg sm:text-xl text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/icons/whatsapp.png"
                            alt="WhatsApp"
                            width={20}
                            height={20}
                            className="h-6 w-6 sm:h-5 sm:w-5"
                          />
                          {translations.cartoes.telefoneVinculado.titulo}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteDialog(true)}
                          disabled={isDeleting}
                          className="border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700"
                        >
                          {isDeleting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              {translations.estados.desvinculando}
                            </div>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              {translations.botoes.desvincular}
                            </>
                          )}
                        </Button>
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        {translations.cartoes.telefoneVinculado.descricao}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="space-y-4">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {phoneInfo.usuario.name ||
                                  translations.labels.usuario}
                              </p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                {formatPhoneForDisplay(phoneInfo.telefone)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {phoneInfo.usuario.email}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800"
                        >
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {translations.cartoes.seguranca.titulo}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {translations.cartoes.seguranca.descricao}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Card de Vincular Novo Telefone */}
              {!phoneInfo?.temTelefoneVinculado && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="border-2 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                          <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        {step === "phone"
                          ? translations.cartoes.vincularTelefone.titulo
                          : translations.verificacao.titulo}
                      </CardTitle>
                      <CardDescription>
                        {step === "phone"
                          ? translations.cartoes.vincularTelefone.descricao
                          : translations.verificacao.descricao}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <AnimatePresence mode="wait">
                        {/* PASSO 1: Inserir Telefone */}
                        {step === "phone" && (
                          <motion.form
                            key="phone-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleRequestCode}
                            className="space-y-6"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="telefone">
                                {translations.formulario.labelTelefone}
                              </Label>
                              <Input
                                id="telefone"
                                type="tel"
                                value={telefone}
                                onChange={handleTelefoneChange}
                                placeholder={
                                  translations.formulario.placeholderTelefone
                                }
                                className="text-lg"
                                maxLength={15}
                                required
                              />
                              <p className="text-sm text-muted-foreground">
                                {translations.formulario.instrucaoTelefone}
                              </p>
                            </div>

                            {message && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-lg border ${
                                  message.type === "success"
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {message.type === "success" ? (
                                    <>
                                      <CheckCircle2 className="w-5 h-5" />
                                      {message.text}
                                    </>
                                  ) : (
                                    <>❌ {message.text}</>
                                  )}
                                </div>
                              </motion.div>
                            )}

                            <Button
                              type="submit"
                              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                              size="lg"
                              disabled={loading || !telefone}
                            >
                              {loading ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  {translations.estados.processando}
                                </div>
                              ) : (
                                <>
                                  <MessageCircle className="w-5 h-5 mr-2" />
                                  {translations.botoes.enviarCodigo}
                                </>
                              )}
                            </Button>
                          </motion.form>
                        )}

                        {/* PASSO 2: Verificar Código */}
                        {step === "code" && (
                          <motion.form
                            key="code-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleVerifyCode}
                            className="space-y-6"
                          >
                            {/* Timer e Telefone */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  {translations.verificacao.codigoEnviadoPara}
                                </span>
                                <span className="font-mono font-bold">
                                  {formatPhoneForDisplay(telefone)}
                                </span>
                              </div>

                              {timeLeft !== null && timeLeft > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    {translations.verificacao.expiraEm}
                                  </span>
                                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {formatTime(timeLeft)}
                                  </span>
                                </div>
                              )}

                              {timeLeft === 0 && (
                                <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                                  {translations.verificacao.codigoExpirado}
                                </div>
                              )}
                            </div>

                            {/* Input do Código */}
                            <div className="space-y-2">
                              <Label htmlFor="code" className="text-lg">
                                {translations.verificacao.labelCodigo}
                              </Label>
                              <Input
                                id="code"
                                type="text"
                                value={verificationCode}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    "",
                                  );
                                  if (value.length <= 6) {
                                    setVerificationCode(value);
                                  }
                                }}
                                placeholder={
                                  translations.verificacao.codigoPlaceholder
                                }
                                className="text-center text-2xl font-mono tracking-widest"
                                maxLength={6}
                                required
                                autoFocus
                              />
                              <p className="text-sm text-muted-foreground text-center">
                                {translations.verificacao.digiteCodigo}
                              </p>

                              {attemptsLeft < 3 && (
                                <p className="text-sm text-amber-600 dark:text-amber-400 text-center font-medium">
                                  {translations.verificacao.tentativasRestantes.replace(
                                    "{attempts}",
                                    attemptsLeft.toString(),
                                  )}
                                </p>
                              )}
                            </div>

                            {message && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-lg border ${
                                  message.type === "success"
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {message.type === "success" ? (
                                    <>
                                      <CheckCircle2 className="w-5 h-5" />
                                      {message.text}
                                    </>
                                  ) : (
                                    <>❌ {message.text}</>
                                  )}
                                </div>
                              </motion.div>
                            )}

                            {/* Botões */}
                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={handleBackToPhone}
                                disabled={loading}
                              >
                                {translations.verificacao.voltar}
                              </Button>

                              <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                size="lg"
                                disabled={
                                  loading ||
                                  !verificationCode ||
                                  verificationCode.length !== 6 ||
                                  timeLeft === 0
                                }
                              >
                                {loading ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {translations.estados.processando}
                                  </div>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    {translations.verificacao.verificar}
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Reenviar código */}
                            {timeLeft === 0 && (
                              <Button
                                type="button"
                                variant="link"
                                className="w-full text-blue-600 dark:text-blue-400"
                                onClick={() => {
                                  setStep("phone");
                                  setVerificationCode("");
                                  setMessage(null);
                                }}
                              >
                                {translations.verificacao.solicitarNovoCodigo}
                              </Button>
                            )}
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar de Benefícios */}
          <div className="space-y-6 sm:space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
                    {translations.beneficios.titulo}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {translations.beneficios.subtitulo}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      icon: Bell,
                      gradient: "from-green-500 to-emerald-600",
                      bg: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
                      border: "border-green-100 dark:border-green-800/50",
                      titulo: translations.beneficios.alertas.titulo,
                      descricao: translations.beneficios.alertas.descricao,
                      delay: 0.2,
                    },
                    {
                      icon: Mic,
                      gradient: "from-blue-500 to-cyan-600",
                      bg: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
                      border: "border-blue-100 dark:border-blue-800/50",
                      titulo: translations.beneficios.comandos.titulo,
                      descricao: translations.beneficios.comandos.descricao,
                      delay: 0.3,
                    },
                    {
                      icon: Zap,
                      gradient: "from-purple-500 to-pink-600",
                      bg: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
                      border: "border-purple-100 dark:border-purple-800/50",
                      titulo: translations.beneficios.acesso.titulo,
                      descricao: translations.beneficios.acesso.descricao,
                      delay: 0.4,
                    },
                    {
                      icon: Lock,
                      gradient: "from-amber-500 to-orange-600",
                      bg: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
                      border: "border-amber-100 dark:border-amber-800/50",
                      titulo: translations.beneficios.seguranca.titulo,
                      descricao: translations.beneficios.seguranca.descricao,
                      delay: 0.5,
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.delay }}
                      className={`p-4 bg-gradient-to-br ${item.bg} rounded-2xl border ${item.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 bg-gradient-to-r ${item.gradient} rounded-xl`}
                        >
                          <item.icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.titulo}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.descricao}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 overflow-hidden">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="inline-flex p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl mb-4">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                      {translations.privacidade.titulo}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {translations.privacidade.descricao}
                    </p>
                    <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      {translations.privacidade.criptografia}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Dialog de Confirmação para Desvincular */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl text-gray-900 dark:text-white">
                  {translations.confirmacao.titulo}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                  {translations.confirmacao.descricao.replace(
                    "{{telefone}}",
                    formatPhoneForDisplay(phoneInfo?.telefone || ""),
                  )}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-200 dark:border-red-800 mb-6">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⚠️ {translations.confirmacao.aviso}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl"
            >
              {translations.botoes.cancelar}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhone}
              disabled={isDeleting}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-lg rounded-xl"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {translations.estados.processando}
                </div>
              ) : (
                translations.botoes.desconectar
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
