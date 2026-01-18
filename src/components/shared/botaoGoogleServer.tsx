// components/BotaoGoogleServer.tsx
import BotaoGoogleClient from "./botaoGoogleClient";

// Defina as props do componente
interface BotaoGoogleServerProps {
  lang?: string;
}

export default function BotaoGoogleServer({ lang = "pt" }: BotaoGoogleServerProps) {
  return <BotaoGoogleClient lang={lang} />;
}