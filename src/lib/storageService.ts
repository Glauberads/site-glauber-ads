import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "site-assets";
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Valida o arquivo antes do upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: "Nenhum arquivo selecionado" };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: "Tipo de arquivo não permitido. Use PNG, JPG, WEBP ou SVG." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Arquivo muito grande. Máximo: 5MB. Atual: ${(file.size / 1024 / 1024).toFixed(2)}MB` };
  }

  return { valid: true };
};

/**
 * Faz upload de um arquivo para o bucket site-assets no Supabase Storage
 * Retorna a URL pública do arquivo
 */
export const uploadToStorage = async (file: File, folder: "logos" | "favicons"): Promise<UploadResult> => {
  try {
    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
    const fileName = `${folder}/${timestamp}-${randomStr}.${fileExt}`;

    console.log(`[Storage] Iniciando upload: ${fileName} no bucket ${BUCKET_NAME}`);

    // Fazer upload do arquivo diretamente (sem verificação de cache de bucket)
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, {
      cacheControl: "0", // Forçar sem cache para evitar problemas de cache
      upsert: true,
    });

    if (error) {
      console.error(`[Storage] Erro no upload: ${error.message}`, error);
      return { success: false, error: `Erro ao fazer upload: ${error.message}` };
    }

    console.log(`[Storage] Upload concluído: ${data.path}`);

    // Gerar URL pública do arquivo
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      console.error(`[Storage] Falha ao gerar URL pública para: ${data.path}`);
      return { success: false, error: "Erro ao gerar URL pública" };
    }

    console.log(`[Storage] URL pública gerada: ${urlData.publicUrl}`);
    return { success: true, publicUrl: urlData.publicUrl };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido no upload";
    console.error(`[Storage] Exceção no upload:`, err);
    return { success: false, error: errorMessage };
  }
};

/**
 * Remove um arquivo do Storage pelo seu caminho/URL
 */
export const deleteFromStorage = async (publicUrl: string): Promise<boolean> => {
  try {
    // Extrair o caminho do arquivo da URL pública
    const urlParts = publicUrl.split(`${BUCKET_NAME}/`);
    if (!urlParts[1]) {
      console.warn("Invalid public URL format");
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Delete exception:", err);
    return false;
  }
};
