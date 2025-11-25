"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function LoadingBarrinhas() {
  const [fase, setFase] = useState(0);
  const fases = [1, 2, 3];

  useEffect(() => {
    const interval = setInterval(() => {
      setFase((prev) => (prev + 1) % fases.length);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // ✅ URLs após o deploy - ATUALIZE COM SEU DOMÍNIO
  const imagens = {
    1: "https://becash.vercel.app/loading/1.svg",
    2: "https://becash.vercel.app/loading/2.svg",
    3: "https://becash.vercel.app/loading/3.svg"
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center space-y-8">
        <div className="relative h-20 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={fase}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="absolute"
            >
              <Image
                src={imagens[fases[fase] as keyof typeof imagens]}
                alt=""
                className="h-14 w-auto filter brightness-0 invert"
                width={20}
                height={20}
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="text-gray-400">Carregando...</p>
      </div>
    </div>
  );
}
