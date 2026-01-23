import BotaoGoogleClient from "./botaoGoogleClient";

interface BotaoGoogleServerProps {
  lang?: string;
}

export default function BotaoGoogleServer({ lang = "pt" }: BotaoGoogleServerProps) {
  return <BotaoGoogleClient lang={lang} />;
}