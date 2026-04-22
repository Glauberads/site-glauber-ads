import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "site-assets";
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  isConfigError?: boolean; // Indica erro de configuração (bucket não existe)
}

/**
 * Verifica se o bucket existe e está acessível
 */
export const checkBucketExists = async (): Promise<{ exists: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      // Erro ao listar buckets (possível permissão insuficiente ou timeout)
      console.warn("Error listing buckets:", error);
      return {
        exists: false,
        error: `Não foi possível verificar o bucket. Execute o SQL em setup-database-complete.sql no Supabase.`,
      };
    }

    const bucketExists = data?.some((bucket) => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      return {
        exists: false,
        error: `❌ Bucket '${BUCKET_NAME}' não existe no Supabase Storage.\n\n📋 AÇÃO NECESSÁRIA:\n1. Abra o arquivo 'setup-database-complete.sql'\n2. Copie TODO o conteúdo\n3. Vá em console.supabase.com → SQL Editor → New Query\n4. Cole o SQL e clique em Run\n\n✅ Após isso, retorne e tente fazer o upload novamente.`,
      };
    }

    return { exists: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao verificar bucket";
    return {
      exists: false,
      error: `Erro inesperado ao verificar bucket: ${errorMessage}`,
    };
  }
};
      };
    }

    return { exists: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro ao verificar bucket";
    return { exists: false, error: errorMessage };
  }
};

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

    // Verificar se bucket existe
    const bucketCheck = await checkBucketExists();
    if (!bucketCheck.exists) {
      return {
        success: false,
        error: bucketCheck.error || `Bucket '${BUCKET_NAME}' não configurado`,
        isConfigError: true,
      };
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
    const fileName = `${folder}/${timestamp}-${randomStr}.${fileExt}`;

    // Fazer upload do arquivo
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, {
      cacheControl: "3600",
      upsert: true, // Substitui se o arquivo já existe (improvável com nome único)
    });

    if (error) {
      console.error("Upload error:", error);

      // Tratamento específico para erros de bucket
      if (error.message?.includes("not found") || error.message?.includes("404")) {
        return {
          success: false,
          error: `Bucket '${BUCKET_NAME}' não encontrado. Configure o Supabase Storage conforme SETUP_STORAGE.md`,
          isConfigError: true,
        };
      }

      if (error.message?.includes("Unauthorized") || error.message?.includes("403")) {
        return {
          success: false,
          error: "Sem permissão para fazer upload. Verifique as políticas de RLS do bucket.",
          isConfigError: true,
        };
      }

      return { success: false, error: `Erro ao fazer upload: ${error.message}` };
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      return { success: false, error: "Erro ao gerar URL pública" };
    }

    return { success: true, publicUrl: urlData.publicUrl };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido no upload";
    console.error("Upload exception:", err);

    // Detectar erros de configuração/bucket
    if (errorMessage.includes("not found") || errorMessage.includes("404")) {
      return {
        success: false,
        error: `Bucket '${BUCKET_NAME}' não encontrado. Execute a configuração do Supabase Storage.`,
        isConfigError: true,
      };
    }

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
