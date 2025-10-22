// components/upload-image.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, X, Upload } from "lucide-react";
import { toast } from "sonner";

interface UploadImageProps {
  onImageChange: (url: string | null) => void;
  currentImage?: string | null;
}

export function UploadImage({ onImageChange, currentImage }: UploadImageProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Aqui você precisará implementar o upload para o Supabase
      // Por enquanto, vamos criar uma URL local para preview
      const objectUrl = URL.createObjectURL(file);
      onImageChange(objectUrl);
      toast.success("Imagem carregada com sucesso");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    onImageChange(null);
  };

  return (
    <div className="space-y-3">
      <Label className="text-white">Imagem de Capa</Label>

      {currentImage ? (
        <div className="relative group">
          <div className="w-full h-40 rounded-lg overflow-hidden border border-gray-700">
            <img
              src={currentImage}
              alt="Capa da meta"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={removeImage}
            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="meta-image"
            disabled={isUploading}
          />
          <Label
            htmlFor="meta-image"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-white">
                {isUploading ? "Fazendo upload..." : "Adicionar imagem de capa"}
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, JPEG até 5MB</p>
            </div>
          </Label>
        </div>
      )}
    </div>
  );
}
