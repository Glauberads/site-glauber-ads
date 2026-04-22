import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => Promise<void>;
  previewUrl?: string;
  isLoading?: boolean;
  label?: string;
  placeholder?: string;
  acceptedFormats?: string;
  onRemove?: () => void;
}

export const FileUpload = ({
  onFileSelect,
  previewUrl,
  isLoading = false,
  label = "Upload de Arquivo",
  placeholder = "Clique para selecionar",
  acceptedFormats = "image/*",
  onRemove,
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      await onFileSelect(file);
    }
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      await onFileSelect(file);
    }
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-medium">{label}</label>}

      {/* Input de arquivo invisível */}
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        accept={acceptedFormats}
        className="hidden"
        disabled={isLoading}
      />

      {/* Zona de upload */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 cursor-pointer transition-all",
          isDragging
            ? "border-primary bg-primary/5 scale-105"
            : "border-border/60 bg-muted/30 hover:border-primary/60 hover:bg-primary/5",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className={cn("h-8 w-8 text-primary mb-2", isDragging && "text-primary scale-110")} />
        <p className="text-sm font-medium text-foreground">{placeholder}</p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP ou SVG (máx. 5MB)</p>

        {isLoading && <div className="mt-2 text-xs text-primary font-medium">Enviando...</div>}
      </div>

      {/* Preview e nome do arquivo */}
      {(previewUrl || fileName) && (
        <div className="space-y-2">
          {previewUrl && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border/60 bg-muted/30 flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            </div>
          )}

          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border/40">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-foreground truncate font-medium">{fileName || "Arquivo pronto"}</p>
            </div>
            {onRemove && (
              <button
                onClick={onRemove}
                className="ml-2 p-1 hover:bg-destructive/20 rounded transition-colors flex-shrink-0"
                type="button"
              >
                <X className="h-4 w-4 text-destructive" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
