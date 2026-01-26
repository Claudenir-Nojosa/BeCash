// app/[lang]/(auth)/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/landingpage/NavBar";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboardingPage = pathname?.includes("/login/onboarding");

  return (
    <section className={`flex flex-col items-center ${isOnboardingPage ? 'py-0' : 'py-40'}`}>
      {/* Mostra navbar apenas se NÃO for onboarding */}
      {!isOnboardingPage && <Navbar />}
      
      {/* Mostra logo apenas se NÃO for onboarding */}
      {!isOnboardingPage && (
        <Link href={"/"}>
          <Image
            src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
            alt="BeCash Logo"
            width={80}
            height={80}
          />
        </Link>
      )}
      
      {children}
    </section>
  );
}