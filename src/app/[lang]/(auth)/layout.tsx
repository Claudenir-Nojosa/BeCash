import { Navbar } from "@/components/landingpage/NavBar";
import { Handshake, Loader, Plane, Server } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center py-40">
      <Navbar/>
      <Link href={"/"}>
        <Image
          src="https://github.com/Claudenir-Nojosa/servidor_estaticos/blob/main/BeCash-Logo.png?raw=true"
          alt="BeCash Logo"
          width={80}
          height={80}
        />
      </Link>
      {children}
    </section>
  );
}
