import React, { createContext, useCallback, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  id?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  hero_bg_url?: string | null;
  whatsapp_number?: string | null;
};

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  reloadSettings: () => Promise<void>;
  saveSettings: (payload: Partial<SiteSettings>) => Promise<{ success: boolean; message?: string }>;
  updateFaviconDynamically: (url: string | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Update favicon dynamically in the DOM
 */
const updateFaviconInDOM = (faviconUrl: string | null) => {
  if (typeof window === "undefined") return;

  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }

  // Use dynamic favicon or fallback to static
  link.href = faviconUrl || "/favicon.png";
  console.log("[Settings] Favicon atualizado:", faviconUrl || "/favicon.png");
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: settings = null, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: async () => {
      console.log("[Settings] Buscando configurações do site (React Query)...");
      const { data, error: fetchError } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();

      // Se tabela não existe, cria dados vazios (fallback)
      if (fetchError?.code === "PGRST116" || fetchError?.message?.includes("not found")) {
        console.warn("[Settings] Tabela site_settings não encontrada. Usando valores padrão.");
        return { logo_url: null, favicon_url: null, hero_bg_url: null, whatsapp_number: null };
      }

      if (fetchError) {
        console.error("[Settings] Erro ao buscar configurações:", fetchError.message);
        throw new Error(fetchError.message);
      }

      return data ?? { logo_url: null, favicon_url: null, hero_bg_url: null, whatsapp_number: null };
    },
    staleTime: 1000 * 60 * 60, // 1 hora de cache: evita refetch ao navegar entre páginas
  });

  const error = queryError ? queryError.message : null;

  // Atualiza o DOM toda vez que o favicon_url mudar no cache
  useEffect(() => {
    updateFaviconInDOM(settings?.favicon_url ?? null);
  }, [settings?.favicon_url]);

  const reloadSettings = async () => {
    await refetch();
  };

  const updateFaviconDynamically = useCallback((url: string | null) => {
    updateFaviconInDOM(url);
    // Atualização Otimista no Cache
    queryClient.setQueryData(["siteSettings"], (old: SiteSettings | null) => old ? { ...old, favicon_url: url } : null);
  }, [queryClient]);

  const saveSettings = useCallback(async (payload: Partial<SiteSettings>): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log("[Settings] Salvando configurações:", payload);

      const { data: existing, error: selectErr } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
      if (selectErr) {
        console.error("[Settings] Erro ao buscar row existente:", selectErr);
        return { success: false, message: selectErr.message || "Erro ao verificar registro existente" };
      }

      if (existing?.id) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert(payload);
        if (error) throw error;
      }

      console.log("[Settings] Configurações salvas com sucesso!");

      // Invalida o cache e força um novo fetch garantindo que os dados em tela estejam 100% atualizados
      await queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("[Settings] Exceção ao salvar configurações:", err);
      return { success: false, message: errorMessage };
    }
  }, [queryClient]);

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    reloadSettings,
    saveSettings,
    updateFaviconDynamically,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

/**
 * Hook para usar as configurações do site em qualquer componente
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings deve ser usado dentro de um SettingsProvider");
  }
  return context;
};

export default SettingsContext;
